from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.marks import Mark
from models.student import Student
from schemas.marks import MarkCreate, MarkResponse
from auth.dependencies import require_role, get_current_user

router = APIRouter(
    prefix="/marks",
    tags=["Marks"]
)


@router.post("/", response_model=MarkResponse)
def create_marks(
    data: MarkCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty"))
):
    existing = db.query(Mark).filter(
        Mark.student_id == data.student_id,
        Mark.subject_id == data.subject_id,
        Mark.exam_type == data.exam_type
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Marks already recorded for this student, subject, and exam type"
        )

    # Handle internal/external conversion if schema provides them,
    # or use marks_obtained directly based on your MarkCreate schema
    marks_obtained = getattr(data, "marks_obtained", None)
    if marks_obtained is None and hasattr(data, "internal") and hasattr(data, "external"):
        marks_obtained = data.internal + data.external

    if marks_obtained is not None and marks_obtained > data.max_marks:
        raise HTTPException(
            status_code=400,
            detail="Marks obtained cannot exceed maximum marks"
        )

    marks = Mark(
        student_id=data.student_id,
        subject_id=data.subject_id,
        exam_type=data.exam_type,
        marks_obtained=marks_obtained,
        max_marks=data.max_marks,
        grade=getattr(data, "grade", None)
    )

    db.add(marks)
    db.commit()
    db.refresh(marks)

    return marks


@router.get("/", response_model=list[MarkResponse])
def get_marks(
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Admin / Faculty: returns all marks records.
    Student: returns ONLY the authenticated student's own marks.
    The student identity is derived from the JWT — never from a request parameter.
    """

    if current_user.role in ("admin", "faculty"):
        return db.query(Mark).offset(skip).limit(limit).all()

    if current_user.role == "student":
        student = db.query(Student).filter(
            Student.user_id == current_user.id
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found for this account"
            )

        return db.query(Mark).filter(
            Mark.student_id == student.id
        ).all()

    raise HTTPException(
        status_code=403,
        detail="Access denied"
    )