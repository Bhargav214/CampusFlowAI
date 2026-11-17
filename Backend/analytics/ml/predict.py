import os
import logging
from typing import Optional, Dict, Any, List
import joblib
import pandas as pd

logger = logging.getLogger("campusflow.ml")

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "model.pkl"
)

# ──────────────────────────────────────────────────────────────
# In-Memory Model Cache Singleton
# ──────────────────────────────────────────────────────────────
_MODEL_BUNDLE: Optional[Dict[str, Any]] = None


def load_model_bundle(force_reload: bool = False) -> Optional[Dict[str, Any]]:
    """
    Loads model.pkl into memory once and caches it.
    If force_reload is True, reloads from disk (e.g. after retraining).
    """
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is not None and not force_reload:
        return _MODEL_BUNDLE

    if not os.path.exists(MODEL_PATH):
        logger.warning(f"ML model bundle not found at {MODEL_PATH}")
        _MODEL_BUNDLE = None
        return None

    try:
        bundle = joblib.load(MODEL_PATH)
        _MODEL_BUNDLE = bundle
        logger.info(f"ML model bundle successfully loaded from {MODEL_PATH}")
        return _MODEL_BUNDLE
    except Exception as exc:
        logger.error(f"Failed to load ML model bundle: {exc}")
        _MODEL_BUNDLE = None
        return None


def is_model_loaded() -> bool:
    """Returns True if the ML model bundle is loaded in memory."""
    return _MODEL_BUNDLE is not None


def get_model_bundle() -> Optional[Dict[str, Any]]:
    """Retrieves cached model bundle or loads it if not yet loaded."""
    if _MODEL_BUNDLE is None:
        return load_model_bundle()
    return _MODEL_BUNDLE


# ──────────────────────────────────────────────────────────────
# Data-Driven Explainable AI & Prescriptive Recovery Targets
# ──────────────────────────────────────────────────────────────
def explain_prediction(
    attendance: float,
    average_marks: float,
    highest_marks: Optional[float] = None,
    lowest_marks: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Generates explainable factors and concrete prescriptive recovery targets.
    Maintains backward compatibility with factor/impact/value schema while adding
    actionable targets.
    """
    factors = []

    # Attendance thresholds
    if attendance < 75:
        shortfall = round(75.0 - attendance, 1)
        classes_needed = max(1, round(shortfall * 0.4) + 1)
        factors.append({
            "factor": "Low Attendance",
            "value": round(attendance, 2),
            "impact": "HIGH",
            "target": f"Requires +{shortfall}% (approx {classes_needed} consecutive classes) to reach mandatory 75% threshold"
        })
    elif attendance < 80:
        shortfall = round(80.0 - attendance, 1)
        factors.append({
            "factor": "Attendance Below Target",
            "value": round(attendance, 2),
            "impact": "MEDIUM",
            "target": f"Requires +{shortfall}% attendance to reach 80% safe zone"
        })

    # Marks thresholds
    if average_marks < 50:
        shortfall = round(50.0 - average_marks, 1)
        factors.append({
            "factor": "Low Academic Performance",
            "value": round(average_marks, 2),
            "impact": "HIGH",
            "target": f"Requires +{shortfall} points to cross the 50% passing cutoff"
        })
    elif average_marks < 60:
        shortfall = round(60.0 - average_marks, 1)
        factors.append({
            "factor": "Below Average Marks",
            "value": round(average_marks, 2),
            "impact": "MEDIUM",
            "target": f"Requires +{shortfall} points to reach 60% good standing"
        })

    # Subject Variance Detection (spread between highest and lowest marks)
    if highest_marks is not None and lowest_marks is not None:
        spread = round(float(highest_marks) - float(lowest_marks), 2)
        if spread > 35:
            factors.append({
                "factor": "High Subject Variance",
                "value": f"{round(lowest_marks, 1)} to {round(highest_marks, 1)}",
                "impact": "MEDIUM",
                "target": f"Subject score spread is {spread} marks; targeted remedial tutoring recommended in lowest scoring subject"
            })

    if not factors:
        factors.append({
            "factor": "No Major Risk Factor",
            "value": "Normal",
            "impact": "LOW",
            "target": "Maintain current attendance and academic performance"
        })

    return factors


def predict_risk(
    attendance: float,
    average_marks: float,
    highest_marks: float = 0.0,
    lowest_marks: float = 0.0
) -> Dict[str, Any]:
    """
    Evaluates student risk using cached Scikit-Learn Random Forest model.
    Computes confidence and continuous risk_score alongside probability breakdown.
    Gracefully falls back to heuristic rules if model is not yet trained.
    """
    bundle = get_model_bundle()
    marks_range = max(0.0, highest_marks - lowest_marks)

    explanation = explain_prediction(
        attendance=attendance,
        average_marks=average_marks,
        highest_marks=highest_marks,
        lowest_marks=lowest_marks
    )

    if bundle is None:
        # Fallback heuristic if model is not available
        if attendance < 75 or average_marks < 50:
            pred = "HIGH"
            score = 85.0
            conf = 88.0
        elif attendance < 80 or average_marks < 60:
            pred = "MEDIUM"
            score = 55.0
            conf = 72.0
        else:
            pred = "LOW"
            score = 15.0
            conf = 92.0

        return {
            "prediction": pred,
            "confidence": conf,
            "risk_score": score,
            "probabilities": {
                "HIGH": 80.0 if pred == "HIGH" else 10.0,
                "MEDIUM": 60.0 if pred == "MEDIUM" else 20.0,
                "LOW": 80.0 if pred == "LOW" else 10.0,
            },
            "explanation": explanation,
            "feature_importance": {}
        }

    model = bundle["model"]
    features = bundle["features"]
    feature_importance = bundle.get("feature_importance", {})

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

    prob_percentage = {
        key: round(float(value) * 100, 2)
        for key, value in probability_map.items()
    }

    # Calculate model confidence (percentage of highest probability class)
    max_prob = max(probabilities) if len(probabilities) > 0 else 0.5
    confidence = round(float(max_prob) * 100, 2)

    # Compute a continuous 0-100 risk score based on class probabilities
    p_high = prob_percentage.get("HIGH", 0.0)
    p_med = prob_percentage.get("MEDIUM", 0.0)
    p_low = prob_percentage.get("LOW", 0.0)
    risk_score = round(p_high * 1.0 + p_med * 0.5, 1)

    return {
        "prediction": prediction,
        "confidence": confidence,
        "risk_score": risk_score,
        "probabilities": prob_percentage,
        "explanation": explanation,
        "feature_importance": feature_importance
    }


def predict_all_students(db):
    """
    Evaluates ML risk for all students in the database.
    Returns enriched records including confidence and risk_score.
    """
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
                if str(record.status).lower() == "present"
            )
            attendance_percentage = (
                present / len(attendance_records)
            ) * 100
        else:
            attendance_percentage = 0.0

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
            average_marks = 0.0
            highest_marks = 0.0
            lowest_marks = 0.0

        prediction = predict_risk(
            attendance=attendance_percentage,
            average_marks=average_marks,
            highest_marks=highest_marks,
            lowest_marks=lowest_marks
        )

        probability = max(
            prediction["probabilities"].values()
        ) if prediction["probabilities"] else 50.0

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
            "confidence": prediction.get("confidence", round(probability, 2)),
            "risk_score": prediction.get("risk_score", 0),
            "probabilities": prediction["probabilities"],
            "explanation": prediction["explanation"],
            "feature_importance": prediction.get("feature_importance", {})
        })

    return results