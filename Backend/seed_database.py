"""
CampusFlow AI — Database Seed Script
======================================

DEFAULT MODE (safe, idempotent):
    python seed_database.py

    - Inserts demo data ONLY if it does not already exist.
    - Safe to run repeatedly — will not delete or overwrite real data.
    - Suitable for first-time setup and CI/CD environments.

DEMO RESET MODE (destructive — requires explicit flag):
    python seed_database.py --reset-demo

    - Deletes all academic data and re-seeds from scratch.
    - BLOCKED if DATABASE_URL appears to be a production server.
    - FOR DEVELOPMENT / DEMO ENVIRONMENTS ONLY.

Demo Credentials (DEVELOPMENT / DEMO ONLY — change before production):
    Admin:   admin@campusflow.com / Admin@123
    Faculty: anil@campusflow.com  / Faculty@123
    Student: bca001@campusflow.com / Student@123
"""

import os
import sys
import random
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from database.connection import SessionLocal
from models.user import User
from models.student import Student
from models.faculty import Faculty
from models.subject import Subject
from models.attendance import Attendance
from models.marks import Mark

from auth.security import hash_password


# ──────────────────────────────────────────────────────────────
# Production guard — refuse destructive reset on production DBs
# ──────────────────────────────────────────────────────────────

PRODUCTION_INDICATORS = [
    "render.com",
    "railway.app",
    "supabase.co",
    "neon.tech",
    "heroku",
    "amazonaws",
    "azure",
    "cloud",
]


def _is_production_db() -> bool:
    db_url = os.environ.get("DATABASE_URL", "")
    return any(
        indicator in db_url.lower()
        for indicator in PRODUCTION_INDICATORS
    )


# ──────────────────────────────────────────────────────────────
# Safe idempotent helpers
# ──────────────────────────────────────────────────────────────

def _get_or_create_user(db: Session, email: str, password: str, role: str):
    """Returns existing user or creates a new one. Never overwrites."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return existing, False
    user = User(
        email=email,
        hashed_password=hash_password(password),
        role=role
    )
    db.add(user)
    db.flush()
    return user, True


def _get_or_create_faculty(db: Session, user_id: int, faculty_id: str, first: str, last: str, email: str):
    existing = db.query(Faculty).filter(Faculty.user_id == user_id).first()
    if existing:
        return existing, False
    faculty = Faculty(
        user_id=user_id,
        faculty_id=faculty_id,
        first_name=first,
        last_name=last,
        email=email,
        phone="9876543210",
        department="BCA",
        designation="Assistant Professor"
    )
    db.add(faculty)
    return faculty, True


def _get_or_create_subject(db: Session, code: str, name: str, faculty_id: int):
    existing = db.query(Subject).filter(Subject.subject_code == code).first()
    if existing:
        return existing, False
    subject = Subject(
        subject_code=code,
        name=name,
        department="BCA",
        semester=6,
        faculty_id=faculty_id,
    )
    db.add(subject)
    return subject, True


def _get_or_create_student(db: Session, roll_no: str, first_name: str, email: str):
    existing = db.query(Student).filter(Student.roll_number == roll_no).first()
    if existing:
        return existing, False, None
    user, _ = _get_or_create_user(db, email, "Student@123", "student")
    student = Student(
        user_id=user.id,
        first_name=first_name,
        last_name="Kumar",
        roll_number=roll_no,
        email=email,
        department="BCA",
        semester=6,
        phone="9000000000"
    )
    db.add(student)
    return student, True, user


# ──────────────────────────────────────────────────────────────
# Destructive reset (only when --reset-demo is passed)
# ──────────────────────────────────────────────────────────────

def _destructive_reset(db: Session):
    print("⚠️  DEMO RESET: Deleting all existing academic data...")
    db.query(Attendance).delete()
    db.query(Mark).delete()
    db.query(Subject).delete()
    db.query(Student).delete()
    db.query(Faculty).delete()
    db.commit()
    print("🧹 Old academic data cleared")


# ──────────────────────────────────────────────────────────────
# Seed logic
# ──────────────────────────────────────────────────────────────

def seed_database(reset_demo: bool = False):

    if reset_demo:
        if _is_production_db():
            print(
                "❌ BLOCKED: --reset-demo is not allowed against a production database.\n"
                "   Set DATABASE_URL to a local/development database before using --reset-demo."
            )
            sys.exit(1)
        print("⚠️  WARNING: Running in DEMO RESET mode. This will delete all academic data.")
        confirm = input("Type 'yes' to confirm: ").strip().lower()
        if confirm != "yes":
            print("Aborted.")
            sys.exit(0)

    db: Session = SessionLocal()

    try:
        print("🌱 Starting CampusFlow database seeding...")

        if reset_demo:
            _destructive_reset(db)

        # ── 1. Admin user ───────────────────────────────────────
        admin_user, created = _get_or_create_user(
            db, "admin@campusflow.com", "Admin@123", "admin"
        )
        if created:
            print("👤 Admin user created")
        else:
            print("👤 Admin user already exists — skipping")
        db.commit()

        # ── 2. Faculty ──────────────────────────────────────────
        faculty_data = [
            ("FAC001", "Anil", "Kumar"),
            ("FAC002", "Priya", "Sharma"),
            ("FAC003", "Rahul", "Reddy"),
            ("FAC004", "Sneha", "Patel"),
            ("FAC005", "Arun", "Shah"),
        ]

        faculty_members = []
        faculty_created = 0

        for faculty_id, first, last in faculty_data:
            email = f"{first.lower()}@campusflow.com"
            user, u_created = _get_or_create_user(
                db, email, "Faculty@123", "faculty"
            )
            faculty, f_created = _get_or_create_faculty(
                db, user.id, faculty_id, first, last, email
            )
            faculty_members.append(faculty)
            if f_created:
                faculty_created += 1

        db.commit()

        # Refresh to get IDs after commit
        for i, fac in enumerate(faculty_members):
            db.refresh(fac)

        print(f"👨‍🏫 {faculty_created} new faculty members created "
              f"({len(faculty_data) - faculty_created} already existed)")

        # ── 3. Subjects ─────────────────────────────────────────
        subject_data = [
            ("BCA601", "Data Engineering"),
            ("BCA602", "Artificial Intelligence"),
            ("BCA603", "Cloud Computing"),
            ("BCA604", "Cyber Security"),
            ("BCA605", "Data Analytics"),
        ]

        subjects = []
        subjects_created = 0

        for index, (code, name) in enumerate(subject_data):
            subject, created = _get_or_create_subject(
                db, code, name, faculty_members[index].id
            )
            subjects.append(subject)
            if created:
                subjects_created += 1

        db.commit()
        for subj in subjects:
            db.refresh(subj)

        print(f"📚 {subjects_created} new subjects created "
              f"({len(subject_data) - subjects_created} already existed)")

        # ── 4. Students ─────────────────────────────────────────
        first_names = [
            "Aarav", "Aditya", "Arjun", "Bhargav", "Charan", "Deepak", "Harsha",
            "Kiran", "Manoj", "Nikhil", "Pavan", "Rahul", "Rohit", "Sanjay",
            "Surya", "Varun", "Vivek", "Abhinav", "Akash", "Ananya", "Divya",
            "Keerthi", "Megha", "Pooja", "Priya", "Riya", "Sneha", "Swathi",
            "Tanvi", "Vaishnavi", "Aishwarya", "Bhavana", "Harini", "Kavya",
            "Lakshmi", "Nandini", "Navya", "Pallavi", "Shreya", "Sowmya",
            "Tejaswini", "Deepika", "Ishita", "Madhuri", "Manasa", "Neha",
            "Rashmi", "Sahana", "Shruthi", "Vidya"
        ]

        students = []
        students_created = 0

        for i in range(50):
            roll_no = f"BCA{str(i + 1).zfill(3)}"
            first_name = first_names[i]
            email = f"{roll_no.lower()}@campusflow.com"
            student, created, _ = _get_or_create_student(
                db, roll_no, first_name, email
            )
            students.append(student)
            if created:
                students_created += 1

        db.commit()
        for s in students:
            db.refresh(s)

        print(f"👨‍🎓 {students_created} new students created "
              f"({50 - students_created} already existed)")

        # ── 5. Attendance (skip if records already exist) ────────
        existing_attendance = db.query(Attendance).count()

        if existing_attendance > 0 and not reset_demo:
            print(f"📊 Attendance records already exist ({existing_attendance}) — skipping")
        else:
            start_date = date(2026, 7, 1)
            attendance_records = []

            for student_index, student in enumerate(students):
                if student_index < 5:
                    attendance_probability = 0.55
                elif student_index < 10:
                    attendance_probability = 0.68
                else:
                    attendance_probability = 0.88

                for subject in subjects:
                    for day in range(30):
                        current_date = start_date + timedelta(days=day)
                        current_datetime = datetime.combine(
                            current_date, datetime.min.time()
                        )

                        # Skip if already exists
                        already = db.query(Attendance).filter(
                            Attendance.student_id == student.id,
                            Attendance.subject_id == subject.id,
                            Attendance.date == current_datetime
                        ).first()

                        if already:
                            continue

                        status = random.choices(
                            ["present", "absent"],
                            weights=[attendance_probability, 1 - attendance_probability]
                        )[0]

                        attendance_records.append(
                            Attendance(
                                student_id=student.id,
                                subject_id=subject.id,
                                date=current_datetime,
                                status=status
                            )
                        )

            db.add_all(attendance_records)
            db.commit()
            print(f"📊 {len(attendance_records)} attendance records created")

        # ── 6. Marks (skip if records already exist) ────────────
        existing_marks = db.query(Mark).count()

        if existing_marks > 0 and not reset_demo:
            print(f"📝 Marks records already exist ({existing_marks}) — skipping")
        else:
            marks_records = []

            for student_index, student in enumerate(students):
                if student_index < 5:
                    internal_range = (12, 22)
                    external_range = (20, 35)
                elif student_index < 10:
                    internal_range = (20, 28)
                    external_range = (30, 45)
                else:
                    internal_range = (25, 40)
                    external_range = (35, 60)

                for subject in subjects:
                    for exam_type, range_, max_m in [
                        ("Internal", internal_range, 40.0),
                        ("External", external_range, 60.0),
                    ]:
                        already = db.query(Mark).filter(
                            Mark.student_id == student.id,
                            Mark.subject_id == subject.id,
                            Mark.exam_type == exam_type
                        ).first()

                        if already:
                            continue

                        obtained = float(random.randint(*range_))
                        marks_records.append(
                            Mark(
                                student_id=student.id,
                                subject_id=subject.id,
                                exam_type=exam_type,
                                marks_obtained=obtained,
                                max_marks=max_m,
                            )
                        )

            db.add_all(marks_records)
            db.commit()
            print(f"📝 {len(marks_records)} marks records created")

        print()
        print("🎉 CampusFlow database seeded successfully!")
        print()
        print("Demo Credentials (DEVELOPMENT / DEMO ONLY):")
        print("  Admin:   admin@campusflow.com / Admin@123")
        print("  Faculty: anil@campusflow.com  / Faculty@123")
        print("  Student: bca001@campusflow.com / Student@123")

    except Exception as error:
        db.rollback()
        print(f"❌ Seeding failed: {error}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset_demo = "--reset-demo" in sys.argv
    seed_database(reset_demo=reset_demo)

