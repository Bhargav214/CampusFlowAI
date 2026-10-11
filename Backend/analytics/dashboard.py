from sqlalchemy import func, case
from models.student import Student
from models.attendance import Attendance
from models.marks import Mark

def get_dashboard_stats(db):
    total_students = db.query(func.count(Student.id)).scalar()
    
    # Correct SQLAlchemy case syntax:
    attendance_result = db.query(
        func.avg(
            case((Attendance.status == "present", 1), else_=0)
        ) * 100
    ).scalar()
    
    # Calculate average total marks using marks_obtained / max_marks or your formula
    marks_result = db.query(
        func.avg((Mark.marks_obtained / Mark.max_marks) * 100)
    ).scalar()

    return {
        "total_students": total_students or 0,
        "average_attendance": round(float(attendance_result or 0), 2),
        "average_marks": round(float(marks_result or 0), 2),
    }