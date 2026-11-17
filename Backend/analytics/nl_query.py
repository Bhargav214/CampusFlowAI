import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.student import Student
from models.attendance import Attendance
from models.marks import Mark
from models.subject import Subject
from models.department import Department
from analytics.risk import calculate_risk


def process_natural_language_query(query: str, db: Session) -> Dict[str, Any]:
    """
    Parses plain English queries from administrators, faculty, and coordinators
    and executes deterministic SQLAlchemy queries to return structured tabular answers.
    Zero external paid API keys required.
    """
    q = (query or "").strip().lower()

    # ──────────────────────────────────────────────────────────
    # 1. ATTENDANCE SHORTAGE / THRESHOLD QUERIES
    # Examples:
    # "attendance shortage"
    # "students with attendance below 75%"
    # "attendance < 60"
    # ──────────────────────────────────────────────────────────
    att_match = re.search(r"attendance.*?(?:below|<|less than|under|shortage)\s*(\d+)?", q)
    if not att_match:
        att_match = re.search(r"(?:below|<|less than|under)\s*(\d+)%?\s*attendance", q)
    if not att_match and ("attendance shortage" in q or "short attendance" in q or "low attendance" in q):
        att_match = True

    if att_match:
        threshold = 75.0
        if hasattr(att_match, "group") and att_match.group(1):
            try:
                threshold = float(att_match.group(1))
            except ValueError:
                threshold = 75.0

        students = db.query(Student).all()
        matching_rows = []

        for s in students:
            records = db.query(Attendance).filter(Attendance.student_id == s.id).all()
            total = len(records)
            if total > 0:
                present = sum(1 for r in records if str(r.status).lower() == "present")
                att_pct = round((present / total) * 100, 1)
            else:
                att_pct = 0.0

            if att_pct < threshold:
                status = "Critical Shortage" if att_pct < 60 else "Shortage Warning"
                matching_rows.append([
                    getattr(s, "roll_number", f"STU-{s.id}"),
                    f"{getattr(s, 'first_name', '')} {getattr(s, 'last_name', '')}".strip() or s.roll_number,
                    getattr(s, "department", "BCA") or "BCA",
                    f"{att_pct}%",
                    status
                ])

        matching_rows.sort(key=lambda x: float(x[3].replace("%", "")))

        return {
            "query": query,
            "matched_intent": "attendance_shortage",
            "threshold": threshold,
            "total_records": len(matching_rows),
            "answer_summary": (
                f"Found {len(matching_rows)} student(s) with attendance below {threshold}% "
                f"(institutional minimum requirement is 75%)."
            ),
            "columns": ["Roll Number", "Student Name", "Department", "Attendance Rate", "Compliance Status"],
            "rows": matching_rows
        }

    # ──────────────────────────────────────────────────────────
    # 2. RISK ANALYSIS / INTERVENTION QUERIES
    # Examples:
    # "high risk students"
    # "who needs intervention"
    # "students at risk"
    # ──────────────────────────────────────────────────────────
    if "risk" in q or "interven" in q or "warning" in q or "watchlist" in q:
        target_risk = "HIGH"
        if "medium" in q or "moderate" in q or "watchlist" in q:
            target_risk = "MEDIUM"
        elif "low" in q or "safe" in q:
            target_risk = "LOW"

        students = db.query(Student).all()
        matching_rows = []

        for s in students:
            # Attendance
            att_records = db.query(Attendance).filter(Attendance.student_id == s.id).all()
            total_att = len(att_records)
            att_pct = (
                round((sum(1 for r in att_records if str(r.status).lower() == "present") / total_att) * 100, 1)
                if total_att > 0 else 0.0
            )

            # Marks
            marks_records = db.query(Mark).filter(Mark.student_id == s.id).all()
            tot_obt = sum(float(m.marks_obtained or 0) for m in marks_records)
            tot_max = sum(float(m.max_marks or 0) for m in marks_records)
            acad_pct = round((tot_obt / tot_max) * 100, 1) if tot_max > 0 else 0.0

            risk_eval = calculate_risk(att_pct, acad_pct)

            if target_risk == "HIGH" and risk_eval["risk"] == "HIGH":
                primary_reason = risk_eval["reasons"][0] if risk_eval["reasons"] else "Multiple Deficits"
                matching_rows.append([
                    getattr(s, "roll_number", f"STU-{s.id}"),
                    f"{getattr(s, 'first_name', '')} {getattr(s, 'last_name', '')}".strip() or s.roll_number,
                    f"{att_pct}%",
                    f"{acad_pct}%",
                    risk_eval["risk"],
                    primary_reason
                ])
            elif target_risk != "HIGH" and risk_eval["risk"] == target_risk:
                matching_rows.append([
                    getattr(s, "roll_number", f"STU-{s.id}"),
                    f"{getattr(s, 'first_name', '')} {getattr(s, 'last_name', '')}".strip() or s.roll_number,
                    f"{att_pct}%",
                    f"{acad_pct}%",
                    risk_eval["risk"],
                    risk_eval["recommendation"][:45] + "..."
                ])

        return {
            "query": query,
            "matched_intent": f"{target_risk.lower()}_risk_students",
            "total_records": len(matching_rows),
            "answer_summary": (
                f"Identified {len(matching_rows)} student(s) classified in the '{target_risk}' academic risk tier. "
                + ("Immediate faculty intervention advised." if target_risk == "HIGH" else "Regular telemetry tracking active.")
            ),
            "columns": ["Roll Number", "Student Name", "Attendance %", "Marks %", "Risk Level", "Primary Driver / Action"],
            "rows": matching_rows
        }

    # ──────────────────────────────────────────────────────────
    # 3. TOP / LEADING PERFORMERS (BY MARKS)
    # Examples:
    # "top 5 students"
    # "highest marks"
    # "best performers"
    # ──────────────────────────────────────────────────────────
    top_match = re.search(r"(?:top|best|highest|leading)\s*(\d+)?", q)
    if top_match or "rank" in q or "topper" in q:
        limit = 5
        if top_match and top_match.group(1):
            try:
                limit = int(top_match.group(1))
            except ValueError:
                limit = 5

        students = db.query(Student).all()
        ranked = []

        for s in students:
            marks_records = db.query(Mark).filter(Mark.student_id == s.id).all()
            tot_obt = sum(float(m.marks_obtained or 0) for m in marks_records)
            tot_max = sum(float(m.max_marks or 0) for m in marks_records)
            acad_pct = round((tot_obt / tot_max) * 100, 1) if tot_max > 0 else 0.0

            ranked.append({
                "roll": getattr(s, "roll_number", f"STU-{s.id}"),
                "name": f"{getattr(s, 'first_name', '')} {getattr(s, 'last_name', '')}".strip() or s.roll_number,
                "dept": getattr(s, "department", "BCA") or "BCA",
                "score": acad_pct
            })

        ranked.sort(key=lambda x: x["score"], reverse=True)
        top_slice = ranked[:limit]

        rows = [
            [
                f"#{idx + 1}",
                item["roll"],
                item["name"],
                item["dept"],
                f"{item['score']}%",
                "Distinction" if item["score"] >= 80 else ("First Class" if item["score"] >= 60 else "Pass")
            ]
            for idx, item in enumerate(top_slice)
        ]

        return {
            "query": query,
            "matched_intent": "top_performers",
            "total_records": len(rows),
            "answer_summary": f"Ranked top {len(rows)} academic performer(s) across institutional cohorts based on cumulative marks.",
            "columns": ["Rank", "Roll Number", "Student Name", "Department", "Cumulative Marks", "Academic Standing"],
            "rows": rows
        }

    # ──────────────────────────────────────────────────────────
    # 4. SUBJECT-WISE PERFORMANCE
    # Examples:
    # "subject performance"
    # "subject wise marks"
    # "average marks by subject"
    # ──────────────────────────────────────────────────────────
    if "subject" in q or "course" in q:
        subjects = db.query(Subject).all()
        subj_rows = []

        for sub in subjects:
            marks = db.query(Mark).filter(Mark.subject_id == sub.id).all()
            if marks:
                avg = sum(float(m.marks_obtained or 0) for m in marks) / len(marks)
                avg_pct = round(avg, 1)
                count = len(marks)
            else:
                avg_pct = 0.0
                count = 0

            band = "Excellent (80%+)" if avg_pct >= 80 else ("Good (65-79%)" if avg_pct >= 65 else ("Average (50-64%)" if avg_pct >= 50 else "Remedial Needed (<50%)"))

            subj_rows.append([
                getattr(sub, "subject_code", f"SUB-{sub.id}"),
                getattr(sub, "name", "Subject"),
                getattr(sub, "department", "BCA") or "BCA",
                f"{avg_pct} marks",
                band,
                f"{count} assessments"
            ])

        subj_rows.sort(key=lambda x: float(x[3].replace(" marks", "")), reverse=True)

        return {
            "query": query,
            "matched_intent": "subject_performance",
            "total_records": len(subj_rows),
            "answer_summary": f"Evaluated institutional marks across {len(subj_rows)} curriculum subjects.",
            "columns": ["Code", "Subject Name", "Department", "Average Score", "Performance Tier", "Assessment Volume"],
            "rows": subj_rows
        }

    # ──────────────────────────────────────────────────────────
    # 5. FAILING / LOW MARKS DEFICIT
    # Examples:
    # "marks below 40"
    # "failing students"
    # "below 50 marks"
    # ──────────────────────────────────────────────────────────
    marks_match = re.search(r"(?:marks.*?(?:below|<|less than|under)|fail.*?)\s*(\d+)?", q)
    if marks_match or "fail" in q:
        threshold = 50.0
        if marks_match and marks_match.group(1):
            try:
                threshold = float(marks_match.group(1))
            except ValueError:
                threshold = 50.0

        students = db.query(Student).all()
        failing_rows = []

        for s in students:
            marks_records = db.query(Mark).filter(Mark.student_id == s.id).all()
            tot_obt = sum(float(m.marks_obtained or 0) for m in marks_records)
            tot_max = sum(float(m.max_marks or 0) for m in marks_records)
            acad_pct = round((tot_obt / tot_max) * 100, 1) if tot_max > 0 else 0.0

            if acad_pct < threshold:
                failing_rows.append([
                    getattr(s, "roll_number", f"STU-{s.id}"),
                    f"{getattr(s, 'first_name', '')} {getattr(s, 'last_name', '')}".strip() or s.roll_number,
                    getattr(s, "department", "BCA") or "BCA",
                    f"{acad_pct}%",
                    f"Needs +{round(threshold - acad_pct, 1)} marks"
                ])

        failing_rows.sort(key=lambda x: float(x[3].replace("%", "")))

        return {
            "query": query,
            "matched_intent": "academic_deficit",
            "total_records": len(failing_rows),
            "answer_summary": f"Found {len(failing_rows)} student(s) scoring below {threshold}% overall marks.",
            "columns": ["Roll Number", "Student Name", "Department", "Current Marks %", "Target Recovery Gap"],
            "rows": failing_rows
        }

    # ──────────────────────────────────────────────────────────
    # 6. DEPARTMENT PERFORMANCE BREAKDOWN
    # Examples:
    # "department performance"
    # "department summary"
    # ──────────────────────────────────────────────────────────
    if "department" in q or "dept" in q:
        departments = db.query(Department).all()
        dept_rows = []

        for d in departments:
            d_students = db.query(Student).filter(
                (Student.department_id == d.id) | (Student.department == d.department_name) | (Student.department == d.department_code)
            ).all()

            student_count = len(d_students)
            dept_rows.append([
                d.department_code,
                d.department_name,
                f"{student_count} Students",
                "Active Cohort" if d.is_active else "Inactive"
            ])

        return {
            "query": query,
            "matched_intent": "department_summary",
            "total_records": len(dept_rows),
            "answer_summary": f"Telemetry overview for {len(dept_rows)} academic department(s).",
            "columns": ["Code", "Department Name", "Enrolled Census", "Status"],
            "rows": dept_rows
        }

    # ──────────────────────────────────────────────────────────
    # 7. GENERAL SEARCH / FALLBACK OVERVIEW
    # ──────────────────────────────────────────────────────────
    all_students = db.query(Student).limit(10).all()
    fallback_rows = []
    for s in all_students:
        att_records = db.query(Attendance).filter(Attendance.student_id == s.id).all()
        tot = len(att_records)
        att = round((sum(1 for r in att_records if str(r.status).lower() == "present") / tot) * 100, 1) if tot > 0 else 0.0

        fallback_rows.append([
            getattr(s, "roll_number", f"STU-{s.id}"),
            f"{getattr(s, 'first_name', '')} {getattr(s, 'last_name', '')}".strip() or s.roll_number,
            getattr(s, "department", "BCA") or "BCA",
            f"{att}%"
        ])

    return {
        "query": query,
        "matched_intent": "general_overview",
        "total_records": len(fallback_rows),
        "answer_summary": f"Processed query '{query}'. Showing sample student telemetry. Try quick-prompts like 'Attendance shortage (< 75%)' or 'Top 5 academic performers'.",
        "columns": ["Roll Number", "Student Name", "Department", "Attendance %"],
        "rows": fallback_rows
    }
