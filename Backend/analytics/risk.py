from models.student import Student
from models.attendance import Attendance
from models.marks import Mark


def calculate_risk(
    attendance_percentage: float,
    academic_percentage: float
):
    """
    Explainable academic risk scoring.

    Attendance contributes up to 50 points.
    Academic performance contributes up to 50 points.
    """

    score = 0
    reasons = []

    # -------------------------
    # Attendance risk
    # -------------------------

    if attendance_percentage < 60:
        score += 50
        reasons.append("Attendance is below 60%")

    elif attendance_percentage < 75:
        score += 25
        reasons.append("Attendance is below 75%")

    # -------------------------
    # Academic risk
    # -------------------------

    if academic_percentage < 50:
        score += 50
        reasons.append("Academic performance is below 50%")

    elif academic_percentage < 65:
        score += 25
        reasons.append("Academic performance is below 65%")

    # -------------------------
    # Risk level
    # -------------------------

    if score >= 75:
        risk = "HIGH"

    elif score >= 40:
        risk = "MEDIUM"

    else:
        risk = "LOW"

    # -------------------------
    # Recommendation
    # -------------------------

    if risk == "HIGH":
        recommendation = (
            "Immediate faculty intervention recommended. "
            "Monitor attendance and academic performance closely."
        )

    elif risk == "MEDIUM":
        recommendation = (
            "Monitor the student's attendance and academic "
            "performance and provide academic support if needed."
        )

    else:
        recommendation = (
            "Student is currently performing normally. "
            "Continue regular monitoring."
        )

    return {
        "score": score,
        "risk": risk,
        "reasons": reasons,
        "recommendation": recommendation
    }


def calculate_student_risk(db):

    students = db.query(Student).all()

    results = []

    for student in students:

        # -------------------------
        # Attendance
        # -------------------------

        attendance_records = db.query(
            Attendance
        ).filter(
            Attendance.student_id == student.id
        ).all()

        if attendance_records:

            present_count = sum(
                1
                for record in attendance_records
                if str(record.status).lower() == "present"
            )

            attendance_percentage = (
                present_count /
                len(attendance_records)
            ) * 100

        else:

            attendance_percentage = 0.0

        # -------------------------
        # Marks
        # -------------------------

        marks_records = db.query(
            Mark
        ).filter(
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

        if total_max > 0:

            academic_percentage = (
                total_obtained /
                total_max
            ) * 100

        else:

            academic_percentage = 0.0

        # -------------------------
        # Risk engine
        # -------------------------

        risk_result = calculate_risk(
            attendance_percentage,
            academic_percentage
        )

        # -------------------------
        # Final result
        # -------------------------

        results.append({
            "student_id": student.id,

            "roll_no": student.roll_number,

            "name": (
                f"{student.first_name} "
                f"{student.last_name}"
            ).strip(),

            "attendance": round(
                attendance_percentage,
                2
            ),

            "average_marks": round(
                academic_percentage,
                2
            ),

            "risk_score": risk_result["score"],

            "risk": risk_result["risk"],

            "reasons": risk_result["reasons"],

            "recommendation": risk_result[
                "recommendation"
            ]
        })

    return results