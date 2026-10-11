from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from database.connection import get_db
from auth.dependencies import get_current_user, require_role
from models.user import User
from models.department import Department, department_subject_association
from models.student import Student
from models.faculty import Faculty
from models.subject import Subject
from models.attendance import Attendance
from models.marks import Mark
from analytics.risk import calculate_risk
from schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentStatusUpdate,
    DepartmentResponse,
    DepartmentDashboardResponse,
    HeadOfDepartmentBrief,
)

router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


def _build_department_response(dept: Department, db: Session) -> dict:
    # Query student count by department_id or matching department string code/name
    student_count = db.query(Student).filter(
        or_(
            Student.department_id == dept.id,
            func.lower(Student.department) == dept.department_code.lower(),
            func.lower(Student.department) == dept.department_name.lower()
        )
    ).count()

    faculty_count = db.query(Faculty).filter(
        or_(
            Faculty.department_id == dept.id,
            func.lower(Faculty.department) == dept.department_code.lower(),
            func.lower(Faculty.department) == dept.department_name.lower()
        )
    ).count()

    subject_count = db.query(Subject).filter(
        or_(
            Subject.department_id == dept.id,
            func.lower(Subject.department) == dept.department_code.lower(),
            func.lower(Subject.department) == dept.department_name.lower()
        )
    ).count()

    head_brief = None
    if dept.head_of_department:
        head_brief = HeadOfDepartmentBrief(
            id=dept.head_of_department.id,
            faculty_id=dept.head_of_department.faculty_id,
            first_name=dept.head_of_department.first_name,
            last_name=dept.head_of_department.last_name,
            email=dept.head_of_department.email,
        )

    return {
        "id": dept.id,
        "department_code": dept.department_code,
        "department_name": dept.department_name,
        "description": dept.description,
        "head_of_department_id": dept.head_of_department_id,
        "head_of_department": head_brief,
        "is_active": dept.is_active,
        "student_count": student_count,
        "faculty_count": faculty_count,
        "subject_count": subject_count,
        "created_at": dept.created_at,
        "updated_at": dept.updated_at,
    }


@router.get("/", response_model=List[DepartmentResponse])
def list_departments(
    q: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Department)

    if is_active is not None:
        query = query.filter(Department.is_active == is_active)

    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                Department.department_code.ilike(search_pattern),
                Department.department_name.ilike(search_pattern),
                Department.description.ilike(search_pattern),
            )
        )

    departments = query.order_by(Department.department_name.asc()).all()
    return [_build_department_response(dept, db) for dept in departments]


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    # Check duplicate code
    existing = db.query(Department).filter(
        func.lower(Department.department_code) == data.department_code.lower()
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department code '{data.department_code}' already exists"
        )

    if data.head_of_department_id:
        faculty = db.query(Faculty).filter(Faculty.id == data.head_of_department_id).first()
        if not faculty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Faculty member for head of department not found"
            )

    dept = Department(
        department_code=data.department_code.strip().upper(),
        department_name=data.department_name.strip(),
        description=data.description,
        head_of_department_id=data.head_of_department_id,
        is_active=data.is_active,
    )

    db.add(dept)
    db.commit()
    db.refresh(dept)

    return _build_department_response(dept, db)


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    return _build_department_response(dept, db)


@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    if data.department_code and data.department_code.lower() != dept.department_code.lower():
        existing = db.query(Department).filter(
            func.lower(Department.department_code) == data.department_code.lower(),
            Department.id != department_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department code '{data.department_code}' already exists"
            )
        dept.department_code = data.department_code.strip().upper()

    if data.department_name is not None:
        dept.department_name = data.department_name.strip()

    if data.description is not None:
        dept.description = data.description

    if data.head_of_department_id is not None:
        if data.head_of_department_id == 0 or data.head_of_department_id is None:
            dept.head_of_department_id = None
        else:
            faculty = db.query(Faculty).filter(Faculty.id == data.head_of_department_id).first()
            if not faculty:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Faculty member for head of department not found"
                )
            dept.head_of_department_id = data.head_of_department_id

    if data.is_active is not None:
        dept.is_active = data.is_active

    db.commit()
    db.refresh(dept)
    return _build_department_response(dept, db)


@router.patch("/{department_id}/status", response_model=DepartmentResponse)
def update_department_status(
    department_id: int,
    data: DepartmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    dept.is_active = data.is_active
    db.commit()
    db.refresh(dept)
    return _build_department_response(dept, db)


@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # Check for associated records
    student_count = db.query(Student).filter(
        or_(
            Student.department_id == dept.id,
            func.lower(Student.department) == dept.department_code.lower()
        )
    ).count()

    faculty_count = db.query(Faculty).filter(
        or_(
            Faculty.department_id == dept.id,
            func.lower(Faculty.department) == dept.department_code.lower()
        )
    ).count()

    if student_count > 0 or faculty_count > 0:
        # Safe archival: deactivate instead of hard deletion if records exist
        dept.is_active = False
        db.commit()
        return {
            "message": "Department deactivated safely because active students or faculty are associated with it.",
            "action": "deactivated"
        }

    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully", "action": "deleted"}


@router.get("/{department_id}/dashboard", response_model=DepartmentDashboardResponse)
def get_department_dashboard(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    students = db.query(Student).filter(
        or_(
            Student.department_id == dept.id,
            func.lower(Student.department) == dept.department_code.lower(),
            func.lower(Student.department) == dept.department_name.lower()
        )
    ).all()

    faculty_count = db.query(Faculty).filter(
        or_(
            Faculty.department_id == dept.id,
            func.lower(Faculty.department) == dept.department_code.lower(),
            func.lower(Faculty.department) == dept.department_name.lower()
        )
    ).count()

    subject_count = db.query(Subject).filter(
        or_(
            Subject.department_id == dept.id,
            func.lower(Subject.department) == dept.department_code.lower(),
            func.lower(Subject.department) == dept.department_name.lower()
        )
    ).count()

    total_students = len(students)

    if total_students == 0:
        return {
            "department_id": dept.id,
            "department_code": dept.department_code,
            "department_name": dept.department_name,
            "total_students": 0,
            "total_faculty": faculty_count,
            "total_subjects": subject_count,
            "average_attendance": 0.0,
            "average_marks": 0.0,
            "risk_distribution": {"high_risk": 0, "medium_risk": 0, "low_risk": 0}
        }

    student_ids = [s.id for s in students]

    # Attendance average
    attendance_records = db.query(Attendance).filter(Attendance.student_id.in_(student_ids)).all()
    if attendance_records:
        present_count = sum(1 for a in attendance_records if str(a.status).lower() == "present")
        avg_attendance = round((present_count / len(attendance_records)) * 100, 2)
    else:
        avg_attendance = 0.0

    # Marks average
    marks_records = db.query(Mark).filter(Mark.student_id.in_(student_ids)).all()
    total_obtained = sum(float(m.marks_obtained or 0) for m in marks_records)
    total_max = sum(float(m.max_marks or 0) for m in marks_records)
    if total_max > 0:
        avg_marks = round((total_obtained / total_max) * 100, 2)
    else:
        avg_marks = 0.0

    # Risk distribution
    high_risk = 0
    medium_risk = 0
    low_risk = 0

    for student in students:
        s_att = [a for a in attendance_records if a.student_id == student.id]
        if s_att:
            s_present = sum(1 for a in s_att if str(a.status).lower() == "present")
            att_pct = (s_present / len(s_att)) * 100
        else:
            att_pct = 0.0

        s_marks = [m for m in marks_records if m.student_id == student.id]
        s_obt = sum(float(m.marks_obtained or 0) for m in s_marks)
        s_max = sum(float(m.max_marks or 0) for m in s_marks)
        marks_pct = (s_obt / s_max * 100) if s_max > 0 else 0.0

        r = calculate_risk(att_pct, marks_pct)
        if r["risk"] == "HIGH":
            high_risk += 1
        elif r["risk"] == "MEDIUM":
            medium_risk += 1
        else:
            low_risk += 1

    return {
        "department_id": dept.id,
        "department_code": dept.department_code,
        "department_name": dept.department_name,
        "total_students": total_students,
        "total_faculty": faculty_count,
        "total_subjects": subject_count,
        "average_attendance": avg_attendance,
        "average_marks": avg_marks,
        "risk_distribution": {
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk
        }
    }
