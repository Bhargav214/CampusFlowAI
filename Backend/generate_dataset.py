import random
from datetime import date, timedelta

import pandas as pd


STUDENT_IDS = list(range(1, 51))

SUBJECT_IDS = [1, 2, 3]


# -----------------------------
# Attendance
# -----------------------------

attendance_rows = []

start_date = date(2026, 7, 1)

for student_id in STUDENT_IDS:

    for subject_id in SUBJECT_IDS:

        for day in range(30):

            current_date = (
                start_date +
                timedelta(days=day)
            )

            # Roughly 85% attendance
            status = random.choices(
                ["present", "absent"],
                weights=[85, 15]
            )[0]

            attendance_rows.append({

                "student_id": student_id,

                "subject_id": subject_id,

                "date": current_date,

                "status": status
            })


attendance_df = pd.DataFrame(
    attendance_rows
)


attendance_df.to_csv(
    "attendance.csv",
    index=False
)


# -----------------------------
# Marks
# -----------------------------

marks_rows = []

for student_id in STUDENT_IDS:

    for subject_id in SUBJECT_IDS:

        internal = random.randint(
            15,
            40
        )

        external = random.randint(
            25,
            60
        )

        marks_rows.append({

            "student_id": student_id,

            "subject_id": subject_id,

            "internal": internal,

            "external": external
        })


marks_df = pd.DataFrame(
    marks_rows
)


marks_df.to_csv(
    "marks.csv",
    index=False
)


print(
    f"Generated {len(attendance_df)} attendance records"
)

print(
    f"Generated {len(marks_df)} marks records"
)