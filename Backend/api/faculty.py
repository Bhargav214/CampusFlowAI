from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from database.connection import get_db

from schemas.faculty import (
    FacultyCreate,
    FacultyRead,
)

from services.faculty_service import (
    create_faculty,
    get_faculties,
    get_faculty,
    delete_faculty
)

from auth.dependencies import require_role


router = APIRouter(
    prefix="/faculty",
    tags=["Faculty"]
)


@router.post(
    "/",
    response_model=FacultyRead
)
def create_faculty_api(
    data: FacultyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):

    try:

        return create_faculty(
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
    response_model=list[FacultyRead]
)
def list_faculty(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):

    return get_faculties(db)


@router.get(
    "/{faculty_id}",
    response_model=FacultyRead
)
def get_faculty_api(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):

    faculty = get_faculty(
        db,
        faculty_id
    )

    if not faculty:

        raise HTTPException(
            status_code=404,
            detail="Faculty not found"
        )

    return faculty


@router.delete(
    "/{faculty_id}"
)
def delete_faculty_api(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):

    faculty = get_faculty(
        db,
        faculty_id
    )

    if not faculty:

        raise HTTPException(
            status_code=404,
            detail="Faculty not found"
        )

    delete_faculty(
        db,
        faculty
    )

    return {
        "message": "Faculty deleted successfully"
    }