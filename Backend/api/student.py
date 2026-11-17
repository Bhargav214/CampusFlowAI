from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from database.connection import get_db
from models.student import Student

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

from auth.dependencies import get_current_user, require_role

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
    current_user=Depends(get_current_user)
):

    if current_user.role in ("admin", "faculty"):
        return get_students(db)

    if current_user.role == "student":
        student = db.query(Student).filter(
            Student.user_id == current_user.id
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found for this account"
            )

        return [student]

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this resource"
    )


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