import re
from typing import List, Dict, Any, Tuple
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

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_columns(df: pd.DataFrame, required_columns: set) -> Tuple[bool, List[Dict[str, Any]]]:
    """Checks whether all required schema columns exist in the dataframe."""
    missing = required_columns - set(df.columns)
    if missing:
        return False, [
            {
                "row_number": 0,
                "column": col,
                "error_message": f"Required header column '{col}' is missing."
            }
            for col in sorted(missing)
        ]
    return True, []


def validate_attendance(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Validates attendance dataset rows.
    Returns structured row-level diagnostics: row_number, column, error_message.
    """
    errors: List[Dict[str, Any]] = []
    valid, column_errors = validate_columns(df, ATTENDANCE_COLUMNS)
    if not valid:
        return column_errors

    valid_statuses = {"present", "absent"}

    for idx, row in df.iterrows():
        row_num = int(idx) + 1

        # student_id
        val_sid = row.get("student_id")
        if pd.isna(val_sid) or str(val_sid).strip() == "":
            errors.append({
                "row_number": row_num,
                "column": "student_id",
                "error_message": "Missing student_id"
            })
        else:
            try:
                int(float(val_sid))
            except (ValueError, TypeError):
                errors.append({
                    "row_number": row_num,
                    "column": "student_id",
                    "error_message": f"Invalid student_id format '{val_sid}'"
                })

        # subject_id
        val_sub = row.get("subject_id")
        if pd.isna(val_sub) or str(val_sub).strip() == "":
            errors.append({
                "row_number": row_num,
                "column": "subject_id",
                "error_message": "Missing subject_id"
            })
        else:
            try:
                int(float(val_sub))
            except (ValueError, TypeError):
                errors.append({
                    "row_number": row_num,
                    "column": "subject_id",
                    "error_message": f"Invalid subject_id format '{val_sub}'"
                })

        # status
        val_status = str(row.get("status", "")).strip().lower()
        if val_status not in valid_statuses:
            errors.append({
                "row_number": row_num,
                "column": "status",
                "error_message": f"Status '{row.get('status')}' must be 'Present' or 'Absent'"
            })

        # date
        val_date = row.get("date")
        if pd.isna(val_date) or str(val_date).strip() == "":
            errors.append({
                "row_number": row_num,
                "column": "date",
                "error_message": "Missing date"
            })
        else:
            parsed = pd.to_datetime(val_date, errors="coerce")
            if pd.isna(parsed):
                errors.append({
                    "row_number": row_num,
                    "column": "date",
                    "error_message": f"Cannot parse date '{val_date}'"
                })

    return errors


def validate_marks(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Validates marks dataset rows.
    Returns structured row-level diagnostics: row_number, column, error_message.
    """
    errors: List[Dict[str, Any]] = []

    # Check columns — allow internal/external alternative
    has_combined = MARKS_COLUMNS.issubset(set(df.columns))
    has_split = {"student_id", "subject_id", "internal", "external"}.issubset(set(df.columns))

    if not has_combined and not has_split:
        missing = MARKS_COLUMNS - set(df.columns)
        return [
            {
                "row_number": 0,
                "column": col,
                "error_message": f"Required marks column '{col}' is missing."
            }
            for col in sorted(missing)
        ]

    for idx, row in df.iterrows():
        row_num = int(idx) + 1

        # IDs
        for id_col in ["student_id", "subject_id"]:
            val_id = row.get(id_col)
            if pd.isna(val_id) or str(val_id).strip() == "":
                errors.append({
                    "row_number": row_num,
                    "column": id_col,
                    "error_message": f"Missing {id_col}"
                })
            else:
                try:
                    int(float(val_id))
                except (ValueError, TypeError):
                    errors.append({
                        "row_number": row_num,
                        "column": id_col,
                        "error_message": f"Invalid integer for {id_col}: '{val_id}'"
                    })

        # Numerical checks
        if has_split:
            for split_col in ["internal", "external"]:
                val = pd.to_numeric(row.get(split_col), errors="coerce")
                if pd.isna(val):
                    errors.append({
                        "row_number": row_num,
                        "column": split_col,
                        "error_message": f"'{split_col}' must be a valid number"
                    })
                elif val < 0:
                    errors.append({
                        "row_number": row_num,
                        "column": split_col,
                        "error_message": f"'{split_col}' cannot be negative"
                    })
        else:
            obt = pd.to_numeric(row.get("marks_obtained"), errors="coerce")
            max_m = pd.to_numeric(row.get("max_marks"), errors="coerce")

            if pd.isna(obt):
                errors.append({
                    "row_number": row_num,
                    "column": "marks_obtained",
                    "error_message": "marks_obtained must be a valid number"
                })
            elif obt < 0:
                errors.append({
                    "row_number": row_num,
                    "column": "marks_obtained",
                    "error_message": "marks_obtained cannot be negative"
                })

            if pd.isna(max_m):
                errors.append({
                    "row_number": row_num,
                    "column": "max_marks",
                    "error_message": "max_marks must be a valid number"
                })
            elif max_m <= 0:
                errors.append({
                    "row_number": row_num,
                    "column": "max_marks",
                    "error_message": "max_marks must be greater than zero"
                })

            if not pd.isna(obt) and not pd.isna(max_m) and max_m > 0 and obt > max_m:
                errors.append({
                    "row_number": row_num,
                    "column": "marks_obtained",
                    "error_message": f"marks_obtained ({obt}) cannot exceed max_marks ({max_m})"
                })

    return errors


def validate_students(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Validates students dataset rows.
    Returns structured row-level diagnostics: row_number, column, error_message.
    """
    errors: List[Dict[str, Any]] = []
    valid, column_errors = validate_columns(df, STUDENT_COLUMNS)
    if not valid:
        return column_errors

    max_lengths = {
        "roll_number": 30,
        "first_name": 50,
        "last_name": 50,
        "email": 100,
        "department": 100,
        "phone": 20,
        "address": 255,
    }

    for idx, row in df.iterrows():
        row_num = int(idx) + 1

        # Check required non-blank strings
        for req_col in ["roll_number", "first_name", "last_name", "email", "department"]:
            val = row.get(req_col)
            if pd.isna(val) or str(val).strip() == "":
                errors.append({
                    "row_number": row_num,
                    "column": req_col,
                    "error_message": f"Field '{req_col}' cannot be blank"
                })

        # Length checks
        for col, max_len in max_lengths.items():
            if col in row and pd.notna(row[col]):
                if len(str(row[col]).strip()) > max_len:
                    errors.append({
                        "row_number": row_num,
                        "column": col,
                        "error_message": f"'{col}' exceeds maximum length of {max_len} characters"
                    })

        # Email validation
        val_email = str(row.get("email", "")).strip()
        if val_email and not EMAIL_REGEX.match(val_email):
            errors.append({
                "row_number": row_num,
                "column": "email",
                "error_message": f"Invalid email format: '{val_email}'"
            })

        # Semester validation (1-12)
        sem_val = pd.to_numeric(row.get("semester"), errors="coerce")
        if pd.isna(sem_val) or sem_val % 1 != 0:
            errors.append({
                "row_number": row_num,
                "column": "semester",
                "error_message": f"Semester must be a whole number, got '{row.get('semester')}'"
            })
        elif sem_val < 1 or sem_val > 12:
            errors.append({
                "row_number": row_num,
                "column": "semester",
                "error_message": f"Semester must be between 1 and 12, got {int(sem_val)}"
            })

    return errors