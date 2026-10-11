"""
Shared pytest fixtures for CampusFlow integration tests.

Uses SQLite in-memory database — completely isolated from production.
Override DATABASE_URL before importing anything from the app.
"""

import os
import pytest

# ── Point to isolated in-memory SQLite before any app import ──────────────────
os.environ["DATABASE_URL"] = "sqlite:///./test_campusflow.db"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from fastapi.testclient import TestClient

from database.connection import get_db
from database.base import Base
from models import *  # noqa: F401, F403 — registers all models with Base

from main import app
from auth.security import hash_password, create_access_token


# ── SQLite test engine ────────────────────────────────────────────────────────

SQLITE_URL = "sqlite:///./test_campusflow.db"

engine_test = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False}
)
TestingSession = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine_test
)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """Create all tables once per test session, drop them after."""
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture()
def db():
    """Provide a fresh database session per test, with automatic rollback."""
    Base.metadata.create_all(bind=engine_test)
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSession(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db):
    """TestClient with the get_db dependency overridden to use the test DB."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── User/token helpers ────────────────────────────────────────────────────────

def make_user(db, email: str, role: str, password: str = "Test@123"):
    """Create a User row and return (user, token)."""
    from models.user import User
    user = User(
        email=email,
        hashed_password=hash_password(password),
        role=role,
    )
    db.add(user)
    db.flush()
    token = create_access_token(user_id=user.id, role=user.role)
    return user, token


def make_student_profile(db, user_id: int, roll_number: str = "TST001"):
    """Create a Student profile row and return it."""
    from models.student import Student
    student = Student(
        user_id=user_id,
        first_name="Test",
        last_name="Student",
        roll_number=roll_number,
        email=f"{roll_number.lower()}@test.com",
        department="BCA",
        semester=6,
        phone="9000000000",
    )
    db.add(student)
    db.flush()
    return student


def make_subject(db, code: str = "SUB001"):
    """Create a Subject row and return it."""
    from models.subject import Subject
    subject = Subject(
        subject_code=code,
        name=f"Subject {code}",
        department="BCA",
        semester=6,
        faculty_id=None,
    )
    db.add(subject)
    db.flush()
    return subject


def make_attendance(db, student_id: int, subject_id: int, status: str = "present"):
    """Create an Attendance row and return it."""
    from models.attendance import Attendance
    from datetime import datetime
    record = Attendance(
        student_id=student_id,
        subject_id=subject_id,
        date=datetime(2026, 7, 1),
        status=status,
    )
    db.add(record)
    db.flush()
    return record


def make_mark(db, student_id: int, subject_id: int, obtained: float = 30.0, maximum: float = 40.0):
    """Create a Mark row and return it."""
    from models.marks import Mark
    record = Mark(
        student_id=student_id,
        subject_id=subject_id,
        exam_type="Internal",
        marks_obtained=obtained,
        max_marks=maximum,
    )
    db.add(record)
    db.flush()
    return record
