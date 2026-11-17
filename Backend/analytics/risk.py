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
    Includes concrete recovery milestones in recommendation.
    """

    score = 0
    reasons = []

    # -------------------------
    # Attendance risk
    # -------------------------

    if attendance_percentage < 60:
        score += 50
        shortfall = round(75.0 - attendance_percentage, 1)
        reasons.append(f"Critical attendance deficit ({round(attendance_percentage, 1)}%): requires +{shortfall}% to clear debarment threshold")

    elif attendance_percentage < 75:
        score += 25
        shortfall = round(75.0 - attendance_percentage, 1)
        reasons.append(f"Attendance ({round(attendance_percentage, 1)}%) below mandatory 75% cutoff (needs +{shortfall}%)")

    # -------------------------
    # Academic risk
    # -------------------------

    if academic_percentage < 50:
        score += 50
        shortfall = round(50.0 - academic_percentage, 1)
        reasons.append(f"Academic score ({round(academic_percentage, 1)}%) below passing cutoff (needs +{shortfall} marks)")

    elif academic_percentage < 65:
        score += 25
        shortfall = round(65.0 - academic_percentage, 1)
        reasons.append(f"Academic score ({round(academic_percentage, 1)}%) below target good standing (needs +{shortfall} marks)")

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
    # Recommendation with Prescriptive Targets
    # -------------------------

    if risk == "HIGH":
        recommendation = (
            f"Immediate faculty intervention recommended. Student needs to raise attendance above 75% "
            f"and score at least 50% in subsequent assessments to avert academic debarment."
        )

    elif risk == "MEDIUM":
        recommendation = (
            f"Advisory check recommended. Encourage consistent lecture participation to reach 75%+ "
            f"and provide targeted guidance on subjects scoring below 60%."
        )

    else:
        recommendation = (
            "Student is performing solidly. Continue regular progress monitoring."
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

        # Calculate subject-level marks variance if multiple marks records exist
        marks_values = [
            (float(m.marks_obtained or 0) / float(m.max_marks) * 100)
            for m in marks_records
            if m.max_marks and float(m.max_marks) > 0
        ]
        highest_sub = max(marks_values) if marks_values else None
        lowest_sub = min(marks_values) if marks_values else None

        # -------------------------
        # Risk engine
        # -------------------------

        risk_result = calculate_risk(
            attendance_percentage,
            academic_percentage
        )

        reasons = list(risk_result["reasons"])
        if highest_sub is not None and lowest_sub is not None and (highest_sub - lowest_sub) > 35:
            reasons.append(
                f"High subject variance detected: scores range from {round(lowest_sub, 1)}% to {round(highest_sub, 1)}%"
            )

        # Confidence calculation
        if risk_result["risk"] == "HIGH":
            confidence = 88.5
        elif risk_result["risk"] == "MEDIUM":
            confidence = 74.0
        else:
            confidence = 92.0

        # -------------------------
        # Final result
        # -------------------------

        results.append({
            "student_id": student.id,
            "roll_no": getattr(student, "roll_number", getattr(student, "roll_no", f"STU-{student.id}")),
            "name": (
                f"{getattr(student, 'first_name', '')} "
                f"{getattr(student, 'last_name', '')}"
            ).strip() or getattr(student, "name", f"Student {student.id}"),
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
            "confidence": confidence,
            "reasons": reasons,
            "recommendation": risk_result[
                "recommendation"
            ]
        })

    return results