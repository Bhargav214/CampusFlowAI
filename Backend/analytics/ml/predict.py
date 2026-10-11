import os
import joblib
import pandas as pd


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "model.pkl"
)


def explain_prediction(
    attendance,
    average_marks
):
    factors = []

    if attendance < 75:
        factors.append({
            "factor": "Low Attendance",
            "value": round(attendance, 2),
            "impact": "HIGH"
        })
    elif attendance < 80:
        factors.append({
            "factor": "Attendance Below Target",
            "value": round(attendance, 2),
            "impact": "MEDIUM"
        })

    if average_marks < 50:
        factors.append({
            "factor": "Low Academic Performance",
            "value": round(average_marks, 2),
            "impact": "HIGH"
        })
    elif average_marks < 60:
        factors.append({
            "factor": "Below Average Marks",
            "value": round(average_marks, 2),
            "impact": "MEDIUM"
        })

    if not factors:
        factors.append({
            "factor": "No Major Risk Factor",
            "value": "Normal",
            "impact": "LOW"
        })

    return factors


def predict_risk(
    attendance,
    average_marks,
    highest_marks,
    lowest_marks
):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "ML model has not been trained yet."
        )

    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]
    features = bundle["features"]
    feature_importance = bundle.get("feature_importance", {})

    marks_range = highest_marks - lowest_marks

    data = pd.DataFrame(
        [[
            attendance,
            average_marks,
            highest_marks,
            lowest_marks,
            marks_range
        ]],
        columns=features
    )

    prediction = model.predict(data)[0]
    probabilities = model.predict_proba(data)[0]

    probability_map = dict(
        zip(
            model.classes_,
            probabilities
        )
    )

    explanation = explain_prediction(
        attendance=attendance,
        average_marks=average_marks
    )

    return {
        "prediction": prediction,
        "probabilities": {
            key: round(
                float(value) * 100,
                2
            )
            for key, value
            in probability_map.items()
        },
        "explanation": explanation,
        "feature_importance": feature_importance
    }


def predict_all_students(db):
    from models.student import Student
    from models.attendance import Attendance
    from models.marks import Mark

    students = db.query(Student).all()
    results = []

    for student in students:
        attendance_records = (
            db.query(Attendance)
            .filter(Attendance.student_id == student.id)
            .all()
        )

        if attendance_records:
            present = sum(
                1
                for record in attendance_records
                if record.status == "present"
            )
            attendance_percentage = (
                present / len(attendance_records)
            ) * 100
        else:
            attendance_percentage = 0

        marks_records = (
            db.query(Mark)
            .filter(Mark.student_id == student.id)
            .all()
        )

        if marks_records:
            mark_values = [
                float(record.marks_obtained or 0)
                for record in marks_records
            ]
            average_marks = sum(mark_values) / len(mark_values)
            highest_marks = max(mark_values)
            lowest_marks = min(mark_values)
        else:
            average_marks = 0
            highest_marks = 0
            lowest_marks = 0

        prediction = predict_risk(
            attendance=attendance_percentage,
            average_marks=average_marks,
            highest_marks=highest_marks,
            lowest_marks=lowest_marks
        )

        probability = max(
            prediction["probabilities"].values()
        )

        # Fallback for roll number
        roll_no = getattr(student, "roll_no", getattr(student, "roll_number", f"STU-{student.id}"))

        # Fallback for name (first_name + last_name, full_name, or name)
        if hasattr(student, "first_name") and hasattr(student, "last_name"):
            student_name = f"{student.first_name} {student.last_name}".strip()
        else:
            student_name = getattr(student, "full_name", getattr(student, "name", f"Student {student.id}"))

        results.append({
            "student_id": student.id,
            "roll_no": roll_no,
            "name": student_name,
            "attendance": round(attendance_percentage, 2),
            "average_marks": round(average_marks, 2),
            "prediction": prediction["prediction"],
            "probability": round(probability, 2),
            "probabilities": prediction["probabilities"],
            "explanation": prediction["explanation"]
        })

    return results