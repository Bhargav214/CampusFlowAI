/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Save,
  Loader2,
  FileText,
  Percent,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import "./Pages.css";

const EXAM_TYPES = [
  "Midterm Examination",
  "Final Examination",
  "Internal Assessment 1",
  "Internal Assessment 2",
  "Lab Practical",
  "Assignment & Project",
];

function calculateGrade(score, max = 100) {
  if (score === "" || score === null || score === undefined || isNaN(score)) {
    return { grade: "—", variant: "neutral" };
  }
  const pct = (Number(score) / Number(max)) * 100;
  if (pct >= 90) return { grade: "A+", variant: "success" };
  if (pct >= 80) return { grade: "A", variant: "success" };
  if (pct >= 70) return { grade: "B", variant: "default" };
  if (pct >= 60) return { grade: "C", variant: "warning" };
  if (pct >= 50) return { grade: "D", variant: "warning" };
  return { grade: "F", variant: "danger" };
}

export default function MarksPage() {
  const { user } = useAuth();
  const isFacultyOrAdmin = user?.role === "admin" || user?.role === "faculty";

  const [activeTab, setActiveTab] = useState(
    isFacultyOrAdmin ? "sheet" : "directory"
  );

  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fast Sheet Entry State
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedExamType, setSelectedExamType] = useState(EXAM_TYPES[0]);
  const [maxMarks, setMaxMarks] = useState(100);
  const [studentScores, setStudentScores] = useState({}); // { [studentId]: scoreNumber }
  const [savingSheet, setSavingSheet] = useState(false);
  const [sheetFeedback, setSheetFeedback] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [marksRes, studentsRes, subjectsRes] = await Promise.all([
        api.get("/marks/"),
        api.get("/students/"),
        api.get("/subjects").catch(() => ({ data: [] })),
      ]);

      const mList = Array.isArray(marksRes.data) ? marksRes.data : [];
      const sList = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data?.students || studentsRes.data?.data || [];
      const subList = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];

      setMarks(mList);
      setStudents(sList);
      setSubjects(subList);

      if (subList.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(String(subList[0].id));
      }
    } catch (err) {
      console.error("Marks loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lookups
  const studentMap = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [students]);

  const subjectMap = useMemo(() => {
    const map = {};
    subjects.forEach((sub) => {
      map[sub.id] = sub;
    });
    return map;
  }, [subjects]);

  // Overall Statistics
  const averageMarks = useMemo(() => {
    if (!marks.length) return "0.0";
    const totalPct = marks.reduce((acc, m) => {
      const max = m.max_marks || 100;
      return acc + (Number(m.marks_obtained || 0) / max) * 100;
    }, 0);
    return (totalPct / marks.length).toFixed(1);
  }, [marks]);

  const passingRate = useMemo(() => {
    if (!marks.length) return "0.0";
    const passed = marks.filter((m) => {
      const max = m.max_marks || 100;
      return (Number(m.marks_obtained || 0) / max) * 100 >= 50;
    }).length;
    return ((passed / marks.length) * 100).toFixed(1);
  }, [marks]);

  // Handle Score Input Change
  const handleScoreChange = (studentId, value) => {
    setStudentScores((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  // Batch Save Marks
  const handleSaveMarks = async () => {
    if (!selectedSubjectId) {
      setSheetFeedback({
        type: "error",
        text: "Please select a subject before saving marks.",
      });
      return;
    }

    // Filter students with an entered score
    const entriesToSave = students.filter(
      (s) =>
        studentScores[s.id] !== undefined &&
        studentScores[s.id] !== "" &&
        !isNaN(studentScores[s.id])
    );

    if (entriesToSave.length === 0) {
      setSheetFeedback({
        type: "error",
        text: "Please enter marks for at least one student.",
      });
      return;
    }

    try {
      setSavingSheet(true);
      setSheetFeedback(null);

      const recordsPayload = entriesToSave.map((s) => ({
        student_id: s.id,
        subject_id: parseInt(selectedSubjectId, 10),
        exam_type: selectedExamType,
        marks_obtained: Number(studentScores[s.id]),
        max_marks: Number(maxMarks),
      }));

      const res = await api.post("/marks/bulk", { records: recordsPayload });

      const inserted = res.data?.inserted ?? 0;
      const updated = res.data?.updated ?? 0;

      setSheetFeedback({
        type: "success",
        text: `Successfully saved marks! (${inserted} new records, ${updated} updated records).`,
      });

      // Clear entered scores & refresh marks list
      setStudentScores({});
      const marksRes = await api.get("/marks/");
      setMarks(Array.isArray(marksRes.data) ? marksRes.data : []);
    } catch (err) {
      setSheetFeedback({
        type: "error",
        text: err.response?.data?.detail || "Failed to submit marks.",
      });
    } finally {
      setSavingSheet(false);
    }
  };

  // Enriched Marks for Directory DataTable
  const processedMarks = useMemo(() => {
    return marks.map((m, index) => {
      const student = studentMap[m.student_id];
      const subject = subjectMap[m.subject_id];
      const max = m.max_marks || 100;
      const obtained = Number(m.marks_obtained || 0);
      const pct = max > 0 ? ((obtained / max) * 100).toFixed(1) : "0.0";
      const { grade, variant } = calculateGrade(obtained, max);

      const studentName =
        `${student?.first_name || ""} ${student?.last_name || ""}`.trim() ||
        student?.name ||
        `Student #${m.student_id}`;

      return {
        id: m.id || index,
        studentName,
        rollNumber: student?.roll_number || "—",
        subjectName: subject?.name || `Course #${m.subject_id}`,
        examType: m.exam_type || "Assessment",
        obtained,
        max,
        pct: `${pct}%`,
        grade,
        gradeVariant: variant,
      };
    });
  }, [marks, studentMap, subjectMap]);

  // Directory Columns
  const directoryColumns = [
    {
      header: "Student",
      accessor: "studentName",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>
            {name}
          </span>
        </div>
      ),
    },
    {
      header: "Roll Number",
      accessor: "rollNumber",
      cellStyle: { width: "130px" },
      render: (r) => (
        <span
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "12px",
            color: "var(--text-muted)",
            fontWeight: 600,
          }}
        >
          {r}
        </span>
      ),
    },
    {
      header: "Subject",
      accessor: "subjectName",
      render: (s) => (
        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
          {s}
        </span>
      ),
    },
    {
      header: "Exam / Assessment",
      accessor: "examType",
      render: (ex) => (
        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
          {ex}
        </span>
      ),
    },
    {
      header: "Score",
      accessor: "obtained",
      cellStyle: { width: "120px" },
      render: (_, r) => (
        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {r.obtained} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>/ {r.max}</span>
        </span>
      ),
    },
    {
      header: "Grade",
      accessor: "grade",
      cellStyle: { width: "100px" },
      render: (_, r) => (
        <span
          className={`status-badge size-sm variant-${r.gradeVariant}`}
        >
          <span className="status-badge-dot" />
          {r.grade} ({r.pct})
        </span>
      ),
    },
  ];

  return (
    <div className="cf-page">
      <PageHeader
        title="Marks & Examination Center"
        subtitle="Fast marks entry sheet, grade assessment, and searchable academic grade directory."
        badge={`${averageMarks}% Average Benchmark`}
        actions={
          <div className="segmented-control" role="tablist">
            {isFacultyOrAdmin && (
              <button
                className={`segmented-btn ${activeTab === "sheet" ? "active" : ""}`}
                onClick={() => setActiveTab("sheet")}
              >
                <FileText size={14} />
                <span>Enter Marks (Sheet)</span>
              </button>
            )}
            <button
              className={`segmented-btn ${activeTab === "directory" ? "active" : ""}`}
              onClick={() => setActiveTab("directory")}
            >
              <Award size={14} />
              <span>Marks & Grades Directory</span>
            </button>
          </div>
        }
      />

      {/* KPI Overview Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Average Score"
          value={`${averageMarks}%`}
          icon={Percent}
          trend="Overall exam benchmark"
          variant="default"
        />
        <StatCard
          label="Passing Rate"
          value={`${passingRate}%`}
          icon={CheckCircle}
          trend={Number(passingRate) >= 75 ? "Optimal performance" : "Academic watchlist"}
          variant={Number(passingRate) >= 75 ? "success" : "warning"}
        />
        <StatCard
          label="Recorded Scores"
          value={marks.length}
          icon={GraduationCap}
          trend="Evaluated exam papers"
          variant="default"
        />
      </div>

      {/* ── TAB 1: FAST MARKS ENTRY SHEET ── */}
      {activeTab === "sheet" && isFacultyOrAdmin && (
        <div className="surface-card" style={{ padding: "20px", marginBottom: "20px" }}>
          {/* Top Filter Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border)",
              marginBottom: "16px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                Subject / Course *
              </label>
              <select
                className="cf-select"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{ width: "100%" }}
              >
                {subjects.length === 0 ? (
                  <option value="">No subjects found</option>
                ) : (
                  subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.subject_code || "Code"})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                Assessment / Exam Type *
              </label>
              <select
                className="cf-select"
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                style={{ width: "100%" }}
              >
                {EXAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                Max Score
              </label>
              <input
                type="number"
                min="10"
                max="500"
                className="cf-form-input"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value) || 100)}
                style={{ height: "36px" }}
              />
            </div>
          </div>

          {/* Sheet Feedback */}
          {sheetFeedback && (
            <div
              className={`cf-form-alert ${sheetFeedback.type}`}
              style={{ marginBottom: "16px" }}
            >
              {sheetFeedback.text}
            </div>
          )}

          {/* Roster Table with Inline Grade Badges */}
          <div style={{ overflowX: "auto" }}>
            <table className="cf-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>#</th>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th style={{ width: "160px" }}>Marks Obtained (0–{maxMarks})</th>
                  <th style={{ width: "130px", textAlign: "right" }}>Projected Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No students found in directory.
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => {
                    const fullName =
                      `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                      student.name ||
                      "Student";
                    const enteredVal = studentScores[student.id] ?? "";
                    const numVal = Number(enteredVal);
                    const isInvalid =
                      enteredVal !== "" && (numVal < 0 || numVal > maxMarks || isNaN(numVal));
                    const { grade, variant } = calculateGrade(
                      enteredVal !== "" && !isInvalid ? numVal : null,
                      maxMarks
                    );

                    return (
                      <tr key={student.id}>
                        <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{idx + 1}</td>
                        <td style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600, fontSize: "12px" }}>
                          {student.roll_number || "—"}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "6px",
                                background: "var(--accent-soft)",
                                color: "var(--accent)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{fullName}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                          {student.department || "General"}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            placeholder="0"
                            className="cf-form-input"
                            value={enteredVal}
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            style={{
                              height: "32px",
                              width: "100px",
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: 600,
                              borderColor: isInvalid ? "var(--danger)" : undefined,
                            }}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isInvalid ? (
                            <span style={{ color: "var(--danger)", fontSize: "11px", fontWeight: 600 }}>
                              Invalid (0–{maxMarks})
                            </span>
                          ) : (
                            <span className={`status-badge size-sm variant-${variant}`}>
                              <span className="status-badge-dot" />
                              {grade}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sticky Bottom Save Bar */}
          <div
            style={{
              marginTop: "20px",
              padding: "14px 18px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Entering marks for: <strong style={{ color: "var(--text-primary)" }}>{selectedExamType}</strong> · Max: <strong>{maxMarks}</strong>
            </div>

            <button
              className="cf-submit-btn"
              disabled={savingSheet || students.length === 0}
              onClick={handleSaveMarks}
            >
              {savingSheet ? <Loader2 size={15} className="cf-spin" /> : <Save size={15} />}
              <span>{savingSheet ? "Submitting..." : "Save All Marks"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: MARKS & GRADES DIRECTORY ── */}
      {(activeTab === "directory" || !isFacultyOrAdmin) && (
        <DataTable
          columns={directoryColumns}
          data={processedMarks}
          isLoading={loading}
          searchPlaceholder="Search marks by student name, roll number, or subject..."
          emptyMessage="No assessment scores recorded yet."
        />
      )}
    </div>
  );
}
