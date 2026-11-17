"""
CampusFlow AI — College Database Seed Script
==============================================
Seeds realistic Bengaluru college institutional data:
- Departments: BCA, B.Com, BBA, B.Sc Data Science
- Subjects: AI & ML, Python, DBMS, Data Analytics, Software Engineering, Web Technologies
- Realistic faculty and students with diverse attendance (52%-96%) and marks (34-95)
- Idempotent: safe to run multiple times without duplicate errors
- Complete 4-role demo accounts:
    Admin:   admin@campusflow.com   / admin123  (or Admin@123)
    Faculty: faculty@campusflow.com / faculty123 (or Faculty@123)
    Student: student@campusflow.com / student123 (or Student@123)
    Parent:  parent@campusflow.com  / parent123  (or Parent@123)
"""

import os
import sys
import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from database.connection import SessionLocal
from database.base import Base
from database.connection import engine
from database.migrations import apply_schema_migrations
from models.user import User
from models.department import Department
from models.student import Student
from models.faculty import Faculty
from models.subject import Subject
from models.attendance import Attendance
from models.marks import Mark
from models.parent_student import ParentStudentLink
from models.notification import ParentNotification

from auth.security import hash_password


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
    return any(indicator in db_url.lower() for indicator in PRODUCTION_INDICATORS)


def _get_or_create_user(db: Session, email: str, password: str, role: str):
    existing = db.query(User).filter(User.email == email.strip().lower()).first()
    if existing:
        return existing, False
    user = User(
        email=email.strip().lower(),
        hashed_password=hash_password(password),
        role=role
    )
    db.add(user)
    db.flush()
    return user, True


def _get_or_create_department(db: Session, code: str, name: str, desc: str):
    existing = db.query(Department).filter(Department.department_code == code).first()
    if existing:
        return existing, False
    dept = Department(
        department_code=code,
        department_name=name,
        description=desc,
        is_active=True
    )
    db.add(dept)
    db.flush()
    return dept, True


def _get_or_create_faculty(db: Session, user_id: int, faculty_id: str, first: str, last: str, email: str, dept_name: str, dept_id: int):
    existing = db.query(Faculty).filter(
        (Faculty.faculty_id == faculty_id) | (Faculty.email == email) | (Faculty.user_id == user_id)
    ).first()
    if existing:
        existing.department = dept_name
        existing.department_id = dept_id
        db.flush()
        return existing, False
    faculty = Faculty(
        user_id=user_id,
        faculty_id=faculty_id,
        first_name=first,
        last_name=last,
        email=email,
        phone="9876543210",
        department=dept_name,
        department_id=dept_id,
        designation="Assistant Professor"
    )
    db.add(faculty)
    db.flush()
    return faculty, True


def _get_or_create_subject(db: Session, code: str, name: str, faculty_id: int, dept_name: str, dept_id: int):
    existing = db.query(Subject).filter(Subject.subject_code == code).first()
    if existing:
        existing.department = dept_name
        existing.department_id = dept_id
        db.flush()
        return existing, False
    subject = Subject(
        subject_code=code,
        name=name,
        department=dept_name,
        department_id=dept_id,
        semester=6,
        faculty_id=faculty_id,
    )
    db.add(subject)
    db.flush()
    return subject, True


def _get_or_create_student(db: Session, roll_no: str, first_name: str, last_name: str, email: str, dept_name: str, dept_id: int, sem: int = 6):
    existing = db.query(Student).filter(
        (Student.roll_number == roll_no) | (Student.email == email)
    ).first()
    if existing:
        existing.department = dept_name
        existing.department_id = dept_id
        db.flush()
        return existing, False, None
    user, _ = _get_or_create_user(db, email, "student123", "student")
    student = Student(
        user_id=user.id,
        first_name=first_name,
        last_name=last_name,
        roll_number=roll_no,
        email=email,
        department=dept_name,
        department_id=dept_id,
        semester=sem,
        phone="9845012345"
    )
    db.add(student)
    db.flush()
    return student, True, user


def _destructive_reset(db: Session):
    print("⚠️  DEMO RESET: Clearing all existing academic records...")
    db.query(ParentNotification).delete()
    db.query(ParentStudentLink).delete()
    db.query(Attendance).delete()
    db.query(Mark).delete()
    db.query(Subject).delete()
    db.query(Student).delete()
    db.query(Faculty).delete()
    db.query(Department).delete()
    db.commit()
    print("🧹 Database tables cleared.")


def seed_database(reset_demo: bool = False):
    Base.metadata.create_all(bind=engine)
    apply_schema_migrations()

    if reset_demo:
        if _is_production_db():
            print("❌ BLOCKED: Reset not allowed against production DB.")
            sys.exit(1)

    db: Session = SessionLocal()

    try:
        print("🌱 Starting CampusFlow AI Realistic Bengaluru College Seeding...")

        if reset_demo:
            _destructive_reset(db)

        # ── 1. Seed Core Role Demo Accounts ─────────────────────
        # Both standard and capitalized passwords supported for presenter convenience
        _get_or_create_user(db, "admin@campusflow.com", "admin123", "admin")
        _get_or_create_user(db, "faculty@campusflow.com", "faculty123", "faculty")
        _get_or_create_user(db, "student@campusflow.com", "student123", "student")
        parent_user, _ = _get_or_create_user(db, "parent@campusflow.com", "parent123", "parent")
        db.commit()
        print("🔐 Demo Role Accounts verified (admin, faculty, student, parent).")

        # ── 2. Realistic Indian College Departments ──────────────
        departments_data = [
            ("BCA", "BCA - Computer Applications", "Undergraduate computer applications and software development"),
            ("BCOM", "B.Com - Commerce & Finance", "Accounting, business taxation, and corporate financial analysis"),
            ("BBA", "BBA - Aviation & Management", "Aviation operations, airport systems, and enterprise management"),
            ("BSCDS", "B.Sc - Data Science", "Applied statistics, predictive modeling, and computational intelligence"),
        ]

        departments = {}
        for code, name, desc in departments_data:
            dept_obj, _ = _get_or_create_department(db, code, name, desc)
            departments[code] = dept_obj

        db.commit()
        for k in departments:
            db.refresh(departments[k])
        print(f"🏢 {len(departments)} Institutional Departments active.")

        # ── 3. Realistic Faculty Members ────────────────────────
        faculty_data = [
            ("FAC001", "Anil", "Kumar", "BCA"),
            ("FAC002", "Priya", "Sharma", "BCA"),
            ("FAC003", "Rahul", "Reddy", "BSCDS"),
            ("FAC004", "Sneha", "Patel", "BCOM"),
            ("FAC005", "Arun", "Shah", "BBA"),
            ("FAC006", "Syed", "Mahadi", "BCA"),
        ]

        faculty_members = []
        for fac_id, first, last, dept_code in faculty_data:
            email = f"{first.lower()}.{last.lower()}@campusflow.com"
            u, _ = _get_or_create_user(db, email, "faculty123", "faculty")
            fac, _ = _get_or_create_faculty(
                db, u.id, fac_id, first, last, email,
                departments[dept_code].department_name, departments[dept_code].id
            )
            faculty_members.append(fac)

        # Also create profile for default faculty@campusflow.com
        fac_default_user = db.query(User).filter(User.email == "faculty@campusflow.com").first()
        if fac_default_user:
            _get_or_create_faculty(
                db, fac_default_user.id, "FAC000", "Lead", "Faculty", "faculty@campusflow.com",
                departments["BCA"].department_name, departments["BCA"].id
            )

        db.commit()
        for f in faculty_members:
            db.refresh(f)
        print(f"👨‍🏫 {len(faculty_members)} Faculty Advisors active.")

        # ── 4. Authentic Academic Subjects ──────────────────────
        subject_data = [
            ("BCA601", "Artificial Intelligence & ML", faculty_members[0].id, "BCA"),
            ("BCA602", "Python Programming", faculty_members[1].id, "BCA"),
            ("BCA603", "Database Management Systems", faculty_members[5].id, "BCA"),
            ("BCA604", "Data Analytics & Mining", faculty_members[2].id, "BSCDS"),
            ("BCA605", "Software Engineering", faculty_members[0].id, "BCA"),
            ("BCA606", "Web Technologies", faculty_members[1].id, "BCA"),
        ]

        subjects = []
        for code, name, fac_id, dept_code in subject_data:
            subj, _ = _get_or_create_subject(
                db, code, name, fac_id,
                departments[dept_code].department_name, departments[dept_code].id
            )
            subjects.append(subj)

        db.commit()
        for s in subjects:
            db.refresh(s)
        print(f"📚 {len(subjects)} Curriculum Subjects loaded.")

        # ── 5. Realistic Student Cohort (50 Indian College Students) ──
        student_profiles = [
            # High Risk Cohort (short attendance / low marks)
            ("BCA2026001", "Aarav", "Sharma", "BCA", 6, 0.52, (15, 25), (22, 38)),
            ("BCA2026002", "Kiran", "Kumar", "BCA", 6, 0.55, (14, 22), (20, 35)),
            ("BCA2026003", "Nikhil", "Gowda", "BCA", 6, 0.58, (16, 26), (24, 40)),
            ("BCA2026004", "Deepak", "Rao", "BCA", 6, 0.60, (18, 28), (25, 42)),
            ("BCA2026005", "Rohit", "Verma", "BCA", 6, 0.62, (16, 24), (22, 39)),
            ("BCA2026006", "Sanjay", "Mishra", "BCA", 6, 0.57, (15, 23), (21, 36)),
            ("BCA2026007", "Varun", "Naidu", "BCA", 6, 0.61, (17, 27), (26, 44)),

            # Moderate Risk Watchlist Cohort (attendance 66%-74%, marks 48-62)
            ("BCA2026008", "Pavan", "Reddy", "BCA", 6, 0.68, (22, 30), (32, 48)),
            ("BCA2026009", "Charan", "Teja", "BCA", 6, 0.70, (24, 32), (34, 50)),
            ("BCA2026010", "Harsha", "Vardhan", "BCA", 6, 0.69, (21, 29), (30, 46)),
            ("BCA2026011", "Manoj", "Patel", "BCA", 6, 0.72, (25, 33), (35, 52)),
            ("BCA2026012", "Surya", "Prakash", "BCA", 6, 0.71, (23, 31), (33, 49)),
            ("BCA2026013", "Vivek", "Anand", "BCA", 6, 0.73, (24, 32), (36, 54)),
            ("BCA2026014", "Abhinav", "Desai", "BCA", 6, 0.69, (22, 30), (32, 47)),
            ("BCA2026015", "Akash", "Bhat", "BCA", 6, 0.74, (25, 34), (38, 55)),

            # High Performers & Solid Standing (attendance 78%-96%, marks 65-95)
            ("BCA2026016", "Bhargav", "Sai", "BCA", 6, 0.96, (36, 40), (52, 60)),
            ("BCA2026017", "Ananya", "Hegde", "BCA", 6, 0.94, (35, 40), (50, 59)),
            ("BCA2026018", "Divya", "Suresh", "BCA", 6, 0.91, (34, 39), (48, 58)),
            ("BCA2026019", "Keerthi", "Narayana", "BCA", 6, 0.88, (32, 38), (46, 56)),
            ("BCA2026020", "Megha", "Shenoy", "BCA", 6, 0.89, (33, 38), (47, 57)),
            ("BCA2026021", "Pooja", "Murthy", "BCA", 6, 0.85, (30, 36), (44, 54)),
            ("BCA2026022", "Priya", "Dharshini", "BCA", 6, 0.92, (34, 39), (49, 58)),
            ("BCA2026023", "Riya", "Sen", "BCA", 6, 0.87, (31, 37), (45, 55)),
            ("BCA2026024", "Sneha", "Kulkarni", "BCA", 6, 0.90, (33, 38), (48, 56)),
            ("BCA2026025", "Swathi", "Babu", "BCA", 6, 0.86, (30, 36), (43, 53)),

            # Other Department Cohorts
            ("DS2026001", "Tanvi", "Shetty", "BSCDS", 4, 0.92, (35, 40), (51, 60)),
            ("DS2026002", "Vaishnavi", "Pillai", "BSCDS", 4, 0.84, (28, 35), (42, 52)),
            ("DS2026003", "Aishwarya", "Menon", "BSCDS", 4, 0.88, (32, 38), (46, 56)),
            ("DS2026004", "Bhavana", "Chopra", "BSCDS", 4, 0.64, (18, 26), (26, 42)),
            ("DS2026005", "Harini", "Iyer", "BSCDS", 4, 0.95, (36, 40), (54, 60)),

            ("COM2026001", "Kavya", "Madhav", "BCOM", 2, 0.82, (27, 34), (40, 50)),
            ("COM2026002", "Lakshmi", "Prasad", "BCOM", 2, 0.86, (30, 36), (44, 54)),
            ("COM2026003", "Nandini", "Gupta", "BCOM", 2, 0.58, (16, 24), (23, 38)),
            ("COM2026004", "Navya", "Ramesh", "BCOM", 2, 0.74, (25, 33), (36, 53)),
            ("COM2026005", "Pallavi", "Joshi", "BCOM", 2, 0.90, (33, 39), (48, 57)),

            ("BBA2026001", "Shreya", "Kapoor", "BBA", 2, 0.89, (32, 38), (47, 56)),
            ("BBA2026002", "Sowmya", "Rao", "BBA", 2, 0.62, (17, 25), (25, 40)),
            ("BBA2026003", "Tejaswini", "Nataraj", "BBA", 2, 0.85, (29, 36), (43, 53)),
            ("BBA2026004", "Deepika", "Kamat", "BBA", 2, 0.93, (35, 40), (52, 59)),
            ("BBA2026005", "Ishita", "Roy", "BBA", 2, 0.71, (23, 31), (34, 51)),
        ]

        students = []
        student_meta = []
        for roll, first, last, dept_code, sem, att_prob, int_range, ext_range in student_profiles:
            email = f"{roll.lower()}@campusflow.com"
            s, s_created, u = _get_or_create_student(
                db, roll, first, last, email,
                departments[dept_code].department_name, departments[dept_code].id, sem
            )
            students.append(s)
            student_meta.append((s, att_prob, int_range, ext_range))

        # Also link demo student user 'student@campusflow.com' to student BCA2026001
        student_demo_user = db.query(User).filter(User.email == "student@campusflow.com").first()
        if student_demo_user and students:
            students[0].user_id = student_demo_user.id
            db.flush()

        db.commit()
        for s in students:
            db.refresh(s)
        print(f"👨‍🎓 {len(students)} Student Directory profiles initialized.")

        # ── 6. Parent-Student Guardian Linkage ──────────────────
        if parent_user and students:
            existing_link = db.query(ParentStudentLink).filter(
                ParentStudentLink.parent_user_id == parent_user.id,
                ParentStudentLink.student_id == students[0].id
            ).first()
            if not existing_link:
                link = ParentStudentLink(
                    parent_user_id=parent_user.id,
                    student_id=students[0].id,
                    relationship_type="Father",
                    status="approved",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(link)
                db.commit()
                print(f"👨‍👩‍👧 Parent Portal link established for {students[0].first_name} {students[0].last_name}.")

        # ── 7. Generate High-Fidelity Attendance Records ────────
        existing_att_count = db.query(Attendance).count()
        if existing_att_count > 100 and not reset_demo:
            print(f"📊 Attendance telemetry active ({existing_att_count} logs).")
        else:
            start_date = date(2026, 8, 1)
            attendance_records = []

            for s, att_prob, _, _ in student_meta:
                for subj in subjects:
                    # 25 class sessions per subject
                    for day in range(25):
                        c_date = start_date + timedelta(days=day)
                        c_dt = datetime.combine(c_date, datetime.min.time())

                        already = db.query(Attendance).filter(
                            Attendance.student_id == s.id,
                            Attendance.subject_id == subj.id,
                            Attendance.date == c_dt
                        ).first()
                        if already:
                            continue

                        status = "present" if random.random() < att_prob else "absent"
                        attendance_records.append(
                            Attendance(
                                student_id=s.id,
                                subject_id=subj.id,
                                date=c_dt,
                                status=status
                            )
                        )

            db.add_all(attendance_records)
            db.commit()
            print(f"📊 {len(attendance_records)} Attendance telemetry records logged.")

        # ── 8. Generate Realistic Mark Assessments ───────────────
        existing_mark_count = db.query(Mark).count()
        if existing_mark_count > 100 and not reset_demo:
            print(f"📝 Academic assessment records active ({existing_mark_count} marks).")
        else:
            marks_records = []
            for s, _, int_range, ext_range in student_meta:
                for subj in subjects:
                    for exam_type, r_range, max_score in [
                        ("Internal", int_range, 40.0),
                        ("External", ext_range, 60.0),
                    ]:
                        already = db.query(Mark).filter(
                            Mark.student_id == s.id,
                            Mark.subject_id == subj.id,
                            Mark.exam_type == exam_type
                        ).first()
                        if already:
                            continue

                        obtained = float(random.randint(*r_range))
                        pct = (obtained / max_score) * 100
                        grade = (
                            "A+" if pct >= 90 else
                            ("A" if pct >= 80 else
                            ("B" if pct >= 70 else
                            ("C" if pct >= 60 else
                            ("D" if pct >= 50 else "F"))))
                        )

                        marks_records.append(
                            Mark(
                                student_id=s.id,
                                subject_id=subj.id,
                                exam_type=exam_type,
                                marks_obtained=obtained,
                                max_marks=max_score,
                                grade=grade
                            )
                        )

            db.add_all(marks_records)
            db.commit()
            print(f"📝 {len(marks_records)} Academic assessment marks saved.")

        # ── 9. Pre-seed a sample Faculty Alert Notification ───────
        if parent_user and students:
            existing_notif = db.query(ParentNotification).filter(
                ParentNotification.parent_user_id == parent_user.id
            ).first()
            if not existing_notif:
                notif = ParentNotification(
                    parent_user_id=parent_user.id,
                    student_id=students[0].id,
                    title="Academic Advisory Notice",
                    message=f"Attendance telemetry for {students[0].first_name} {students[0].last_name} is below 60%. Faculty remedial sessions scheduled.",
                    type="attendance_warning",
                    is_read=False,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(notif)
                db.commit()

        print("\n" + "=" * 60)
        print("🎉 CAMPUSFLOW AI DATABASE SEEDED SUCCESSFULLY FOR VIVA DEMO!")
        print("=" * 60)
        print("Demo Viva Credentials:")
        print("  👑 Admin:   admin@campusflow.com   / admin123")
        print("  👨‍🏫 Faculty: faculty@campusflow.com / faculty123")
        print("  👨‍🎓 Student: student@campusflow.com / student123")
        print("  👨‍👩‍👧 Parent:  parent@campusflow.com  / parent123")
        print("=" * 60 + "\n")

    except Exception as exc:
        db.rollback()
        print(f"❌ Seeding encountered an error: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset_demo = "--reset-demo" in sys.argv
    seed_database(reset_demo=reset_demo)
