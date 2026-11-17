from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from auth.dependencies import require_role
from analytics.risk import calculate_student_risk

from analytics.ml.train import train_model
from analytics.ml.predict import predict_all_students

from analytics.dashboard import get_dashboard_stats
from analytics.queries import subject_performance, attendance_trend
from analytics.nl_query import process_natural_language_query
from models.student import Student
from models.attendance import Attendance
from models.marks import Mark
from models.parent_student import ParentStudentLink
from models.notification import ParentNotification

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


class InterventionRequest(BaseModel):
    student_id: int
    type: str = Field(default="Academic Warning", max_length=100)
    notes: Optional[str] = Field(default=None, max_length=500)


class NaturalLanguageQueryRequest(BaseModel):
    query: str = Field(..., max_length=300)


@router.post("/ask")
def ask_campusflow_ai(
    data: NaturalLanguageQueryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty", "student"))
):
    """
    AI-assisted natural language data querying.
    Parses plain-English queries and returns instant tabular analytics.
    """
    return process_natural_language_query(data.query, db)


@router.get("/query")
def query_campusflow_ai(
    q: str = "",
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty", "student"))
):
    """
    GET variant for quick URL-based AI querying.
    """
    return process_natural_language_query(q, db)


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty"))
):
    stats = get_dashboard_stats(db)
    subjects = subject_performance(db)
    return {
        **stats,
        "subject_performance": subjects
    }


@router.get("/risk")
def student_risk(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty"))
):
    students = calculate_student_risk(db)

    return {
        "total_students": len(students),
        "high_risk": sum(
            1
            for student in students
            if student.get("risk") == "HIGH"
        ),
        "medium_risk": sum(
            1
            for student in students
            if student.get("risk") == "MEDIUM"
        ),
        "low_risk": sum(
            1
            for student in students
            if student.get("risk") == "LOW"
        ),
        "students": students
    }

@router.get("/student-dashboard")
def student_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("student"))
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == student.id
    ).all()
    present_count = sum(
        1
        for record in attendance_records
        if str(record.status).lower() == "present"
    )
    attendance_percentage = (
        present_count / len(attendance_records) * 100
        if attendance_records
        else 0.0
    )

    marks_records = db.query(Mark).filter(
        Mark.student_id == student.id
    ).all()
    total_obtained = sum(
        float(record.marks_obtained or 0)
        for record in marks_records
    )
    total_max = sum(
        float(record.max_marks or 0)
        for record in marks_records
    )
    academic_percentage = (
        total_obtained / total_max * 100
        if total_max > 0
        else 0.0
    )

    risk_result = calculate_student_risk(db)
    # Safe lookup — use default None instead of raising StopIteration
    student_risk_result = next(
        (item for item in risk_result if item["student_id"] == student.id),
        None
    )

    # If the student has no data yet, return a safe default risk entry
    if student_risk_result is None:
        student_risk_result = {
            "student_id": student.id,
            "name": f"{getattr(student, 'first_name', '')} {getattr(student, 'last_name', '')}".strip(),
            "roll_no": getattr(student, "roll_number", ""),
            "attendance": round(attendance_percentage, 2),
            "average_marks": round(academic_percentage, 2),
            "risk_score": 0,
            "risk": "LOW",
            "reasons": [],
            "recommendation": "No data available yet to calculate risk."
        }

    return {
        "total_students": 1,
        "average_attendance": round(attendance_percentage, 2),
        "average_marks": round(academic_percentage, 2),
        "high_risk": int(student_risk_result["risk"] == "HIGH"),
        "medium_risk": int(student_risk_result["risk"] == "MEDIUM"),
        "low_risk": int(student_risk_result["risk"] == "LOW"),
        "subject_performance": [],
        "risk_students": [student_risk_result]
    }



@router.post("/ml/train")
def train_ml_model(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    result = train_model(db)
    return {
        "message": "ML model trained successfully",
        **result
    }


@router.get("/ml/risk")
def get_ml_risk(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty"))
):
    results = predict_all_students(db)
    return {
        "total_students": len(results),
        "students": results
    }


@router.post("/intervene")
def trigger_intervention(
    data: InterventionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "faculty"))
):
    """
    Records an academic intervention triggered by faculty or admin.
    Notifies linked parent/guardian accounts in real-time and logs the action.
    """
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {data.student_id} not found."
        )

    # Find any linked guardians for this student
    links = db.query(ParentStudentLink).filter(
        ParentStudentLink.student_id == student.id,
        ParentStudentLink.status == "approved"
    ).all()

    guardian_count = 0
    student_name = f"{getattr(student, 'first_name', '')} {getattr(student, 'last_name', '')}".strip() or getattr(student, "name", f"Student #{student.id}")

    for link in links:
        notification = ParentNotification(
            parent_user_id=link.parent_user_id,
            student_id=student.id,
            title=f"Academic Alert: {data.type}",
            message=(
                data.notes
                or f"Faculty has initiated an academic intervention ({data.type}) for {student_name}."
            )[:250],
            type="risk_change",
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )
        db.add(notification)
        guardian_count += 1

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record intervention: {exc}"
        )

    return {
        "status": "success",
        "message": f"Intervention '{data.type}' successfully logged for {student_name}.",
        "student_id": student.id,
        "student_name": student_name,
        "type": data.type,
        "guardians_notified": guardian_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/faculty-dashboard")
def faculty_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("faculty", "admin"))
):
    stats = get_dashboard_stats(db)
    subjects = subject_performance(db)
    all_students_risk = calculate_student_risk(db)

    high_risk_students = [
        student for student in all_students_risk
        if student.get("risk") == "HIGH"
    ]

    return {
        "total_students": stats.get("total_students", 0),
        "average_attendance": stats.get("average_attendance", 0),
        "average_marks": stats.get("average_marks", 0),
        "high_risk": len(high_risk_students),
        "subjects": [
            {
                "subject": item.get("subject"),
                "average_marks": item.get("average_marks")
            }
            for item in subjects
        ],
        "risk_students": [
            {
                "student_id": student.get("student_id"),
                "roll_no": student.get("roll_no"),
                "name": student.get("name"),
                "attendance": student.get("attendance"),
                "average_marks": student.get("average_marks"),
                "risk_score": student.get("risk_score"),
                "risk": student.get("risk"),
                "reasons": student.get("reasons", []),
                "recommendation": student.get("recommendation", "")
            }
            for student in high_risk_students
        ]
    }