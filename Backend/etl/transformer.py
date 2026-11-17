import pandas as pd


def _clean_string_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Strips whitespace from all object/string columns in the dataframe."""
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype(str).str.strip()
    return df


def transform_attendance(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and standardizes raw attendance data:
    - Drops completely empty rows
    - Strips whitespace
    - Lowercases status ('present' / 'absent')
    - Parses dates safely
    - Coerces IDs to integer
    """
    df = df.copy()
    df.dropna(how="all", inplace=True)
    df = _clean_string_columns(df)

    if "status" in df.columns:
        df["status"] = df["status"].astype(str).str.strip().str.lower()

    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date

    if "student_id" in df.columns:
        df["student_id"] = pd.to_numeric(df["student_id"], errors="coerce").fillna(0).astype(int)

    if "subject_id" in df.columns:
        df["subject_id"] = pd.to_numeric(df["subject_id"], errors="coerce").fillna(0).astype(int)

    return df


def transform_marks(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and standardizes raw marks data:
    - Drops completely empty rows
    - Strips whitespace
    - Safely converts IDs and marks to numeric values
    - Handles internal/external breakdown or single score
    - Auto-computes letter grades
    """
    df = df.copy()
    df.dropna(how="all", inplace=True)
    df = _clean_string_columns(df)

    if "student_id" in df.columns:
        df["student_id"] = pd.to_numeric(df["student_id"], errors="coerce").fillna(0).astype(int)

    if "subject_id" in df.columns:
        df["subject_id"] = pd.to_numeric(df["subject_id"], errors="coerce").fillna(0).astype(int)

    if {"internal", "external"}.issubset(df.columns):
        df["internal"] = pd.to_numeric(df["internal"], errors="coerce").fillna(0.0)
        df["external"] = pd.to_numeric(df["external"], errors="coerce").fillna(0.0)
        df["marks_obtained"] = df["internal"] + df["external"]
        df["max_marks"] = 100.0
        df["exam_type"] = "FINAL"
    else:
        if "marks_obtained" in df.columns:
            df["marks_obtained"] = pd.to_numeric(df["marks_obtained"], errors="coerce")
        if "max_marks" in df.columns:
            df["max_marks"] = pd.to_numeric(df["max_marks"], errors="coerce").fillna(100.0)
        if "exam_type" in df.columns:
            df["exam_type"] = df["exam_type"].astype(str).str.strip().str.upper()

    # Calculate letter grade
    def calculate_grade(row):
        try:
            obt = float(row.get("marks_obtained", 0))
            max_m = float(row.get("max_marks", 100))
            if max_m <= 0:
                return "F"
            pct = (obt / max_m) * 100
            if pct >= 90:
                return "A+"
            elif pct >= 80:
                return "A"
            elif pct >= 70:
                return "B"
            elif pct >= 60:
                return "C"
            elif pct >= 50:
                return "D"
            else:
                return "F"
        except Exception:
            return "F"

    if "grade" not in df.columns or df["grade"].isnull().any():
        df["grade"] = df.apply(calculate_grade, axis=1)

    return df


def transform_students(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and standardizes raw student directory records:
    - Drops completely empty rows
    - Strips whitespace
    - Uppercases roll numbers
    - Lowercases emails
    - Coerces semester to integer
    """
    df = df.copy()
    df.dropna(how="all", inplace=True)
    df = _clean_string_columns(df)

    if "roll_number" in df.columns:
        df["roll_number"] = df["roll_number"].astype(str).str.strip().str.upper()

    if "email" in df.columns:
        df["email"] = df["email"].astype(str).str.strip().str.lower()

    if "first_name" in df.columns:
        df["first_name"] = df["first_name"].astype(str).str.strip()

    if "last_name" in df.columns:
        df["last_name"] = df["last_name"].astype(str).str.strip()

    if "department" in df.columns:
        df["department"] = df["department"].astype(str).str.strip()

    if "semester" in df.columns:
        df["semester"] = pd.to_numeric(df["semester"], errors="coerce").fillna(1).astype(int)

    return df