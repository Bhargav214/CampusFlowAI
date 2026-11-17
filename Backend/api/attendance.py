from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from database.connection import get_db

from models.attendance import Attendance
from models.student import Student

from schemas.attendance import (
    AttendanceCreate,
    AttendanceResponse,
    BulkAttendanceCreate
)

from auth.dependencies import require_role, get_current_user


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


@router.post(
    "/",
    response_model=AttendanceResponse
)
def create_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):

    if data.status.lower() not in [
        "present",
        "absent"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Status must be Present or Absent"
        )

    existing = db.query(Attendance).filter(
        Attendance.student_id == data.student_id,
        Attendance.subject_id == data.subject_id,
        Attendance.date == data.date
    ).first()

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Attendance already recorded"
        )

    attendance = Attendance(
        student_id=data.student_id,
        subject_id=data.subject_id,
        date=data.date,
        status=data.status.lower()
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance


@router.post("/bulk")
def create_attendance_bulk(
    data: BulkAttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty"))
):
    """
    Atomic batch upsert for classroom attendance rosters.
    Updates existing records for the same (student, subject, date) or creates new ones.
    """
    if not data.records:
        return {
            "status": "success",
            "message": "No attendance records provided",
            "inserted": 0,
            "updated": 0,
            "total": 0
        }

    inserted = 0
    updated = 0

    try:
        for item in data.records:
            status_clean = str(item.status).strip().lower()
            if status_clean not in ("present", "absent"):
                status_clean = "present"

            existing = db.query(Attendance).filter(
                Attendance.student_id == item.student_id,
                Attendance.subject_id == item.subject_id,
                Attendance.date == item.date
            ).first()

            if existing:
                existing.status = status_clean
                if item.remarks is not None:
                    existing.remarks = item.remarks
                updated += 1
            else:
                record = Attendance(
                    student_id=item.student_id,
                    subject_id=item.subject_id,
                    date=item.date,
                    status=status_clean,
                    remarks=item.remarks
                )
                db.add(record)
                inserted += 1

        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Batch attendance processing failed: {exc}"
        )

    return {
        "status": "success",
        "message": f"Successfully processed {len(data.records)} attendance records ({inserted} inserted, {updated} updated)",
        "inserted": inserted,
        "updated": updated,
        "total": len(data.records)
    }


@router.get(
    "/",
    response_model=list[AttendanceResponse]
)
def get_attendance(
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Admin / Faculty: returns all attendance records.
    Student: returns ONLY the authenticated student's own records.
    The student identity is derived from the JWT — never from a request parameter.
    """

    if current_user.role in ("admin", "faculty"):
        return db.query(Attendance).offset(skip).limit(limit).all()

    if current_user.role == "student":
        student = db.query(Student).filter(
            Student.user_id == current_user.id
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found for this account"
            )

        return db.query(Attendance).filter(
            Attendance.student_id == student.id
        ).all()

    raise HTTPException(
        status_code=403,
        detail="Access denied"
    )