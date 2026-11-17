import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  Award,
  AlertTriangle,
  BookOpen,
  Upload,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import "./Pages.css";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/analytics/faculty-dashboard")
      .then((r) => setData(r.data))
      .catch(() => setError("Unable to load faculty dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="cf-page">
        <div className="cf-loading">Loading faculty intelligence dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cf-page">
        <div className="cf-error">{error}</div>
      </div>
    );
  }

  const totalStudents = data?.total_students ?? 0;
  const avgAttendance = Number(data?.average_attendance ?? 0);
  const avgMarks = Number(data?.average_marks ?? 0);
  const highRiskCount = data?.high_risk ?? 0;
  const subjects = data?.subjects ?? [];
  const riskStudents = data?.risk_students ?? [];

  const columns = [
    {
      header: "Student Name",
      accessor: "name",
      render: (name) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {name || "Student"}
        </span>
      ),
    },
    {
      header: "Roll Number",
      accessor: "roll_no",
      cellStyle: { width: "120px" },
      render: (r) => (
        <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--text-muted)", fontWeight: 600 }}>
          {r || "—"}
        </span>
      ),
    },
    {
      header: "Attendance",
      accessor: "attendance",
      cellStyle: { width: "120px" },
      render: (att) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {att}%
        </span>
      ),
    },
    {
      header: "Average Marks",
      accessor: "average_marks",
      cellStyle: { width: "120px" },
      render: (m) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {m} / 100
        </span>
      ),
    },
    {
      header: "Risk Status",
      accessor: "risk",
      cellStyle: { width: "110px" },
      render: (risk) => <StatusBadge status={risk || "High"} size="sm" />,
    },
  ];

  return (
    <div className="cf-page">
      <PageHeader
        title="Faculty Workspace Portal"
        subtitle="Departmental cohort telemetry, subject performance indicators, and students requiring mentorship."
        badge={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={12} /> Advisory Mode
          </span>
        }
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="cf-secondary-btn" onClick={() => navigate("/attendance")}>
              <CalendarCheck size={14} />
              <span>Mark Attendance</span>
            </button>
            <button className="cf-primary-btn" onClick={() => navigate("/marks")}>
              <Award size={14} />
              <span>Enter Marks</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Total Students"
          value={totalStudents}
          icon={Users}
          trend="Under faculty supervision"
          variant="default"
        />
        <StatCard
          label="Cohort Attendance"
          value={`${avgAttendance.toFixed(1)}%`}
          icon={CalendarCheck}
          trend={avgAttendance >= 75 ? "Optimal rate" : "Below required 75%"}
          variant={avgAttendance >= 75 ? "success" : "warning"}
        />
        <StatCard
          label="Cohort Average Marks"
          value={`${avgMarks.toFixed(1)}%`}
          icon={Award}
          trend="Overall examination average"
          variant="default"
        />
        <StatCard
          label="High-Risk Students"
          value={highRiskCount}
          icon={AlertTriangle}
          trend={highRiskCount > 0 ? "Require advisory" : "Zero critical alerts"}
          variant={highRiskCount > 0 ? "danger" : "success"}
        />
      </div>

      {/* Subjects & Risk Table Grid */}
      <div style={{ display: "grid", gridTemplateColumns: subjects.length > 0 ? "1fr 2fr" : "1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Subject performance */}
        {subjects.length > 0 && (
          <div className="surface-card" style={{ padding: "18px 20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Assigned Subjects
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {subjects.map((sub, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    background: "var(--bg-elevated)",
                    borderRadius: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
                    {sub.subject}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>
                    {Number(sub.average_marks ?? 0).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Watchlist */}
        <div className="surface-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Students Requiring Faculty Attention
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Intervention recommended based on attendance or exam performance
              </p>
            </div>
            <button className="cf-secondary-btn" onClick={() => navigate("/ai-risk")} style={{ fontSize: "12px" }}>
              <span>View Full AI Risk Radar</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <DataTable
            columns={columns}
            data={riskStudents}
            searchPlaceholder="Search students in watchlist..."
            emptyMessage="No students in this cohort currently at high risk."
          />
        </div>
      </div>
    </div>
  );
}
