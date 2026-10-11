from io import BytesIO
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.connection import get_db
from auth.dependencies import require_role

from models.student import Student
from models.attendance import Attendance
from models.marks import Mark
from models.subject import Subject

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def create_pdf(title, headers, rows):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=20,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=20
    )

    story = []

    story.append(
        Paragraph(
            "CampusFlow AI",
            title_style
        )
    )

    story.append(
        Paragraph(
            title,
            styles["Heading2"]
        )
    )

    story.append(
        Paragraph(
            f"Generated: {datetime.now().strftime('%d %B %Y, %H:%M')}",
            subtitle_style
        )
    )

    table_data = [headers] + rows

    table = Table(
        table_data,
        repeatRows=1
    )

    table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#1e293b")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "FONTNAME",
                (0, 1),
                (-1, -1),
                "Helvetica"
            ),
            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "CENTER"
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "ROWBACKGROUNDS",
                (0, 1),
                (-1, -1),
                [
                    colors.white,
                    colors.HexColor("#f8fafc")
                ]
            )
        ])
    )

    story.append(table)

    document.build(story)

    buffer.seek(0)

    return buffer


def get_student_name(student):
    """Safely retrieves the student name across different column/relation names."""
    if hasattr(student, "first_name") or hasattr(student, "last_name"):
        name = f"{getattr(student, 'first_name', '')} {getattr(student, 'last_name', '')}".strip()
        if name:
            return name
    if hasattr(student, "full_name") and student.full_name:
        return student.full_name
    if hasattr(student, "name") and student.name:
        return student.name
    if hasattr(student, "user") and student.user and hasattr(student.user, "name"):
        return student.user.name
    return "N/A"


def calculate_academic_percentage(marks_records):
    """Calculates weighted academic percentage across all assessments."""
    if not marks_records:
        return 0.0
    total_obtained = sum(float(record.marks_obtained or 0) for record in marks_records)
    total_max = sum(float(record.max_marks or 0) for record in marks_records)
    return round((total_obtained / total_max) * 100, 2) if total_max > 0 else 0.0


@router.get("/attendance")
def attendance_report(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):
    students = (
        db.query(Student)
        .order_by(Student.roll_number)
        .all()
    )

    rows = []

    for student in students:
        records = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == student.id
            )
            .all()
        )

        total = len(records)

        present = sum(
            1
            for record in records
            if str(record.status).lower() == "present"
        )

        percentage = (
            round((present / total) * 100, 2)
            if total > 0
            else 0
        )

        rows.append([
            student.roll_number,
            get_student_name(student),
            total,
            present,
            f"{percentage}%"
        ])

    pdf = create_pdf(
        "Student Attendance Report",
        [
            "Roll No",
            "Student",
            "Classes",
            "Present",
            "Attendance"
        ],
        rows
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=attendance_report.pdf"
        }
    )


@router.get("/marks")
def marks_report(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):
    students = (
        db.query(Student)
        .order_by(Student.roll_number)
        .all()
    )

    rows = []

    for student in students:
        records = (
            db.query(Mark)
            .filter(
                Mark.student_id == student.id
            )
            .all()
        )

        average_percentage = calculate_academic_percentage(records)

        rows.append([
            student.roll_number,
            get_student_name(student),
            len(records),
            f"{average_percentage:.2f}%"
        ])

    pdf = create_pdf(
        "Student Academic Performance Report",
        [
            "Roll No",
            "Student",
            "Assessments",
            "Average Marks"
        ],
        rows
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=marks_report.pdf"
        }
    )


@router.get("/risk")
def risk_report(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):
    students = (
        db.query(Student)
        .order_by(Student.roll_number)
        .all()
    )

    rows = []

    for student in students:
        attendance_records = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == student.id
            )
            .all()
        )

        marks_records = (
            db.query(Mark)
            .filter(
                Mark.student_id == student.id
            )
            .all()
        )

        total = len(attendance_records)

        present = sum(
            1
            for record in attendance_records
            if str(record.status).lower() == "present"
        )

        attendance = (
            (present / total) * 100
            if total
            else 0
        )

        average_marks = calculate_academic_percentage(marks_records)

        # Academic risk rule using true percentage thresholds
        if attendance < 60 or average_marks < 50:
            risk = "HIGH"
        elif attendance < 75 or average_marks < 65:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        rows.append([
            student.roll_number,
            get_student_name(student),
            f"{attendance:.2f}%",
            f"{average_marks:.2f}%",
            risk
        ])

    pdf = create_pdf(
        "AI Academic Risk Report",
        [
            "Roll No",
            "Student",
            "Attendance",
            "Avg Marks",
            "Risk"
        ],
        rows
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=ai_risk_report.pdf"
        }
    )


@router.get("/students")
def student_report(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "faculty")
    )
):
    students = (
        db.query(Student)
        .order_by(Student.roll_number)
        .all()
    )

    rows = []

    for student in students:
        attendance_records = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == student.id
            )
            .all()
        )

        marks_records = (
            db.query(Mark)
            .filter(
                Mark.student_id == student.id
            )
            .all()
        )

        total = len(attendance_records)
 
        present = sum(
            1
            for record in attendance_records
            if str(record.status).lower() == "present"
        )

        attendance = (
            (present / total) * 100
            if total
            else 0
        )

        average_marks = calculate_academic_percentage(marks_records)

        department = getattr(student, "department", "BCA") or "BCA"
        semester = getattr(student, "semester", "N/A")

        rows.append([
            student.roll_number,
            get_student_name(student),
            department,
            semester,
            f"{attendance:.2f}%",
            f"{average_marks:.2f}%"
        ])

    pdf = create_pdf(
        "Complete Student Performance Report",
        [
            "Roll No",
            "Student",
            "Department",
            "Semester",
            "Attendance",
            "Avg Marks"
        ],
        rows
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=student_report.pdf"
        }
    )