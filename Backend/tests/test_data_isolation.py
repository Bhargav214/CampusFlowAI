"""
Tests for student data isolation on:
  - GET /attendance/
  - GET /marks/

Critical security requirement:
  A student must ONLY see their own records.
  They must NOT see another student's records.
  Admin/faculty must see all records.
"""

import pytest
from tests.conftest import (
    make_user,
    make_student_profile,
    make_subject,
    make_attendance,
    make_mark,
)


# ─────────────────────────────────────────────────────────────────────────────
# Attendance isolation
# ─────────────────────────────────────────────────────────────────────────────

class TestAttendanceIsolation:

    def test_student_sees_only_own_attendance(self, client, db):
        """
        Student A must only receive their own attendance records.
        Student B's records must not appear in A's response.
        """
        # Create two students
        user_a, token_a = make_user(db, "student_a@test.com", "student")
        user_b, token_b = make_user(db, "student_b@test.com", "student")

        student_a = make_student_profile(db, user_a.id, "TST_A01")
        student_b = make_student_profile(db, user_b.id, "TST_B01")

        subject = make_subject(db, "ATT_SUBJ1")

        att_a = make_attendance(db, student_a.id, subject.id, "present")
        att_b = make_attendance(db, student_b.id, subject.id, "absent")
        db.commit()

        # Student A requests attendance
        response = client.get(
            "/attendance/",
            headers={"Authorization": f"Bearer {token_a}"}
        )

        assert response.status_code == 200, response.text
        data = response.json()

        returned_ids = [r["student_id"] for r in data]

        assert student_a.id in returned_ids, "Student A should see their own records"
        assert student_b.id not in returned_ids, "Student A must NOT see Student B's records"

    def test_student_b_sees_only_own_attendance(self, client, db):
        """Student B must only see their own records, not Student A's."""
        user_a, token_a = make_user(db, "iso_a@test.com", "student")
        user_b, token_b = make_user(db, "iso_b@test.com", "student")

        student_a = make_student_profile(db, user_a.id, "ISO_A01")
        student_b = make_student_profile(db, user_b.id, "ISO_B01")

        subject = make_subject(db, "ISO_SUBJ1")
        make_attendance(db, student_a.id, subject.id, "present")
        make_attendance(db, student_b.id, subject.id, "absent")
        db.commit()

        response = client.get(
            "/attendance/",
            headers={"Authorization": f"Bearer {token_b}"}
        )

        assert response.status_code == 200
        data = response.json()
        returned_ids = [r["student_id"] for r in data]

        assert student_b.id in returned_ids
        assert student_a.id not in returned_ids

    def test_admin_sees_all_attendance(self, client, db):
        """Admin must receive all attendance records (no filtering)."""
        _, admin_token = make_user(db, "admin_att@test.com", "admin")

        user_x, _ = make_user(db, "stuX@test.com", "student")
        user_y, _ = make_user(db, "stuY@test.com", "student")
        student_x = make_student_profile(db, user_x.id, "ADM_X01")
        student_y = make_student_profile(db, user_y.id, "ADM_Y01")
        subj = make_subject(db, "ADM_SUBJ1")

        make_attendance(db, student_x.id, subj.id)
        make_attendance(db, student_y.id, subj.id)
        db.commit()

        response = client.get(
            "/attendance/",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        returned_ids = {r["student_id"] for r in data}

        assert student_x.id in returned_ids
        assert student_y.id in returned_ids

    def test_faculty_sees_all_attendance(self, client, db):
        """Faculty must receive all attendance records."""
        _, fac_token = make_user(db, "faculty_att@test.com", "faculty")

        user_s, _ = make_user(db, "stuS@test.com", "student")
        student_s = make_student_profile(db, user_s.id, "FAC_S01")
        subj = make_subject(db, "FAC_SUBJ1")
        make_attendance(db, student_s.id, subj.id)
        db.commit()

        response = client.get(
            "/attendance/",
            headers={"Authorization": f"Bearer {fac_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert any(r["student_id"] == student_s.id for r in data)

    def test_unauthenticated_attendance_rejected(self, client, db):
        """Requests without a token must receive 403 (HTTPBearer returns 403)."""
        response = client.get("/attendance/")
        assert response.status_code in (401, 403)

    def test_student_without_profile_returns_404(self, client, db):
        """A student user with no Student profile must get 404, not a crash."""
        _, orphan_token = make_user(db, "orphan@test.com", "student")
        db.commit()

        response = client.get(
            "/attendance/",
            headers={"Authorization": f"Bearer {orphan_token}"}
        )
        assert response.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# Marks isolation
# ─────────────────────────────────────────────────────────────────────────────

class TestMarksIsolation:

    def test_student_sees_only_own_marks(self, client, db):
        """Student must not be able to see another student's marks."""
        user_p, token_p = make_user(db, "marks_p@test.com", "student")
        user_q, token_q = make_user(db, "marks_q@test.com", "student")

        student_p = make_student_profile(db, user_p.id, "MRK_P01")
        student_q = make_student_profile(db, user_q.id, "MRK_Q01")

        subj = make_subject(db, "MRK_SUBJ1")
        make_mark(db, student_p.id, subj.id, obtained=35.0)
        make_mark(db, student_q.id, subj.id, obtained=20.0)
        db.commit()

        response = client.get(
            "/marks/",
            headers={"Authorization": f"Bearer {token_p}"}
        )

        assert response.status_code == 200
        data = response.json()
        returned_student_ids = {r["student_id"] for r in data}

        assert student_p.id in returned_student_ids
        assert student_q.id not in returned_student_ids

    def test_admin_sees_all_marks(self, client, db):
        """Admin must receive all marks with no filtering."""
        _, admin_token = make_user(db, "admin_mrk@test.com", "admin")

        user_m, _ = make_user(db, "stuM@test.com", "student")
        user_n, _ = make_user(db, "stuN@test.com", "student")
        student_m = make_student_profile(db, user_m.id, "ADM_M01")
        student_n = make_student_profile(db, user_n.id, "ADM_N01")
        subj = make_subject(db, "ADM_MRK_SUBJ")
        make_mark(db, student_m.id, subj.id)
        make_mark(db, student_n.id, subj.id)
        db.commit()

        response = client.get(
            "/marks/",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        ids = {r["student_id"] for r in data}
        assert student_m.id in ids
        assert student_n.id in ids

    def test_student_without_profile_marks_returns_404(self, client, db):
        """Student user with no Student profile must get 404."""
        _, orphan_token = make_user(db, "orphan_mrk@test.com", "student")
        db.commit()

        response = client.get(
            "/marks/",
            headers={"Authorization": f"Bearer {orphan_token}"}
        )
        assert response.status_code == 404

    def test_unauthenticated_marks_rejected(self, client, db):
        """No token → rejected."""
        response = client.get("/marks/")
        assert response.status_code in (401, 403)
