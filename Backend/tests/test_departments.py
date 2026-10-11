import pytest
from tests.conftest import make_user, make_student_profile, make_subject, make_attendance, make_mark
from models.department import Department
from models.faculty import Faculty


class TestDepartmentEndpoints:

    def test_admin_create_department(self, client, db):
        admin, token = make_user(db, "admin_dept@test.com", "admin")
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "department_code": "CS",
            "department_name": "Computer Science",
            "description": "Department of Computer Science & IT",
            "is_active": True
        }

        response = client.post("/departments/", json=payload, headers=headers)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["department_code"] == "CS"
        assert data["department_name"] == "Computer Science"
        assert data["is_active"] is True

    def test_duplicate_department_code_rejected(self, client, db):
        admin, token = make_user(db, "admin_dup@test.com", "admin")
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "department_code": "ECE",
            "department_name": "Electronics & Communication",
        }
        res1 = client.post("/departments/", json=payload, headers=headers)
        assert res1.status_code == 201

        res2 = client.post("/departments/", json=payload, headers=headers)
        assert res2.status_code == 400
        assert "already exists" in res2.json()["detail"]

    def test_faculty_cannot_create_department(self, client, db):
        faculty, token = make_user(db, "faculty_dept@test.com", "faculty")
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "department_code": "ME",
            "department_name": "Mechanical Engineering"
        }
        response = client.post("/departments/", json=payload, headers=headers)
        assert response.status_code == 403

    def test_list_and_filter_departments(self, client, db):
        admin, token = make_user(db, "admin_list@test.com", "admin")
        headers = {"Authorization": f"Bearer {token}"}

        client.post("/departments/", json={"department_code": "BCA", "department_name": "Bachelor of Computer Applications"}, headers=headers)
        client.post("/departments/", json={"department_code": "MBA", "department_name": "Master of Business Administration"}, headers=headers)

        response = client.get("/departments/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

        search_res = client.get("/departments/?q=Business", headers=headers)
        assert search_res.status_code == 200
        assert len(search_res.json()) == 1
        assert search_res.json()[0]["department_code"] == "MBA"

    def test_department_dashboard_stats(self, client, db):
        admin, token = make_user(db, "admin_dash@test.com", "admin")
        headers = {"Authorization": f"Bearer {token}"}

        dept_res = client.post("/departments/", json={"department_code": "IT", "department_name": "Information Technology"}, headers=headers)
        dept_id = dept_res.json()["id"]

        # Create student linked to IT department
        student_user, _ = make_user(db, "it_student@test.com", "student")
        student = make_student_profile(db, student_user.id, roll_number="IT001")
        student.department_id = dept_id
        student.department = "IT"
        db.flush()

        subject = make_subject(db, "IT101")
        subject.department_id = dept_id
        subject.department = "IT"
        db.flush()

        make_attendance(db, student.id, subject.id, "present")
        make_mark(db, student.id, subject.id, obtained=35, maximum=50)

        dash_res = client.get(f"/departments/{dept_id}/dashboard", headers=headers)
        assert dash_res.status_code == 200
        dash = dash_res.json()

        assert dash["department_code"] == "IT"
        assert dash["total_students"] == 1
        assert dash["total_subjects"] == 1
        assert dash["average_attendance"] == 100.0
        assert dash["average_marks"] == 70.0
        assert "risk_distribution" in dash

    def test_department_status_and_deletion(self, client, db):
        admin, token = make_user(db, "admin_del@test.com", "admin")
        headers = {"Authorization": f"Bearer {token}"}

        dept_res = client.post("/departments/", json={"department_code": "CIVIL", "department_name": "Civil Engineering"}, headers=headers)
        dept_id = dept_res.json()["id"]

        # Toggle status to inactive
        patch_res = client.patch(f"/departments/{dept_id}/status", json={"is_active": False}, headers=headers)
        assert patch_res.status_code == 200
        assert patch_res.json()["is_active"] is False

        # Delete department
        del_res = client.delete(f"/departments/{dept_id}", headers=headers)
        assert del_res.status_code == 200
