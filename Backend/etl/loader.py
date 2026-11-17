import logging
import pandas as pd
from sqlalchemy.orm import Session

from models.attendance import Attendance
from models.marks import Mark
from models.student import Student

logger = logging.getLogger("campusflow.etl")


def load_attendance(
    df: pd.DataFrame,
    db: Session
):
    """
    Loads transformed attendance records into the database with atomic transaction management.
    Skips in-file and database duplicate records.
    """
    loaded = 0
    duplicates = 0
    seen = set()

    try:
        for _, row in df.iterrows():
            key = (
                int(row["student_id"]),
                int(row["subject_id"]),
                str(row["date"]),
            )

            if key in seen:
                duplicates += 1
                continue

            existing = db.query(Attendance).filter(
                Attendance.student_id == int(row["student_id"]),
                Attendance.subject_id == int(row["subject_id"]),
                Attendance.date == row["date"]
            ).first()

            if existing:
                duplicates += 1
                seen.add(key)
                continue

            attendance = Attendance(
                student_id=int(row["student_id"]),
                subject_id=int(row["subject_id"]),
                date=row["date"],
                status=str(row["status"]).strip().lower()
            )

            db.add(attendance)
            seen.add(key)
            loaded += 1

        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(f"ETL Attendance loading failed, rolled back: {exc}")
        raise exc

    return {
        "loaded": loaded,
        "duplicates": duplicates,
        "records_received": len(df)
    }


def load_marks(
    df: pd.DataFrame,
    db: Session
):
    """
    Loads transformed marks records into the database with atomic transaction management.
    Skips in-file and database duplicate records.
    """
    loaded = 0
    duplicates = 0
    seen = set()

    try:
        for _, row in df.iterrows():
            key = (
                int(row["student_id"]),
                int(row["subject_id"]),
                str(row["exam_type"]).strip().upper(),
            )

            if key in seen:
                duplicates += 1
                continue

            existing = db.query(Mark).filter(
                Mark.student_id == int(row["student_id"]),
                Mark.subject_id == int(row["subject_id"]),
                Mark.exam_type == str(row["exam_type"]).strip().upper()
            ).first()

            if existing:
                duplicates += 1
                seen.add(key)
                continue

            grade_val = row.get("grade")
            marks = Mark(
                student_id=int(row["student_id"]),
                subject_id=int(row["subject_id"]),
                exam_type=str(row["exam_type"]).strip().upper(),
                marks_obtained=float(row["marks_obtained"]),
                max_marks=float(row["max_marks"]),
                grade=str(grade_val).strip() if pd.notna(grade_val) and str(grade_val).strip() != "" else None
            )

            db.add(marks)
            seen.add(key)
            loaded += 1

        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(f"ETL Marks loading failed, rolled back: {exc}")
        raise exc

    return {
        "loaded": loaded,
        "duplicates": duplicates,
        "records_received": len(df)
    }


def load_students(
    df: pd.DataFrame,
    db: Session
):
    """
    Loads transformed student directory records with atomic transaction management.
    Ensures roll number and email uniqueness.
    """
    loaded = 0
    duplicates = 0

    try:
        existing_roll_numbers = {
            roll_number.casefold()
            for (roll_number,) in db.query(Student.roll_number).all()
            if roll_number
        }
        existing_emails = {
            email.casefold()
            for (email,) in db.query(Student.email).all()
            if email
        }

        for _, row in df.iterrows():
            roll_number = str(row["roll_number"]).strip().upper()
            email = str(row["email"]).strip().lower()

            if (
                roll_number.casefold() in existing_roll_numbers
                or email.casefold() in existing_emails
            ):
                duplicates += 1
                continue

            phone = row.get("phone")
            address = row.get("address")
            student = Student(
                roll_number=roll_number,
                first_name=str(row["first_name"]).strip(),
                last_name=str(row["last_name"]).strip(),
                email=email,
                department=str(row["department"]).strip(),
                semester=int(row["semester"]),
                phone=str(phone).strip() if pd.notna(phone) and str(phone).strip() != "" else None,
                address=str(address).strip() if pd.notna(address) and str(address).strip() != "" else None,
            )

            db.add(student)
            existing_roll_numbers.add(roll_number.casefold())
            existing_emails.add(email.casefold())
            loaded += 1

        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(f"ETL Student loading failed, rolled back: {exc}")
        raise exc

    return {
        "loaded": loaded,
        "duplicates": duplicates,
        "records_received": len(df)
    }