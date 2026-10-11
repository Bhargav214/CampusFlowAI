import pytest
from tests.conftest import make_user, make_student_profile, make_subject, make_attendance, make_mark
from models.parent_student import ParentStudentLink
from models.notification import ParentNotification


class TestParentSupervisionPortal:

    def test_parent_approved_access(self, client, db):
        # Create student and parent
        stu_user, _ = make_user(db, "student_linked@test.com", "student")
        student = make_student_profile(db, stu_user.id, roll_number="PRT001")

        parent_user, parent_token = make_user(db, "parent_approved@test.com", "parent")

        # Admin approves link
        link = ParentStudentLink(
            parent_user_id=parent_user.id,
            student_id=student.id,
            relationship_type="parent",
            status="approved"
        )
        db.add(link)
        db.commit()

        headers = {"Authorization": f"Bearer {parent_token}"}

        # Check Parent Dashboard
        dash_res = client.get("/parent/dashboard", headers=headers)
        assert dash_res.status_code == 200, dash_res.text
        data = dash_res.json()
        assert data["total_linked_students"] == 1
        assert data["students"][0]["student_id"] == student.id

        # Check student attendance & marks endpoints
        att_res = client.get(f"/parent/students/{student.id}/attendance", headers=headers)
        assert att_res.status_code == 200

        marks_res = client.get(f"/parent/students/{student.id}/marks", headers=headers)
        assert marks_res.status_code == 200

        analytics_res = client.get(f"/parent/students/{student.id}/analytics", headers=headers)
        assert analytics_res.status_code == 200
        assert "disclaimer" in analytics_res.json()

    def test_parent_cannot_access_unlinked_student(self, client, db):
        stu1, _ = make_user(db, "student1@test.com", "student")
        student1 = make_student_profile(db, stu1.id, roll_number="PRT002")

        stu2, _ = make_user(db, "student2_unlinked@test.com", "student")
        student2 = make_student_profile(db, stu2.id, roll_number="PRT003")

        parent_user, parent_token = make_user(db, "parent_single@test.com", "parent")

        # Link ONLY to student1
        link = ParentStudentLink(
            parent_user_id=parent_user.id,
            student_id=student1.id,
            relationship_type="parent",
            status="approved"
        )
        db.add(link)
        db.commit()

        headers = {"Authorization": f"Bearer {parent_token}"}

        # Attempt to access student2 (unlinked)
        res = client.get(f"/parent/students/{student2.id}/attendance", headers=headers)
        assert res.status_code == 403
        assert "Access denied" in res.json()["detail"]

    def test_parent_cannot_access_pending_or_revoked_link(self, client, db):
        stu, _ = make_user(db, "student_revoked@test.com", "student")
        student = make_student_profile(db, stu.id, roll_number="PRT004")

        parent_user, parent_token = make_user(db, "parent_revoked@test.com", "parent")

        # Revoked link
        link = ParentStudentLink(
            parent_user_id=parent_user.id,
            student_id=student.id,
            relationship_type="parent",
            status="revoked"
        )
        db.add(link)
        db.commit()

        headers = {"Authorization": f"Bearer {parent_token}"}

        res = client.get(f"/parent/students/{student.id}/attendance", headers=headers)
        assert res.status_code == 403

    def test_parent_notification_isolation(self, client, db):
        p1, token1 = make_user(db, "parentA@test.com", "parent")
        p2, token2 = make_user(db, "parentB@test.com", "parent")

        stu, _ = make_user(db, "student_notif@test.com", "student")
        student = make_student_profile(db, stu.id, roll_number="PRT005")

        n1 = ParentNotification(parent_user_id=p1.id, student_id=student.id, title="Alert A", message="Msg A")
        n2 = ParentNotification(parent_user_id=p2.id, student_id=student.id, title="Alert B", message="Msg B")
        db.add_all([n1, n2])
        db.commit()

        h1 = {"Authorization": f"Bearer {token1}"}
        h2 = {"Authorization": f"Bearer {token2}"}

        # Parent 1 gets only Alert A
        r1 = client.get("/parent/notifications", headers=h1)
        assert len(r1.json()) == 1
        assert r1.json()[0]["title"] == "Alert A"

        # Parent 1 cannot mark Parent 2's notification as read
        patch_res = client.patch(f"/parent/notifications/{n2.id}/read", headers=h1)
        assert patch_res.status_code == 404

    def test_parent_restricted_from_admin_and_faculty_actions(self, client, db):
        parent, token = make_user(db, "parent_restricted@test.com", "parent")
        headers = {"Authorization": f"Bearer {token}"}

        assert client.get("/reports/attendance", headers=headers).status_code == 403
        assert client.post("/etl/attendance", headers=headers).status_code == 403
        assert client.post("/analytics/ml/train", headers=headers).status_code == 403
        assert client.get("/faculty/", headers=headers).status_code == 403

    def test_student_cannot_access_parent_portal(self, client, db):
        stu, token = make_user(db, "student_no_parent@test.com", "student")
        headers = {"Authorization": f"Bearer {token}"}

        assert client.get("/parent/dashboard", headers=headers).status_code == 403
        assert client.get("/parent/notifications", headers=headers).status_code == 403
