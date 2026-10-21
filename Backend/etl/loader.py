import pandas as pd

from sqlalchemy.orm import Session

from models.attendance import Attendance
from models.marks import Mark
from models.student import Student


def load_attendance(
    df,
    db: Session
):

    loaded = 0
    duplicates = 0
    seen = set()

    for _, row in df.iterrows():

        key = (
            row["student_id"],
            row["subject_id"],
            row["date"],
        )
        existing = db.query(
            Attendance
        ).filter(
            Attendance.student_id ==
            row["student_id"],

            Attendance.subject_id ==
            row["subject_id"],

            Attendance.date ==
            row["date"]
        ).first()

        if existing or key in seen:

            duplicates += 1
            continue

        attendance = Attendance(
            student_id=row["student_id"],
            subject_id=row["subject_id"],
            date=row["date"],
            status=row["status"]
        )

        db.add(attendance)
        seen.add(key)

        loaded += 1

    db.commit()

    return {
        "loaded": loaded,
        "duplicates": duplicates
    }


def load_marks(
    df,
    db: Session
):

    loaded = 0
    duplicates = 0
    seen = set()

    for _, row in df.iterrows():

        key = (
            row["student_id"],
            row["subject_id"],
            row["exam_type"],
        )
        existing = db.query(
            Mark
        ).filter(
            Mark.student_id == row["student_id"],
            Mark.subject_id == row["subject_id"],
            Mark.exam_type == row["exam_type"]
        ).first()

        if existing or key in seen:
            duplicates += 1
            continue

        marks = Mark(
            student_id=int(row["student_id"]),
            subject_id=int(row["subject_id"]),
            exam_type=str(row["exam_type"]),
            marks_obtained=float(row["marks_obtained"]),
            max_marks=float(row["max_marks"]),
            grade=(
                str(row["grade"])
                if "grade" in row and row["grade"] is not None
                else None
            )
        )

        db.add(marks)
        seen.add(key)

        loaded += 1

    db.commit()

    return {
        "loaded": loaded,
        "duplicates": duplicates
    }


def load_students(df, db: Session):
    existing_roll_numbers = {
        roll_number.casefold()
        for (roll_number,) in db.query(Student.roll_number).all()
    }
    existing_emails = {
        email.casefold()
        for (email,) in db.query(Student.email).all()
    }

    loaded = 0
    duplicates = 0

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
            phone=str(phone).strip() or None if pd.notna(phone) else None,
            address=str(address).strip() or None if pd.notna(address) else None,
        )

        db.add(student)
        existing_roll_numbers.add(roll_number.casefold())
        existing_emails.add(email.casefold())
        loaded += 1

    db.commit()

    return {
        "loaded": loaded,
        "duplicates": duplicates
    }