from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from database.connection import get_db

from schemas.student import (
    StudentCreate,
    StudentResponse
)

from services.student_service import (
    create_student,
    get_students,
    get_student,
    delete_student
)

from auth.dependencies import require_role


router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


@router.post(
    "/",
    response_model=StudentResponse
)
def create_student_api(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):

    try:
        return create_student(
            db,
            data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get(
    "/",
    response_model=list[StudentResponse]
)
def list_students(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):

    return get_students(db)


@router.get(
    "/{student_id}",
    response_model=StudentResponse
)
def get_student_api(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):

    student = get_student(
        db,
        student_id
    )

    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student


@router.delete(
    "/{student_id}"
)
def delete_student_api(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):

    student = get_student(
        db,
        student_id
    )

    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    delete_student(
        db,
        student
    )

    return {
        "message": "Student deleted successfully"
    }