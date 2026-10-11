from sqlalchemy import func, case
from models.subject import Subject
from models.marks import Mark
from models.attendance import Attendance

def average_attendance(db):
    result = db.query(
        func.avg(
            case((Attendance.status == "present", 1), else_=0)
        ) * 100
    ).scalar()
    return round(float(result or 0), 2)

def average_marks(db):
    result = db.query(
        func.avg((Mark.marks_obtained / Mark.max_marks) * 100)
    ).scalar()
    return round(float(result or 0), 2)

def subject_performance(db):
    results = db.query(
        Subject.name,
        func.avg((Mark.marks_obtained / Mark.max_marks) * 100).label("average_marks")
    ).join(Mark, Mark.subject_id == Subject.id)\
     .group_by(Subject.id, Subject.name)\
     .all()
     
    return [
        {
            "subject": row.name,
            "average_marks": round(float(row.average_marks or 0), 2)
        }
        for row in results
    ]

def attendance_trend(db):
    results = db.query(
        Attendance.date,
        (
            func.sum(
                case((Attendance.status == "present", 1), else_=0)
            ) / func.count(Attendance.id) * 100
        ).label("attendance_percentage")
    ).group_by(Attendance.date)\
     .order_by(Attendance.date)\
     .all()

    return [
        {
            "date": str(row.date),
            "attendance": round(float(row.attendance_percentage or 0), 2)
        }
        for row in results
    ]