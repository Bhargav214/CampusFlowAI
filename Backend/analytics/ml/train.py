import os
import joblib

from sklearn.ensemble import RandomForestClassifier

from analytics.ml.features import build_student_features


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "model.pkl"
)


def train_model(db):

    df = build_student_features(db)

    if len(df) < 10:
        raise ValueError(
            "Not enough students to train model"
        )


    # ---------------------------------
    # Create baseline labels
    # ---------------------------------

    def classify(row):

        if (
            row["attendance_percentage"] < 75
            or row["average_marks"] < 50
        ):
            return "HIGH"

        elif (
            row["attendance_percentage"] < 80
            or row["average_marks"] < 60
        ):
            return "MEDIUM"

        return "LOW"


    df["risk"] = df.apply(
        classify,
        axis=1
    )


    features = [
        "attendance_percentage",
        "average_marks",
        "highest_marks",
        "lowest_marks",
        "marks_range"
    ]


    X = df[features]

    y = df["risk"]


    # ---------------------------------
    # Train Random Forest
    # ---------------------------------

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42
    )


    model.fit(X, y)

    feature_importance = dict(
    zip(
        features,
        model.feature_importances_
    )
)

    # ---------------------------------
    # Save model
    # ---------------------------------

    joblib.dump(
        {
            "model": model,
            "features": features,
            "feature_importance": {
                key: float(value)
                for key, value in feature_importance.items()
            }
        },
        MODEL_PATH
    )


    return {
        "students_used": len(df),
        "model": "RandomForestClassifier",
        "features": features,
        "classes": list(model.classes_),
        "feature_importance": {
            key:round(float(value), 4)
            for key, value in feature_importance.items()
        }
    }


if __name__ == "__main__":

    print(
        "Run training through the application "
        "database session."
    )