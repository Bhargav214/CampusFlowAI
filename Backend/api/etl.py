import os

import pandas as pd

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile
)

from sqlalchemy.orm import Session

from database.connection import get_db

from auth.dependencies import require_role

from etl.validator import (
    validate_attendance,
    validate_marks,
    validate_students,
)

from etl.transformer import (
    transform_attendance,
    transform_marks
)

from etl.loader import (
    load_attendance,
    load_marks,
    load_students,
)


router = APIRouter(
    prefix="/etl",
    tags=["ETL"]
)


UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


def read_uploaded_file(
    file: UploadFile
):

    filename = file.filename.lower()

    if filename.endswith(".csv"):

        return pd.read_csv(file.file)

    if filename.endswith(
        (".xlsx", ".xls")
    ):

        return pd.read_excel(file.file)

    raise HTTPException(
        status_code=400,
        detail="Only CSV and Excel files are supported"
    )


@router.post(
    "/attendance"
)
def upload_attendance(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):

    df = read_uploaded_file(file)

    errors = validate_attendance(df)

    if errors:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Validation failed",
                "errors": errors
            }
        )

    df = transform_attendance(df)

    result = load_attendance(
        df,
        db
    )

    return {
        "message": "Attendance ETL completed",
        "filename": file.filename,
        "records_received": len(df),
        **result
    }


@router.post(
    "/marks"
)
def upload_marks(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):

    df = read_uploaded_file(file)

    errors = validate_marks(df)

    if errors:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Validation failed",
                "errors": errors
            }
        )

    df = transform_marks(df)

    result = load_marks(
        df,
        db
    )

    return {
        "message": "Marks ETL completed",
        "filename": file.filename,
        "records_received": len(df),
        **result
    }


@router.post(
    "/students"
)
def upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):
    df = read_uploaded_file(file)

    errors = validate_students(df)

    if errors:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Validation failed",
                "errors": errors
            }
        )

    result = load_students(df, db)

    return {
        "message": "Student ETL completed",
        "filename": file.filename,
        "records_received": len(df),
        **result
    }