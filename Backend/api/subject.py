from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.subject import Subject
from schemas.subject import SubjectCreate, SubjectRead
from auth.dependencies import require_role


router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"]
)


@router.post(
    "/",
    response_model=SubjectRead
)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):

    existing = db.query(Subject).filter(
        Subject.subject_code == data.subject_code
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Subject code already exists"
        )

    subject = Subject(**data.model_dump())

    db.add(subject)
    db.commit()
    db.refresh(subject)

    return subject


@router.get(
    "/",
    response_model=list[SubjectRead]
)
def get_subjects(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty", "student")
    )
):

    return db.query(Subject).all()


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):

    subject = db.query(Subject).filter(
        Subject.id == subject_id
    ).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    db.delete(subject)
    db.commit()

    return {
        "message": "Subject deleted successfully"
    }
