import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  Award,
  AlertTriangle,
  BookOpen,
  Upload,
  ShieldAlert,
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import api from "../services/api";
import "../pages/Pages.css";

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="cf-stat" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="cf-stat-top">
        <div className="cf-stat-icon" style={{ background: bg, color }}>
          <Icon size={19} />
        </div>
      </div>
      <div className="cf-stat-label">{title}</div>
      <div className="cf-stat-value">{value}</div>
    </div>
  );
}

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/analytics/faculty-dashboard")
      .then((r) => setData(r.data))
      .catch(() => setError("Unable to load faculty dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="cf-page">
        <div className="cf-loading">Loading faculty dashboard…</div>
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

  const riskStudents = (data?.risk_students ?? []).filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      String(s.name ?? "").toLowerCase().includes(q) ||
      String(s.roll_no ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="cf-page">
      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">
            <Sparkles size={12} style={{ display: "inline", marginRight: 6 }} />
            FACULTY PORTAL
          </div>
          <h1 className="cf-page-title">Faculty Dashboard</h1>
          <p className="cf-page-subtitle">
            Monitor class performance, upload data, and identify students
            requiring attention.
          </p>
        </div>
        <div className="reports-live-badge">
          <span className="status-dot" />
          Live Data
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fd-quick-actions">
        <button
          className="fd-action-btn blue"
          onClick={() => navigate("/etl")}
        >
          <Upload size={17} />
          <div>
            <strong>Upload Attendance</strong>
            <span>Import CSV / Excel</span>
          </div>
          <ArrowRight size={15} className="fd-action-arrow" />
        </button>

        <button
          className="fd-action-btn purple"
          onClick={() => navigate("/etl")}
        >
          <Award size={17} />
          <div>
            <strong>Upload Marks</strong>
            <span>Import CSV / Excel</span>
          </div>
          <ArrowRight size={15} className="fd-action-arrow" />
        </button>

        <button
          className="fd-action-btn red"
          onClick={() => navigate("/ai-risk")}
        >
          <ShieldAlert size={17} />
          <div>
            <strong>AI Risk Analysis</strong>
            <span>View all students</span>
          </div>
          <ArrowRight size={15} className="fd-action-arrow" />
        </button>
      </div>

      {/* Stats */}
      <div className="cf-stat-grid" style={{ marginBottom: 28 }}>
        <StatCard
          title="Total Students"
          value={data?.total_students ?? 0}
          icon={Users}
          color="#38bdf8"
          bg="rgba(56,189,248,0.1)"
        />
        <StatCard
          title="Avg Attendance"
          value={`${data?.average_attendance ?? 0}%`}
          icon={CalendarCheck}
          color="#10b981"
          bg="rgba(16,185,129,0.1)"
        />
        <StatCard
          title="Avg Marks"
          value={data?.average_marks ?? 0}
          icon={Award}
          color="#6366f1"
          bg="rgba(99,102,241,0.1)"
        />
        <StatCard
          title="High Risk"
          value={data?.high_risk ?? 0}
          icon={AlertTriangle}
          color="#ef4444"
          bg="rgba(239,68,68,0.1)"
        />
      </div>

      {/* Subject Performance */}
      <div className="cf-table-card" style={{ marginBottom: 24 }}>
        <div className="cf-toolbar" style={{ borderBottom: "1px solid #f3f4f6", marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <BookOpen size={18} style={{ color: "#6366f1" }} />
            <strong style={{ fontSize: 15 }}>Subject Performance</strong>
          </div>
        </div>
        <div className="cf-table-wrapper">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Average Marks</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {(data?.subjects ?? []).map((s, i) => {
                const pct = Math.min(Number(s.average_marks ?? 0), 100);
                return (
                  <tr key={i}>
                    <td>
                      <strong>{s.subject}</strong>
                    </td>
                    <td>{pct.toFixed(1)}</td>
                    <td style={{ width: 200 }}>
                      <div className="progress-track" style={{ height: 7, borderRadius: 10, background: "#f3f4f6" }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: 10,
                            background: pct >= 65 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
                            transition: "width 0.7s ease",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!(data?.subjects ?? []).length && (
                <tr>
                  <td colSpan={3}>
                    <div className="cf-empty">
                      <TrendingUp size={28} />
                      <p>No subject data available</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* At-Risk Students */}
      <div className="cf-table-card">
        <div className="cf-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldAlert size={18} style={{ color: "#ef4444" }} />
            <strong style={{ fontSize: 15 }}>High-Risk Students</strong>
          </div>
          <div className="cf-search" style={{ maxWidth: 260 }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by name or roll no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="cf-table-wrapper">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Attendance</th>
                <th>Avg Marks</th>
                <th>Risk</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {riskStudents.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="cf-empty">
                      <ShieldAlert size={28} />
                      <p>
                        {search
                          ? "No students match your search"
                          : "No high-risk students — great performance!"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                riskStudents.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <div className="cf-student">
                        <div className="cf-avatar">
                          {String(s.name ?? "S").charAt(0).toUpperCase()}
                        </div>
                        <div className="cf-student-name">{s.name}</div>
                      </div>
                    </td>
                    <td>
                      <strong>{s.roll_no}</strong>
                    </td>
                    <td>{Number(s.attendance ?? 0).toFixed(1)}%</td>
                    <td>{Number(s.average_marks ?? 0).toFixed(1)}</td>
                    <td>
                      <span
                        className={`risk-badge ${String(s.risk ?? "").toLowerCase()}`}
                      >
                        <span className="risk-dot" />
                        {s.risk}
                      </span>
                    </td>
                    <td>
                      <div className="risk-reason">
                        {(s.reasons ?? []).join(", ") || "—"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="cf-table-footer">
          Showing {riskStudents.length} high-risk student
          {riskStudents.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}