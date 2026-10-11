import pandas as pd

from models.student import Student
from models.attendance import Attendance
from models.marks import Mark


def build_student_features(db):

    students = db.query(Student).all()

    rows = []

    for student in students:

        # -------------------------
        # Attendance
        # -------------------------

        attendance_records = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == student.id
            )
            .all()
        )

        if attendance_records:

            present = sum(
                1
                for record in attendance_records
                if record.status == "present"
            )

            attendance_percentage = (
                present /
                len(attendance_records)
            ) * 100

        else:

            attendance_percentage = 0


        # -------------------------
        # Marks
        # -------------------------

        marks_records = (
            db.query(Mark)
            .filter(
                Mark.student_id == student.id
            )
            .all()
        )

        if marks_records:

            average_marks = sum(
                float(record.marks_obtained or 0)
                for record in marks_records
            ) / len(marks_records)

            highest_marks = max(
                float(record.marks_obtained or 0)
                for record in marks_records
            )

            lowest_marks = min(
                float(record.marks_obtained or 0)
                for record in marks_records
            )

        else:

            average_marks = 0
            highest_marks = 0
            lowest_marks = 0


        # -------------------------
        # Feature vector
        # -------------------------

        rows.append({

            "student_id": student.id,

            "attendance_percentage":
                round(attendance_percentage, 2),

            "average_marks":
                round(average_marks, 2),

            "highest_marks":
                round(highest_marks, 2),

            "lowest_marks":
                round(lowest_marks, 2),

            "marks_range":
                round(
                    highest_marks -
                    lowest_marks,
                    2
                )
        })


    return pd.DataFrame(rows)