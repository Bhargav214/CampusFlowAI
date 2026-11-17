/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Users,
  Check,
  X,
  Loader2,
  Calendar,
  Save,
  Clock,
  Sparkles,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import "./Pages.css";

function normalizeData(data) {
  if (Array.isArray(data)) return data;
  return (
    data?.attendance ||
    data?.students ||
    data?.records ||
    data?.data ||
    data?.results ||
    []
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isFacultyOrAdmin = user?.role === "admin" || user?.role === "faculty";

  const [activeTab, setActiveTab] = useState(
    isFacultyOrAdmin ? "roster" : "logs"
  );

  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Roster state
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [rosterStatus, setRosterStatus] = useState({}); // { [studentId]: "Present" | "Absent" }
  const [savingRoster, setSavingRoster] = useState(false);
  const [rosterFeedback, setRosterFeedback] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, studentsRes, subjectsRes] = await Promise.all([
        api.get("/attendance/"),
        api.get("/students/"),
        api.get("/subjects").catch(() => ({ data: [] })),
      ]);

      const attList = normalizeData(attendanceRes.data);
      const stdList = normalizeData(studentsRes.data);
      const subList = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];

      setRecords(attList);
      setStudents(stdList);
      setSubjects(subList);

      if (subList.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(String(subList[0].id));
      }

      // Initialize all students as "Present" by default for quick roster marking
      const initialRoster = {};
      stdList.forEach((s) => {
        initialRoster[s.id] = "Present";
      });
      setRosterStatus(initialRoster);
    } catch (err) {
      console.error("Attendance loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Student and Subject lookup maps
  const studentMap = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      if (s.id !== undefined) map[s.id] = s;
    });
    return map;
  }, [students]);

  const subjectMap = useMemo(() => {
    const map = {};
    subjects.forEach((sub) => {
      if (sub.id !== undefined) map[sub.id] = sub;
    });
    return map;
  }, [subjects]);

  // Attendance stats
  const totalLogs = records.length;
  const presentLogs = records.filter(
    (r) => String(r.status).toLowerCase() === "present"
  ).length;
  const attendanceRate =
    totalLogs > 0 ? ((presentLogs / totalLogs) * 100).toFixed(1) : "0.0";

  // Roster helpers
  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setRosterStatus(updated);
  };

  const handleToggleStudent = (studentId, status) => {
    setRosterStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Roster metrics
  const rosterTotal = students.length;
  const rosterPresentCount = Object.values(rosterStatus).filter(
    (st) => st === "Present"
  ).length;
  const rosterAbsentCount = rosterTotal - rosterPresentCount;
  const rosterRate =
    rosterTotal > 0
      ? ((rosterPresentCount / rosterTotal) * 100).toFixed(1)
      : "0.0";

  // Save Roster Attendance Batch (Atomic Bulk Endpoint)
  const handleSaveRoster = async () => {
    if (!selectedSubjectId) {
      setRosterFeedback({
        type: "error",
        text: "Please select an academic subject before saving attendance.",
      });
      return;
    }

    if (students.length === 0) {
      setRosterFeedback({
        type: "error",
        text: "No students available in the current roster.",
      });
      return;
    }

    try {
      setSavingRoster(true);
      setRosterFeedback(null);

      const recordsPayload = students.map((s) => ({
        student_id: s.id,
        subject_id: parseInt(selectedSubjectId, 10),
        date: selectedDate,
        status: rosterStatus[s.id] || "Present",
      }));

      const res = await api.post("/attendance/bulk", { records: recordsPayload });

      const inserted = res.data?.inserted ?? 0;
      const updated = res.data?.updated ?? 0;

      setRosterFeedback({
        type: "success",
        text: `Successfully saved roster attendance! (${inserted} new records, ${updated} updated records).`,
      });

      // Reload logs in background
      const logRes = await api.get("/attendance/");
      setRecords(normalizeData(logRes.data));
    } catch (err) {
      setRosterFeedback({
        type: "error",
        text: err.response?.data?.detail || "Failed to submit attendance roster.",
      });
    } finally {
      setSavingRoster(false);
    }
  };

  // Processed historical records for DataTable
  const processedLogs = useMemo(() => {
    return records.map((record, index) => {
      const student = studentMap[record.student_id];
      const subject = subjectMap[record.subject_id];

      const name =
        `${student?.first_name || ""} ${student?.last_name || ""}`.trim() ||
        student?.name ||
        `Student #${record.student_id}`;

      return {
        id: record.id || index,
        date: record.date || "—",
        studentName: name,
        rollNumber: student?.roll_number || "—",
        subjectName: subject?.name || `Course #${record.subject_id}`,
        status: record.status || "Present",
      };
    });
  }, [records, studentMap, subjectMap]);

  // Log Columns
  const logColumns = [
    {
      header: "Date",
      accessor: "date",
      cellStyle: { width: "130px" },
      render: (d) => (
        <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500 }}>
          {d}
        </span>
      ),
    },
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
      header: "Subject / Course",
      accessor: "subjectName",
      render: (s) => (
        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
          {s}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cellStyle: { width: "120px" },
      render: (st) => <StatusBadge status={st} size="sm" />,
    },
  ];

  return (
    <div className="cf-page">
      <PageHeader
        title="Attendance Center"
        subtitle="Live class roster check-in, presence monitoring, and searchable historical logs."
        badge={`${attendanceRate}% Campus Attendance`}
        actions={
          <div className="segmented-control" role="tablist">
            {isFacultyOrAdmin && (
              <button
                className={`segmented-btn ${activeTab === "roster" ? "active" : ""}`}
                onClick={() => setActiveTab("roster")}
              >
                <CalendarCheck size={14} />
                <span>Mark Attendance (Roster)</span>
              </button>
            )}
            <button
              className={`segmented-btn ${activeTab === "logs" ? "active" : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              <Clock size={14} />
              <span>Attendance Logs</span>
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
          label="Total Check-Ins"
          value={totalLogs}
          icon={CalendarCheck}
          trend="Historical records"
          variant="default"
        />
        <StatCard
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={CheckCircle2}
          trend={Number(attendanceRate) >= 75 ? "Optimal (>75%)" : "Needs attention (<75%)"}
          variant={Number(attendanceRate) >= 75 ? "success" : "warning"}
        />
        <StatCard
          label="Enrolled Students"
          value={students.length}
          icon={Users}
          trend="Eligible for roll call"
          variant="default"
        />
      </div>

      {/* ── TAB 1: MARK ATTENDANCE (FAST ROSTER) ── */}
      {activeTab === "roster" && isFacultyOrAdmin && (
        <div className="surface-card" style={{ padding: "20px", marginBottom: "20px" }}>
          {/* Top Control Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border)",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Subject / Course *
                </label>
                <select
                  className="cf-select"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  style={{ minWidth: "220px" }}
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
                  Attendance Date
                </label>
                <input
                  type="date"
                  className="cf-form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ height: "36px", padding: "6px 10px" }}
                />
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleMarkAll("Present")}
                style={{ fontSize: "12px", color: "var(--success)" }}
              >
                <Check size={14} />
                <span>Mark All Present</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleMarkAll("Absent")}
                style={{ fontSize: "12px", color: "var(--danger)" }}
              >
                <X size={14} />
                <span>Mark All Absent</span>
              </button>
            </div>
          </div>

          {/* Feedback alert */}
          {rosterFeedback && (
            <div
              className={`cf-form-alert ${rosterFeedback.type}`}
              style={{ marginBottom: "16px" }}
            >
              {rosterFeedback.text}
            </div>
          )}

          {/* Student Roster List */}
          <div style={{ overflowX: "auto" }}>
            <table className="cf-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th style={{ textAlign: "right", width: "200px" }}>Presence Toggle</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No students enrolled to take attendance.
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => {
                    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.name || "Student";
                    const isPresent = (rosterStatus[student.id] || "Present") === "Present";

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
                        <td style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              borderRadius: "6px",
                              border: "1px solid var(--border)",
                              background: "var(--bg-elevated)",
                              padding: "2px",
                              gap: "2px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleStudent(student.id, "Present")}
                              style={{
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 10px",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: isPresent ? "var(--success)" : "transparent",
                                color: isPresent ? "#FFFFFF" : "var(--text-secondary)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Check size={12} />
                              <span>Present</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStudent(student.id, "Absent")}
                              style={{
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 10px",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: !isPresent ? "var(--danger)" : "transparent",
                                color: !isPresent ? "#FFFFFF" : "var(--text-secondary)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <X size={12} />
                              <span>Absent</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sticky Bottom Summary Bar */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px" }}>
              <span>
                Total Roster: <strong style={{ color: "var(--text-primary)" }}>{rosterTotal}</strong>
              </span>
              <span style={{ color: "var(--success)" }}>
                Present: <strong>{rosterPresentCount}</strong>
              </span>
              <span style={{ color: "var(--danger)" }}>
                Absent: <strong>{rosterAbsentCount}</strong>
              </span>
              <span>
                Rate: <strong style={{ color: "var(--text-primary)" }}>{rosterRate}%</strong>
              </span>
            </div>

            <button
              className="cf-submit-btn"
              disabled={savingRoster || students.length === 0}
              onClick={handleSaveRoster}
            >
              {savingRoster ? <Loader2 size={15} className="cf-spin" /> : <Save size={15} />}
              <span>{savingRoster ? "Recording..." : "Save Attendance"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: ATTENDANCE LOGS (DATATABLE) ── */}
      {(activeTab === "logs" || !isFacultyOrAdmin) && (
        <DataTable
          columns={logColumns}
          data={processedLogs}
          isLoading={loading}
          searchPlaceholder="Search logs by student name, roll number, or subject..."
          emptyMessage="No attendance logs recorded yet."
        />
      )}
    </div>
  );
}
