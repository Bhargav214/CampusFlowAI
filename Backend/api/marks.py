from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.marks import Mark
from models.student import Student
from models.subject import Subject
from schemas.marks import MarkCreate, MarkResponse, BulkMarkCreate
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

    if marks_obtained is None:
        raise HTTPException(
            status_code=400,
            detail="marks_obtained is required"
        )

    if marks_obtained > data.max_marks:
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


@router.post("/bulk")
def create_marks_bulk(
    data: BulkMarkCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty"))
):
    """
    Atomic batch upsert for classroom marks entry.
    Updates existing grade and marks if recorded, or inserts new evaluation records.
    """
    if not data.records:
        return {
            "status": "success",
            "message": "No marks records provided",
            "inserted": 0,
            "updated": 0,
            "total": 0
        }

    inserted = 0
    updated = 0

    def compute_letter_grade(score: float, max_s: float) -> str:
        if max_s <= 0:
            return "F"
        pct = (score / max_s) * 100
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
        return "F"

    try:
        for item in data.records:
            if item.marks_obtained > item.max_marks:
                raise ValueError(
                    f"Student {item.student_id}: marks obtained ({item.marks_obtained}) exceeds max marks ({item.max_marks})"
                )

            grade = item.grade or compute_letter_grade(item.marks_obtained, item.max_marks)

            existing = db.query(Mark).filter(
                Mark.student_id == item.student_id,
                Mark.subject_id == item.subject_id,
                Mark.exam_type == item.exam_type
            ).first()

            if existing:
                existing.marks_obtained = item.marks_obtained
                existing.max_marks = item.max_marks
                existing.grade = grade
                updated += 1
            else:
                record = Mark(
                    student_id=item.student_id,
                    subject_id=item.subject_id,
                    exam_type=item.exam_type,
                    marks_obtained=item.marks_obtained,
                    max_marks=item.max_marks,
                    grade=grade
                )
                db.add(record)
                inserted += 1

        db.commit()
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Batch marks processing failed: {exc}"
        )

    return {
        "status": "success",
        "message": f"Successfully processed {len(data.records)} mark records ({inserted} inserted, {updated} updated)",
        "inserted": inserted,
        "updated": updated,
        "total": len(data.records)
    }


@router.get("/", response_model=list[MarkResponse])
def get_marks(
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Admin / Faculty: returns all marks records.
    Student: returns ONLY the authenticated student's own marks.
    The student identity is derived from the JWT — never from a request parameter.
    """
    if current_user.role in ("admin", "faculty"):
        records = (
            db.query(Mark, Subject.name.label("subject_name"))
            .outerjoin(Subject, Mark.subject_id == Subject.id)
            .offset(skip)
            .limit(limit)
            .all()
        )
        result = []
        for mark, subject_name in records:
            mark.subject_name = subject_name
            result.append(mark)
        return result

    if current_user.role == "student":
        student = db.query(Student).filter(
            Student.user_id == current_user.id
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found for this account"
            )

        records = (
            db.query(Mark, Subject.name.label("subject_name"))
            .outerjoin(Subject, Mark.subject_id == Subject.id)
            .filter(Mark.student_id == student.id)
            .all()
        )
        result = []
        for mark, subject_name in records:
            mark.subject_name = subject_name
            result.append(mark)
        return result

    raise HTTPException(
        status_code=403,
        detail="Access denied"
    )