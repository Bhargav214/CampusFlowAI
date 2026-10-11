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
    AttendanceResponse
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