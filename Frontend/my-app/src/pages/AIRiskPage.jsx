/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Users,
  Sliders,
  Sparkles,
  Send,
  Bell,
  X,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingDown,
  Info,
  Download,
} from "lucide-react";

import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import AskCampusFlowAI from "../components/dashboard/AskCampusFlowAI";
import "./Pages.css";

/* Explainable AI Risk Engine (mirrors backend calculate_risk & explain_prediction) */
function computeSimulatedRisk(attendance, avgMarks, highMarks, lowMarks) {
  let score = 0;
  const factors = [];

  // Attendance factor
  if (attendance < 60) {
    score += 50;
    factors.push({
      factor: "Critical Attendance Drop",
      detail: `Attendance is ${attendance}% (below 60% threshold)`,
      impact: "HIGH",
    });
  } else if (attendance < 75) {
    score += 25;
    factors.push({
      factor: "Attendance Watchlist",
      detail: `Attendance is ${attendance}% (below mandatory 75%)`,
      impact: "MEDIUM",
    });
  } else {
    factors.push({
      factor: "Satisfactory Attendance",
      detail: `Attendance is ${attendance}% (above target)`,
      impact: "LOW",
    });
  }

  // Academic factor
  if (avgMarks < 50) {
    score += 50;
    factors.push({
      factor: "Severe Academic Deficiency",
      detail: `Average exam score is ${avgMarks}% (below 50%)`,
      impact: "HIGH",
    });
  } else if (avgMarks < 65) {
    score += 25;
    factors.push({
      factor: "Borderline Academic Score",
      detail: `Average score is ${avgMarks}% (between 50% and 65%)`,
      impact: "MEDIUM",
    });
  } else {
    factors.push({
      factor: "Good Academic Standing",
      detail: `Average score is ${avgMarks}% (passing standard)`,
      impact: "LOW",
    });
  }

  // Score variance factor
  const range = highMarks - lowMarks;
  if (range > 40) {
    factors.push({
      factor: "High Performance Volatility",
      detail: `Variance between highest (${highMarks}) and lowest (${lowMarks}) is ${range} pts`,
      impact: "MEDIUM",
    });
  }

  let risk = "LOW";
  let recommendation = "Student is currently performing on track. Maintain standard observation.";

  if (score >= 75) {
    risk = "HIGH";
    recommendation = "Immediate faculty intervention required: schedule counseling and notify parents.";
  } else if (score >= 40) {
    risk = "MEDIUM";
    recommendation = "Monitor student progress closely. Recommend remedial assignments and attendance warnings.";
  }

  return {
    score: Math.min(100, score),
    risk,
    factors,
    recommendation,
  };
}

/* ── Intervention / Notify Modal ── */
function InterventionModal({ student, onClose, onSent }) {
  const [interventionType, setInterventionType] = useState("Academic Warning");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);
      const studentId = student.student_id || student.id;

      await api.post("/analytics/intervene", {
        student_id: studentId,
        type: interventionType,
        notes: notes || undefined,
      });

      onSent({
        studentName: student.name,
        type: interventionType,
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to trigger academic intervention.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="cf-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cf-modal" style={{ maxWidth: "480px" }}>
        <div className="cf-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <h2 className="cf-modal-title">Trigger Academic Intervention</h2>
          </div>
          <button className="cf-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cf-modal-body">
          <div
            style={{
              padding: "12px",
              background: "var(--bg-elevated)",
              borderRadius: "6px",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              {student.name}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Roll: <strong>{student.roll_no}</strong> · Attendance: <strong>{student.attendance}%</strong> · Marks: <strong>{student.average_marks}%</strong>
            </div>
          </div>

          <div className="cf-form-group">
            <label>Intervention Action Type</label>
            <select
              className="cf-select"
              value={interventionType}
              onChange={(e) => setInterventionType(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="parent_alert">Automated Parent Alert (SMS & Email Notification)</option>
              <option value="counseling">Schedule Faculty Mentorship & Counseling Session</option>
              <option value="remedial">Assign Remedial Academic Support Coursework</option>
              <option value="dean_escalation">Escalate to Academic Dean for Review</option>
            </select>
          </div>

          <div className="cf-form-group">
            <label>Counseling Notes / Action Summary</label>
            <textarea
              className="cf-form-input"
              rows={3}
              placeholder="e.g. Student missed 4 consecutive lectures and scored 38% in midterm. Advised to attend tutorial sessions."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <div style={{ marginTop: "12px", padding: "10px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.12)", color: "var(--danger)", fontSize: "13px" }}>
              {error}
            </div>
          )}
        </div>

        <div className="cf-modal-footer">
          <button className="cf-secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="cf-submit-btn"
            disabled={sending}
            onClick={handleSend}
            style={{ background: "var(--danger)" }}
          >
            <Send size={14} />
            <span>{sending ? "Dispatching..." : "Dispatch Intervention"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIRiskPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("ALL");

  // What-If Simulator Sliders
  const [simAttendance, setSimAttendance] = useState(62);
  const [simAvgMarks, setSimAvgMarks] = useState(48);
  const [simHighMarks, setSimHighMarks] = useState(70);
  const [simLowMarks, setSimLowMarks] = useState(30);

  // Intervention Modal & Toast
  const [interveneStudent, setInterveneStudent] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analytics/risk");
      setStudents(res.data?.students || []);
    } catch (err) {
      console.error("Failed to load AI risk data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, []);

  // Risk Counts
  const totalAnalyzed = students.length;
  const highRiskCount = students.filter(
    (s) => String(s.risk).toUpperCase() === "HIGH"
  ).length;
  const mediumRiskCount = students.filter(
    (s) =>
      String(s.risk).toUpperCase() === "MEDIUM" ||
      String(s.risk).toUpperCase() === "MODERATE"
  ).length;
  const lowRiskCount = students.filter(
    (s) => String(s.risk).toUpperCase() === "LOW"
  ).length;

  // Filtered Students for Table
  const filteredStudents = useMemo(() => {
    if (riskFilter === "ALL") return students;
    return students.filter(
      (s) => String(s.risk).toUpperCase() === riskFilter
    );
  }, [students, riskFilter]);

  // Live Simulated Result
  const simulation = useMemo(() => {
    return computeSimulatedRisk(
      simAttendance,
      simAvgMarks,
      simHighMarks,
      simLowMarks
    );
  }, [simAttendance, simAvgMarks, simHighMarks, simLowMarks]);

  // Toast trigger
  const handleInterventionSent = ({ studentName }) => {
    setInterveneStudent(null);
    setToastMsg(`Intervention notice successfully logged and dispatched for ${studentName}!`);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Table Columns
  const columns = [
    {
      header: "Student",
      accessor: "name",
      render: (name, s) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background:
                String(s.risk).toUpperCase() === "HIGH"
                  ? "var(--danger-soft)"
                  : String(s.risk).toUpperCase() === "MEDIUM"
                  ? "var(--warning-soft)"
                  : "var(--success-soft)",
              color:
                String(s.risk).toUpperCase() === "HIGH"
                  ? "var(--danger)"
                  : String(s.risk).toUpperCase() === "MEDIUM"
                  ? "var(--warning)"
                  : "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            {(name || "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>
              {name || "Student"}
            </div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px", color: "var(--text-muted)" }}>
              {s.roll_no || "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Attendance",
      accessor: "attendance",
      cellStyle: { width: "150px" },
      render: (att) => {
        const val = Number(att || 0);
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              <span>{val.toFixed(1)}%</span>
            </div>
            <div style={{ height: "5px", background: "var(--bg-elevated)", borderRadius: "99px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(val, 100)}%`,
                  background: val < 60 ? "var(--danger)" : val < 75 ? "var(--warning)" : "var(--success)",
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "Avg Marks",
      accessor: "average_marks",
      cellStyle: { width: "150px" },
      render: (m) => {
        const val = Number(m || 0);
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              <span>{val.toFixed(1)} / 100</span>
            </div>
            <div style={{ height: "5px", background: "var(--bg-elevated)", borderRadius: "99px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(val, 100)}%`,
                  background: val < 50 ? "var(--danger)" : val < 65 ? "var(--warning)" : "var(--accent)",
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "Risk Tier",
      accessor: "risk",
      cellStyle: { width: "120px" },
      render: (r) => <StatusBadge status={r || "Low"} size="sm" />,
    },
    {
      header: "XAI Causal Reasons",
      accessor: "reasons",
      render: (reasons) => {
        const list = Array.isArray(reasons) ? reasons : [];
        if (list.length === 0) {
          return <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>On track · No critical risk factors</span>;
        }
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {list.map((r, i) => (
              <span
                key={i}
                style={{
                  fontSize: "11px",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {r}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: "Intervention",
      cellStyle: { width: "130px", textAlign: "right" },
      render: (_, s) => {
        const isAtRisk = String(s.risk).toUpperCase() !== "LOW";
        if (!isAtRisk) {
          return (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              No action
            </span>
          );
        }
        return (
          <button
            className="cf-secondary-btn"
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderColor: "rgba(244, 63, 94, 0.3)",
              color: "var(--danger)",
            }}
            onClick={() => setInterveneStudent(s)}
          >
            <Bell size={12} />
            <span>Intervene</span>
          </button>
        );
      },
    },
  ];

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const dateStr = new Date().toISOString().split("T")[0];
    const headers = ["Roll Number", "Student Name", "Attendance %", "Marks %", "Risk Status", "Risk Score", "Confidence %", "Drivers & Recommendations"];
    const rows = filteredStudents.map((s) => [
      s.roll_no || "",
      s.name || "",
      s.attendance !== undefined ? `${s.attendance}%` : "",
      s.average_marks !== undefined ? `${s.average_marks}%` : "",
      s.risk || "",
      s.risk_score || "",
      s.confidence || "",
      (Array.isArray(s.reasons) ? s.reasons.join("; ") : s.recommendation) || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `CampusFlow_AI_Risk_Report_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cf-page">
      <PageHeader
        title="AI Risk Radar & Early Warning System"
        subtitle="Autonomous predictive risk modeling, causal factor breakdown, and live what-if simulation."
        badge={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={12} /> Explainable ML v2.4 Active
          </span>
        }
        actions={
          <button
            className="cf-secondary-btn"
            onClick={handleExportCSV}
            title="Download Risk Audit Dataset"
          >
            <Download size={14} />
            <span>Export Risk Audit (CSV)</span>
          </button>
        }
      />

      {/* Ask CampusFlow AI Natural Language Query Bar */}
      <AskCampusFlowAI />

      {/* ── 1. TOP KPI STRIP ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Students Analyzed"
          value={totalAnalyzed}
          icon={Users}
          trend="Total enrolled cohort"
          variant="default"
        />
        <StatCard
          label="High Risk (Critical)"
          value={highRiskCount}
          icon={AlertTriangle}
          trend={highRiskCount > 0 ? "Immediate action required" : "Zero critical alerts"}
          variant={highRiskCount > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Moderate Risk (Watchlist)"
          value={mediumRiskCount}
          icon={Activity}
          trend="Academic warning zone"
          variant="warning"
        />
        <StatCard
          label="Low Risk (On Track)"
          value={lowRiskCount}
          icon={ShieldCheck}
          trend="Optimal progress"
          variant="success"
        />
      </div>

      {/* ── 2. INTERACTIVE "WHAT-IF" AI SIMULATOR PANEL ── */}
      <div className="surface-card" style={{ padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={18} color="var(--accent)" />
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                Interactive "What-If" AI Academic Risk Simulator
              </h2>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Adjust live academic parameters to simulate ML predictions and examine causal impact factors.
            </p>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent)", background: "var(--accent-soft)", padding: "4px 8px", borderRadius: "4px" }}>
            Live Inference
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {/* Left: 4 Range Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Attendance Rate</span>
                <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{simAttendance}%</strong>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={simAttendance}
                onChange={(e) => setSimAttendance(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Average Examination Score</span>
                <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{simAvgMarks} / 100</strong>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={simAvgMarks}
                onChange={(e) => setSimAvgMarks(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Highest Score</span>
                  <strong style={{ color: "var(--text-primary)" }}>{simHighMarks}</strong>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={simHighMarks}
                  onChange={(e) => setSimHighMarks(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Lowest Score</span>
                  <strong style={{ color: "var(--text-primary)" }}>{simLowMarks}</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={simLowMarks}
                  onChange={(e) => setSimLowMarks(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>

          {/* Right: Simulated Risk Card + XAI Factors */}
          <div
            style={{
              padding: "16px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Predicted Risk Output
                </span>
                <StatusBadge status={simulation.risk} size="sm" />
              </div>

              <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.45, marginBottom: "12px" }}>
                <strong>Recommendation:</strong> {simulation.recommendation}
              </div>

              {/* Explainable AI Factors */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Explainable AI (XAI) Causal Drivers
                </span>
                {simulation.factors.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>{f.factor}</strong>
                      <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>
                        {f.detail}
                      </span>
                    </div>
                    <span
                      className={`status-badge size-sm ${
                        f.impact === "HIGH"
                          ? "variant-danger"
                          : f.impact === "MEDIUM"
                          ? "variant-warning"
                          : "variant-success"
                      }`}
                    >
                      {f.impact} IMPACT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. STUDENT RISK RADAR TABLE ── */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        isLoading={loading}
        searchPlaceholder="Search students by name or roll number..."
        emptyMessage="No students match the current risk criteria."
        filters={
          <div className="segmented-control" role="tablist">
            <button
              className={`segmented-btn ${riskFilter === "ALL" ? "active" : ""}`}
              onClick={() => setRiskFilter("ALL")}
            >
              All ({students.length})
            </button>
            <button
              className={`segmented-btn ${riskFilter === "HIGH" ? "active" : ""}`}
              onClick={() => setRiskFilter("HIGH")}
              style={{ color: riskFilter === "HIGH" ? undefined : "var(--danger)" }}
            >
              High ({highRiskCount})
            </button>
            <button
              className={`segmented-btn ${riskFilter === "MEDIUM" ? "active" : ""}`}
              onClick={() => setRiskFilter("MEDIUM")}
              style={{ color: riskFilter === "MEDIUM" ? undefined : "var(--warning)" }}
            >
              Moderate ({mediumRiskCount})
            </button>
            <button
              className={`segmented-btn ${riskFilter === "LOW" ? "active" : ""}`}
              onClick={() => setRiskFilter("LOW")}
              style={{ color: riskFilter === "LOW" ? undefined : "var(--success)" }}
            >
              Low ({lowRiskCount})
            </button>
          </div>
        }
      />

      {/* Intervention Modal */}
      {interveneStudent && (
        <InterventionModal
          student={interveneStudent}
          onClose={() => setInterveneStudent(null)}
          onSent={handleInterventionSent}
        />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="dept-toast success">
          <CheckCircle2 size={16} style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
