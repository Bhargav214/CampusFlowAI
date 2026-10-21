import pandas as pd

ATTENDANCE_COLUMNS = {
    "student_id",
    "subject_id",
    "date",
    "status"
}

MARKS_COLUMNS = {
    "student_id",
    "subject_id",
    "exam_type",
    "marks_obtained",
    "max_marks"
}

STUDENT_COLUMNS = {
    "roll_number",
    "first_name",
    "last_name",
    "email",
    "department",
    "semester",
}


def validate_columns(df: pd.DataFrame, required_columns: set):
    missing = required_columns - set(df.columns)
    if missing:
        return False, [f"Missing columns: {', '.join(missing)}"]
    return True, []


def validate_attendance(df: pd.DataFrame):
    errors = []
    valid, column_errors = validate_columns(df, ATTENDANCE_COLUMNS)
    if not valid:
        return column_errors

    # Missing values
    for column in ATTENDANCE_COLUMNS:
        if df[column].isnull().any():
            errors.append(f"Missing values found in {column}")

    # Status validation
    valid_statuses = {"present", "absent"}
    invalid_status = ~df["status"].astype(str).str.strip().str.lower().isin(valid_statuses)
    if invalid_status.any():
        errors.append("Invalid attendance status found (must be Present or Absent)")

    # Date validation
    converted_dates = pd.to_datetime(df["date"], errors="coerce")
    if converted_dates.isnull().any():
        errors.append("Invalid date values found")

    return errors


def validate_marks(df: pd.DataFrame):
    errors = []
    valid, column_errors = validate_columns(df, MARKS_COLUMNS)
    if not valid:
        return column_errors

    # Missing values for mandatory fields
    for column in MARKS_COLUMNS:
        if df[column].isnull().any():
            errors.append(f"Missing values found in {column}")

    # Numeric conversion checks
    marks_obtained = pd.to_numeric(df["marks_obtained"], errors="coerce")
    max_marks = pd.to_numeric(df["max_marks"], errors="coerce")

    if marks_obtained.isnull().any():
        errors.append("marks_obtained must contain valid numeric values")

    if max_marks.isnull().any():
        errors.append("max_marks must contain valid numeric values")

    # Range and logic validation
    if not marks_obtained.isnull().any() and not max_marks.isnull().any():
        if (marks_obtained < 0).any():
            errors.append("marks_obtained cannot be negative")

        if (max_marks <= 0).any():
            errors.append("max_marks must be greater than 0")

        if (marks_obtained > max_marks).any():
            errors.append("marks_obtained cannot exceed max_marks")

    return errors


def validate_students(df: pd.DataFrame):
    errors = []
    valid, column_errors = validate_columns(df, STUDENT_COLUMNS)
    if not valid:
        return column_errors

    for column in STUDENT_COLUMNS:
        if df[column].isnull().any():
            errors.append(f"Missing values found in {column}")

    for column, max_length in {
        "roll_number": 30,
        "first_name": 50,
        "last_name": 50,
        "email": 100,
        "department": 100,
        "phone": 20,
        "address": 255,
    }.items():
        if column in df.columns and (
            df[column].dropna().astype(str).str.len() > max_length
        ).any():
            errors.append(f"{column} exceeds the maximum length of {max_length}")

    emails = df["email"].dropna().astype(str).str.strip()
    if (~emails.str.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")).any():
        errors.append("Invalid email address found")

    semesters = pd.to_numeric(df["semester"], errors="coerce")
    if semesters.isnull().any() or (semesters % 1 != 0).any():
        errors.append("semester must contain whole numbers")
    elif ((semesters < 1) | (semesters > 12)).any():
        errors.append("semester must be between 1 and 12")

    for column in ("roll_number", "first_name", "last_name", "department"):
        if (df[column].dropna().astype(str).str.strip() == "").any():
            errors.append(f"{column} cannot be blank")

    return errors