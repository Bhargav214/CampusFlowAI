from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database.connection import get_db
from auth.dependencies import get_current_user, require_role
from auth.security import hash_password
from models.user import User
from models.student import Student
from models.attendance import Attendance
from models.marks import Mark
from models.subject import Subject
from models.parent_student import ParentStudentLink
from models.notification import ParentNotification
from analytics.risk import calculate_risk
from schemas.parent import (
    ParentLinkCreate,
    ParentLinkStatusUpdate,
    ParentStudentSummary,
    ParentNotificationResponse,
    ParentCreateAccountRequest,
)

router = APIRouter(
    prefix="/parent",
    tags=["Parent Portal"]
)


def _verify_approved_link(db: Session, parent_user_id: int, student_id: int) -> ParentStudentLink:
    link = db.query(ParentStudentLink).filter(
        ParentStudentLink.parent_user_id == parent_user_id,
        ParentStudentLink.student_id == student_id,
        ParentStudentLink.status == "approved"
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have an approved guardian relationship with this student."
        )
    return link


def _calculate_student_overview(db: Session, student: Student, relationship_type: str = "parent", link_status: str = "approved") -> dict:
    attendance_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if attendance_records:
        present_count = sum(1 for a in attendance_records if str(a.status).lower() == "present")
        att_pct = round((present_count / len(attendance_records)) * 100, 2)
    else:
        att_pct = 0.0

    marks_records = db.query(Mark).filter(Mark.student_id == student.id).all()
    obt = sum(float(m.marks_obtained or 0) for m in marks_records)
    mx = sum(float(m.max_marks or 0) for m in marks_records)
    acad_pct = round((obt / mx * 100), 2) if mx > 0 else 0.0

    r = calculate_risk(att_pct, acad_pct)

    return {
        "student_id": student.id,
        "roll_number": student.roll_number,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": student.email,
        "department": student.department,
        "semester": student.semester,
        "relationship_type": relationship_type,
        "link_status": link_status,
        "attendance_percentage": att_pct,
        "academic_percentage": acad_pct,
        "risk_level": r["risk"],
    }


# ── Parent User Endpoints ──────────────────────────────────────────────────────

@router.get("/dashboard")
def get_parent_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("parent"))
):
    links = db.query(ParentStudentLink).filter(
        ParentStudentLink.parent_user_id == current_user.id,
        ParentStudentLink.status == "approved"
    ).all()

    students_summary = []
    unread_notifications = db.query(ParentNotification).filter(
        ParentNotification.parent_user_id == current_user.id,
        ParentNotification.is_read == False
    ).count()

    for link in links:
        student = db.query(Student).filter(Student.id == link.student_id).first()
        if student:
            summary = _calculate_student_overview(db, student, link.relationship_type, link.status)
            students_summary.append(summary)

    return {
        "parent_user_id": current_user.id,
        "parent_email": current_user.email,
        "total_linked_students": len(students_summary),
        "unread_notifications_count": unread_notifications,
        "students": students_summary,
    }


@router.get("/students", response_model=List[ParentStudentSummary])
def get_parent_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("parent"))
):
    links = db.query(ParentStudentLink).filter(
        ParentStudentLink.parent_user_id == current_user.id,
        ParentStudentLink.status == "approved"
    ).all()

    results = []
    for link in links:
        student = db.query(Student).filter(Student.id == link.student_id).first()
        if student:
            results.append(_calculate_student_overview(db, student, link.relationship_type, link.status))
    return results


@router.get("/students/{student_id}/attendance")
def get_student_attendance_for_parent(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("parent"))
):
    _verify_approved_link(db, current_user.id, student_id)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()

    total_classes = len(attendance_records)
    present_count = sum(1 for a in attendance_records if str(a.status).lower() == "present")
    att_pct = round((present_count / total_classes * 100), 2) if total_classes > 0 else 0.0

    # Subject-wise attendance
    subject_attendance = {}
    for a in attendance_records:
        subj = db.query(Subject).filter(Subject.id == a.subject_id).first()
        subj_name = subj.name if subj else f"Subject #{a.subject_id}"
        if subj_name not in subject_attendance:
            subject_attendance[subj_name] = {"total": 0, "present": 0}
        subject_attendance[subj_name]["total"] += 1
        if str(a.status).lower() == "present":
            subject_attendance[subj_name]["present"] += 1

    subject_breakdown = []
    for name, stats in subject_attendance.items():
        pct = round((stats["present"] / stats["total"] * 100), 2) if stats["total"] > 0 else 0.0
        subject_breakdown.append({
            "subject_name": name,
            "total_classes": stats["total"],
            "present_classes": stats["present"],
            "percentage": pct,
        })

    # Recent records
    recent_records = []
    for a in sorted(attendance_records, key=lambda x: x.date if hasattr(x, 'date') else datetime.now(), reverse=True)[:10]:
        subj = db.query(Subject).filter(Subject.id == a.subject_id).first()
        recent_records.append({
            "id": a.id,
            "subject_name": subj.name if subj else f"Subject #{a.subject_id}",
            "date": str(a.date),
            "status": a.status,
        })

    # Threshold warning
    warning = None
    if total_classes > 0 and att_pct < 75.0:
        warning = f"Attendance warning: Student's overall attendance is {att_pct}%, which is below the 75% institutional threshold."

    return {
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "overall_percentage": att_pct,
        "total_classes": total_classes,
        "present_classes": present_count,
        "warning": warning,
        "subject_breakdown": subject_breakdown,
        "recent_records": recent_records,
    }


@router.get("/students/{student_id}/marks")
def get_student_marks_for_parent(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("parent"))
):
    _verify_approved_link(db, current_user.id, student_id)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    marks_records = db.query(Mark).filter(Mark.student_id == student_id).all()

    total_obtained = sum(float(m.marks_obtained or 0) for m in marks_records)
    total_max = sum(float(m.max_marks or 0) for m in marks_records)
    overall_percentage = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0.0

    subject_marks = []
    for m in marks_records:
        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
        pct = round((float(m.marks_obtained or 0) / float(m.max_marks or 1) * 100), 2)
        subject_marks.append({
            "id": m.id,
            "subject_name": subj.name if subj else f"Subject #{m.subject_id}",
            "subject_code": subj.subject_code if subj else "-",
            "exam_type": m.exam_type,
            "marks_obtained": float(m.marks_obtained or 0),
            "max_marks": float(m.max_marks or 0),
            "percentage": pct,
        })

    return {
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "overall_percentage": overall_percentage,
        "total_obtained": total_obtained,
        "total_max": total_max,
        "records": subject_marks,
    }


@router.get("/students/{student_id}/analytics")
def get_student_analytics_for_parent(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("parent"))
):
    _verify_approved_link(db, current_user.id, student_id)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    att_pct = round((sum(1 for a in attendance_records if str(a.status).lower() == "present") / len(attendance_records) * 100), 2) if attendance_records else 0.0

    marks_records = db.query(Mark).filter(Mark.student_id == student_id).all()
    obt = sum(float(m.marks_obtained or 0) for m in marks_records)
    mx = sum(float(m.max_marks or 0) for m in marks_records)
    acad_pct = round((obt / mx * 100), 2) if mx > 0 else 0.0

    r = calculate_risk(att_pct, acad_pct)

    return {
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}",
        "attendance_percentage": att_pct,
        "academic_percentage": acad_pct,
        "risk_score": r["score"],
        "risk_level": r["risk"],
        "contributing_reasons": r["reasons"],
        "suggested_actions": r["recommendation"],
        "analysis_date": datetime.now().strftime("%Y-%m-%d"),
        "disclaimer": "Risk levels are automated model-generated indicators based on attendance and academic scores to support student success. They are not definitive judgments."
    }


@router.get("/notifications", response_model=List[ParentNotificationResponse])
def get_parent_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("parent"))
):
    notifs = db.query(ParentNotification).filter(
        ParentNotification.parent_user_id == current_user.id
    ).order_by(ParentNotification.created_at.desc()).all()
    return notifs


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("parent"))
):
    notif = db.query(ParentNotification).filter(
        ParentNotification.id == notification_id,
        ParentNotification.parent_user_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


# ── Admin Parent Management Endpoints ─────────────────────────────────────────

@router.post("/create-account", status_code=status.HTTP_201_CREATED)
def create_parent_account(
    data: ParentCreateAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        if existing.role != "parent":
            raise HTTPException(status_code=400, detail=f"User with email '{data.email}' already exists with role '{existing.role}'")
        user = existing
    else:
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            role="parent",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    link = None
    if data.student_id:
        student = db.query(Student).filter(Student.id == data.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")

        existing_link = db.query(ParentStudentLink).filter(
            ParentStudentLink.parent_user_id == user.id,
            ParentStudentLink.student_id == student.id
        ).first()

        if existing_link:
            existing_link.status = "approved"
            existing_link.approved_at = datetime.utcnow()
            existing_link.approved_by = current_user.id
            db.commit()
            link = existing_link
        else:
            link = ParentStudentLink(
                parent_user_id=user.id,
                student_id=student.id,
                relationship_type=data.relationship_type,
                status="approved",
                approved_at=datetime.utcnow(),
                approved_by=current_user.id
            )
            db.add(link)
            db.commit()
            db.refresh(link)

    return {
        "message": "Parent account processed successfully",
        "parent_user_id": user.id,
        "email": user.email,
        "link_status": link.status if link else "no_link_created"
    }


@router.post("/links", status_code=status.HTTP_201_CREATED)
def create_parent_link(
    data: ParentLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    parent_user = None
    if data.parent_user_id:
        parent_user = db.query(User).filter(User.id == data.parent_user_id, User.role == "parent").first()
    elif data.parent_email:
        parent_user = db.query(User).filter(User.email == data.parent_email, User.role == "parent").first()

    if not parent_user:
        raise HTTPException(status_code=404, detail="Parent user account not found. Please create parent account first.")

    existing_link = db.query(ParentStudentLink).filter(
        ParentStudentLink.parent_user_id == parent_user.id,
        ParentStudentLink.student_id == student.id
    ).first()

    if existing_link:
        existing_link.status = "approved"
        existing_link.approved_at = datetime.utcnow()
        existing_link.approved_by = current_user.id
        db.commit()
        return {"message": "Parent link updated to approved", "link_id": existing_link.id}

    link = ParentStudentLink(
        parent_user_id=parent_user.id,
        student_id=student.id,
        relationship_type=data.relationship_type,
        status="approved",
        approved_at=datetime.utcnow(),
        approved_by=current_user.id
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return {"message": "Parent-student relationship linked successfully", "link_id": link.id}


@router.get("/links")
def list_parent_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    links = db.query(ParentStudentLink).all()
    results = []
    for l in links:
        parent = db.query(User).filter(User.id == l.parent_user_id).first()
        student = db.query(Student).filter(Student.id == l.student_id).first()
        results.append({
            "id": l.id,
            "parent_user_id": l.parent_user_id,
            "parent_email": parent.email if parent else "Unknown",
            "student_id": l.student_id,
            "student_name": f"{student.first_name} {student.last_name}" if student else "Unknown",
            "student_roll": student.roll_number if student else "Unknown",
            "relationship_type": l.relationship_type,
            "status": l.status,
            "created_at": l.created_at,
            "approved_at": l.approved_at,
        })
    return results


@router.patch("/links/{link_id}/status")
def update_parent_link_status(
    link_id: int,
    data: ParentLinkStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    link = db.query(ParentStudentLink).filter(ParentStudentLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Parent student link not found")

    link.status = data.status
    if data.status == "approved":
        link.approved_at = datetime.utcnow()
        link.approved_by = current_user.id

    db.commit()
    return {"message": f"Link status updated to {data.status}", "link_id": link.id, "status": link.status}
