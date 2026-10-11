import pandas as pd

def transform_attendance(df: pd.DataFrame):
    df = df.copy()

    df["status"] = (
        df["status"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    df["date"] = pd.to_datetime(df["date"]).dt.date
    df["student_id"] = df["student_id"].astype(int)
    df["subject_id"] = df["subject_id"].astype(int)

    return df

def transform_marks(df: pd.DataFrame):

    df = df.copy()

    # Convert IDs
    df["student_id"] = df["student_id"].astype(int)
    df["subject_id"] = df["subject_id"].astype(int)

    if {"internal", "external"}.issubset(df.columns):
        df["internal"] = pd.to_numeric(
            df["internal"],
            errors="coerce"
        )

        df["external"] = pd.to_numeric(
            df["external"],
            errors="coerce"
        )

        df["marks_obtained"] = (
            df["internal"] +
            df["external"]
        )

        df["max_marks"] = 100.0
        df["exam_type"] = "FINAL"

        percentage = (
            df["marks_obtained"] /
            df["max_marks"]
        ) * 100

        def calculate_grade(mark):
            if mark >= 90:
                return "A+"
            elif mark >= 80:
                return "A"
            elif mark >= 70:
                return "B"
            elif mark >= 60:
                return "C"
            elif mark >= 50:
                return "D"
            else:
                return "F"

        df["grade"] = percentage.apply(calculate_grade)
    else:
        df["marks_obtained"] = pd.to_numeric(
            df["marks_obtained"],
            errors="coerce"
        )
        df["max_marks"] = pd.to_numeric(
            df["max_marks"],
            errors="coerce"
        )
        df["exam_type"] = df["exam_type"].astype(str).str.strip()

    return df