from sqlalchemy.orm import Session

from models.attendance import Attendance
from models.marks import Mark


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