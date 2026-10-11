"""
CampusFlow AI — Final QA Phase Automated Test Suite
==================================================

Verifies all 14 mandatory security, RBAC, data-isolation, and CLI safety criteria:
 1. Student A can retrieve only Student A attendance.
 2. Student A cannot retrieve Student B attendance.
 3. Student A can retrieve only Student A marks.
 4. Student A cannot retrieve Student B marks.
 5. Student cannot access institutional reports (/reports/*).
 6. Student cannot access ETL endpoints (/etl/*).
 7. Student cannot access faculty management (/faculty/*).
 8. Faculty cannot access admin-only faculty management (POST/DELETE /faculty/*).
 9. Faculty cannot train the ML model (POST /analytics/ml/train).
10. Admin can access all intended admin endpoints.
11. Student dashboard works for a valid student (GET /students/me/dashboard).
12. Student dashboard returns controlled 404 when student profile is missing.
13. Student dashboard cannot expose another student's information.
14. --reset-demo requires user confirmation.
"""

import sys
import os
import pytest
from unittest.mock import patch

from tests.conftest import (
    make_user,
    make_student_profile,
    make_subject,
    make_attendance,
    make_mark,
)
from seed_database import seed_database


class TestFinalQA:

    # 1 & 2. Student Attendance Data Isolation
    def test_01_and_02_student_attendance_isolation(self, client, db):
        user_a, token_a = make_user(db, "qa_stu_a@test.com", "student")
        user_b, token_b = make_user(db, "qa_stu_b@test.com", "student")
        student_a = make_student_profile(db, user_a.id, "QA_A01")
        student_b = make_student_profile(db, user_b.id, "QA_B01")
        subject = make_subject(db, "QA_SUBJ1")

        make_attendance(db, student_a.id, subject.id, "present")
        make_attendance(db, student_b.id, subject.id, "absent")
        db.commit()

        # Student A request
        res_a = client.get("/attendance/", headers={"Authorization": f"Bearer {token_a}"})
        assert res_a.status_code == 200
        ids_a = [r["student_id"] for r in res_a.json()]
        assert student_a.id in ids_a, "Student A should see their own attendance"
        assert student_b.id not in ids_a, "Student A MUST NOT see Student B attendance"

    # 3 & 4. Student Marks Data Isolation
    def test_03_and_04_student_marks_isolation(self, client, db):
        user_a, token_a = make_user(db, "qa_marks_a@test.com", "student")
        user_b, token_b = make_user(db, "qa_marks_b@test.com", "student")
        student_a = make_student_profile(db, user_a.id, "QA_MRK_A")
        student_b = make_student_profile(db, user_b.id, "QA_MRK_B")
        subject = make_subject(db, "QA_MRK_SUBJ")

        make_mark(db, student_a.id, subject.id, obtained=38.0)
        make_mark(db, student_b.id, subject.id, obtained=22.0)
        db.commit()

        res_a = client.get("/marks/", headers={"Authorization": f"Bearer {token_a}"})
        assert res_a.status_code == 200
        ids_a = [r["student_id"] for r in res_a.json()]
        assert student_a.id in ids_a, "Student A should see their own marks"
        assert student_b.id not in ids_a, "Student A MUST NOT see Student B marks"

    # 5. Student cannot access institutional reports
    def test_05_student_cannot_access_reports(self, client, db):
        _, token = make_user(db, "stu_rep@test.com", "student")
        db.commit()

        for path in ["/reports/attendance", "/reports/marks", "/reports/risk", "/reports/students"]:
            res = client.get(path, headers={"Authorization": f"Bearer {token}"})
            assert res.status_code == 403, f"Student should be blocked from {path}"

    # 6. Student cannot access ETL
    def test_06_student_cannot_access_etl(self, client, db):
        _, token = make_user(db, "stu_etl@test.com", "student")
        db.commit()

        files = {"file": ("test.csv", "roll_number,status\nBCA001,present", "text/csv")}
        res_att = client.post("/etl/attendance", files=files, headers={"Authorization": f"Bearer {token}"})
        assert res_att.status_code == 403

        res_mrk = client.post("/etl/marks", files=files, headers={"Authorization": f"Bearer {token}"})
        assert res_mrk.status_code == 403

    # 7. Student cannot access faculty management
    def test_07_student_cannot_access_faculty_management(self, client, db):
        _, token = make_user(db, "stu_fac@test.com", "student")
        db.commit()

        res_list = client.get("/faculty/", headers={"Authorization": f"Bearer {token}"})
        assert res_list.status_code == 403

        res_create = client.post("/faculty/", json={"faculty_id": "FAC999"}, headers={"Authorization": f"Bearer {token}"})
        assert res_create.status_code == 403

    # 8. Faculty cannot access admin-only faculty management
    def test_08_faculty_cannot_access_admin_faculty_management(self, client, db):
        _, token = make_user(db, "fac_user@test.com", "faculty")
        db.commit()

        # Faculty can list faculty, but CANNOT create or delete faculty
        res_create = client.post("/faculty/", json={
            "faculty_id": "FAC999",
            "first_name": "Test",
            "last_name": "Fac",
            "email": "tfac@test.com",
            "department": "BCA"
        }, headers={"Authorization": f"Bearer {token}"})
        assert res_create.status_code == 403

        res_delete = client.delete("/faculty/1", headers={"Authorization": f"Bearer {token}"})
        assert res_delete.status_code == 403

    # 9. Faculty cannot train ML model
    def test_09_faculty_cannot_train_ml_model(self, client, db):
        _, token = make_user(db, "fac_ml_user@test.com", "faculty")
        db.commit()

        res = client.post("/analytics/ml/train", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 403

    # 10. Admin can access all intended admin endpoints
    def test_10_admin_can_access_admin_endpoints(self, client, db):
        _, token = make_user(db, "admin_all@test.com", "admin")
        db.commit()

        headers = {"Authorization": f"Bearer {token}"}
        
        res_dash = client.get("/analytics/dashboard", headers=headers)
        assert res_dash.status_code == 200

        res_risk = client.get("/analytics/risk", headers=headers)
        assert res_risk.status_code == 200

        res_students = client.get("/students/", headers=headers)
        assert res_students.status_code == 200

        res_faculty = client.get("/faculty/", headers=headers)
        assert res_faculty.status_code == 200

    # 11. Student dashboard works for a valid student
    def test_11_student_dashboard_valid_student(self, client, db):
        user, token = make_user(db, "valid_stu_dash@test.com", "student")
        student = make_student_profile(db, user.id, "DASH_01")
        subject = make_subject(db, "DASH_SUBJ")
        make_attendance(db, student.id, subject.id, "present")
        make_mark(db, student.id, subject.id, obtained=35.0)
        db.commit()

        res = client.get("/analytics/student-dashboard", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert "risk_students" in data or "average_attendance" in data

    # 12. Student dashboard returns controlled response when student profile is missing
    def test_12_student_dashboard_missing_profile_controlled_404(self, client, db):
        _, token = make_user(db, "noprofile@test.com", "student")
        db.commit()

        res = client.get("/analytics/student-dashboard", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 404
        assert "Student profile not found" in res.json().get("detail", "")

    # 13. Student dashboard cannot expose another student's information
    def test_13_student_dashboard_isolation(self, client, db):
        user1, token1 = make_user(db, "dash_iso_1@test.com", "student")
        user2, token2 = make_user(db, "dash_iso_2@test.com", "student")
        stu1 = make_student_profile(db, user1.id, "ISO_DASH_1")
        stu2 = make_student_profile(db, user2.id, "ISO_DASH_2")
        db.commit()

        res1 = client.get("/analytics/student-dashboard", headers={"Authorization": f"Bearer {token1}"})
        assert res1.status_code == 200
        data1_str = str(res1.json())

        assert "ISO_DASH_1" in data1_str
        assert "ISO_DASH_2" not in data1_str

    # 14. --reset-demo requires confirmation
    def test_14_reset_demo_requires_confirmation(self):
        with patch("builtins.input", return_value="no"):
            with pytest.raises(SystemExit) as exc_info:
                seed_database(reset_demo=True)
            assert exc_info.value.code == 0
