"""
Tests for the authentication endpoints:
  POST /auth/register
  POST /auth/login
  GET  /auth/me
"""

import pytest
from tests.conftest import make_user


class TestAuthRegister:

    def test_register_student_succeeds(self, client, db):
        response = client.post("/auth/register", json={
            "email": "new_student@test.com",
            "password": "Test@12345",
            "role": "student"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "new_student@test.com"
        assert data["role"] == "student"
        assert "hashed_password" not in data

    def test_register_duplicate_email_rejected(self, client, db):
        make_user(db, "dup@test.com", "student")
        db.commit()

        response = client.post("/auth/register", json={
            "email": "dup@test.com",
            "password": "Test@12345",
            "role": "student"
        })
        assert response.status_code == 400

    def test_register_admin_role_blocked(self, client, db):
        """Registration endpoint must not allow creating admin accounts."""
        response = client.post("/auth/register", json={
            "email": "fake_admin@test.com",
            "password": "Test@12345",
            "role": "admin"
        })
        assert response.status_code == 400


class TestAuthLogin:

    def test_login_valid_credentials(self, client, db):
        make_user(db, "login_ok@test.com", "student", "Correct@123")
        db.commit()

        response = client.post("/auth/login", json={
            "email": "login_ok@test.com",
            "password": "Correct@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password_rejected(self, client, db):
        make_user(db, "wrong_pw@test.com", "student", "Right@123")
        db.commit()

        response = client.post("/auth/login", json={
            "email": "wrong_pw@test.com",
            "password": "Wrong@123"
        })
        assert response.status_code == 401

    def test_login_unknown_email_rejected(self, client, db):
        response = client.post("/auth/login", json={
            "email": "nobody@test.com",
            "password": "Test@12345"
        })
        assert response.status_code == 401


class TestAuthMe:

    def test_me_returns_current_user(self, client, db):
        user, token = make_user(db, "me_test@test.com", "faculty")
        db.commit()

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "me_test@test.com"
        assert data["role"] == "faculty"

    def test_me_without_token_rejected(self, client, db):
        response = client.get("/auth/me")
        assert response.status_code in (401, 403)

    def test_me_invalid_token_rejected(self, client, db):
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer totally.invalid.token"}
        )
        assert response.status_code == 401


class TestRBAC:

    def test_student_cannot_access_admin_endpoint(self, client, db):
        """Students must be blocked from admin-only endpoints."""
        _, student_token = make_user(db, "stu_rbac@test.com", "student")
        db.commit()

        response = client.get(
            "/analytics/risk",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert response.status_code == 403

    def test_student_cannot_list_all_students(self, client, db):
        """Students must not be able to list the student directory."""
        _, student_token = make_user(db, "stu_list@test.com", "student")
        db.commit()

        response = client.get(
            "/students/",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert response.status_code == 403

    def test_faculty_cannot_access_ml_train(self, client, db):
        """Faculty must not be able to trigger ML training (admin-only)."""
        _, fac_token = make_user(db, "fac_ml@test.com", "faculty")
        db.commit()

        response = client.post(
            "/analytics/ml/train",
            headers={"Authorization": f"Bearer {fac_token}"}
        )
        assert response.status_code == 403

    def test_admin_can_access_risk_endpoint(self, client, db):
        """Admin must be able to access the risk analytics endpoint."""
        _, admin_token = make_user(db, "admin_risk@test.com", "admin")
        db.commit()

        response = client.get(
            "/analytics/risk",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # 200 OK or 404/500 due to empty DB — but NOT 403
        assert response.status_code != 403
