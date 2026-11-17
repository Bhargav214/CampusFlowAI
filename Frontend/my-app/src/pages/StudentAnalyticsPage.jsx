import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Award,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import "./Pages.css";

/* ─── SVG arc progress ring ─────────────────────────────────── */
function ArcRing({ pct, size = 140, color = "var(--accent)" }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="arc-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bg-elevated)"
        strokeWidth={10}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="var(--text-primary)"
        fontSize={size * 0.18}
        fontWeight="700"
      >
        {pct.toFixed(1)}%
      </text>
    </svg>
  );
}

function RingCard({ label, value, color, icon: Icon, subtitle }) {
  return (
    <div className="sa-ring-card">
      <div className="sa-ring-icon" style={{ color }}>
        <Icon size={18} />
      </div>
      <ArcRing pct={Number(value) || 0} color={color} />
      <div className="sa-ring-label">{label}</div>
      {subtitle && <div className="sa-ring-sub">{subtitle}</div>}
    </div>
  );
}

function RiskCard({ risk, reasons = [] }) {
  const isHigh = String(risk).toUpperCase() === "HIGH";
  const isMedium = String(risk).toUpperCase() === "MEDIUM" || String(risk).toUpperCase() === "MODERATE";

  return (
    <div
      className="sa-risk-card"
      style={{
        background: isHigh
          ? "var(--danger-soft)"
          : isMedium
          ? "var(--warning-soft)"
          : "var(--success-soft)",
        borderColor: isHigh
          ? "rgba(244, 63, 94, 0.3)"
          : isMedium
          ? "rgba(245, 158, 11, 0.3)"
          : "rgba(16, 185, 129, 0.3)",
      }}
    >
      <ShieldAlert
        size={28}
        style={{
          color: isHigh ? "var(--danger)" : isMedium ? "var(--warning)" : "var(--success)",
        }}
      />
      <div>
        <div
          className="sa-risk-level"
          style={{
            color: isHigh ? "var(--danger)" : isMedium ? "var(--warning)" : "var(--success)",
          }}
        >
          {risk || "Low"} Risk Level
        </div>
        <div className="sa-risk-reasons">
          {reasons.length
            ? reasons.join(" · ")
            : "Keep it up — your attendance and exam scores are on track."}
        </div>
      </div>
    </div>
  );
}

export default function StudentAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/analytics/student-dashboard")
      .then((r) => setData(r.data))
      .catch((err) => {
        console.error(err);
        setError("Unable to retrieve personalized academic analytics.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="cf-page">
        <div className="cf-loading">Calculating your academic standing…</div>
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

  const attendance = Number(data?.average_attendance ?? 0);
  const marks = Number(data?.average_marks ?? 0);
  const risk = data?.risk || "LOW";
  const reasons = data?.reasons || [];
  const recommendation = data?.recommendation || "";
  const subjects = data?.subject_performance || [];

  return (
    <div className="cf-page">
      <PageHeader
        title="My Academic Analytics"
        subtitle="Personalized performance dashboard, attendance compliance, and learning telemetry."
        badge={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={12} /> Student Portal
          </span>
        }
      />

      {/* KPI Quick Stat Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Attendance Rate"
          value={`${attendance.toFixed(1)}%`}
          icon={CalendarCheck}
          trend={attendance >= 75 ? "Target achieved (>75%)" : "Below required 75%"}
          variant={attendance >= 75 ? "success" : "warning"}
        />
        <StatCard
          label="Overall Exam Average"
          value={`${marks.toFixed(1)}%`}
          icon={GraduationCap}
          trend="Cumulative score"
          variant="default"
        />
        <StatCard
          label="Academic Standing"
          value={risk === "LOW" ? "Good Standing" : `${risk} Risk`}
          icon={Award}
          trend="AI classification"
          variant={risk === "LOW" ? "success" : "danger"}
        />
      </div>

      {/* Ring Visual Metrics */}
      <div className="sa-rings-row">
        <RingCard
          label="Attendance Compliance"
          value={attendance}
          color="var(--success)"
          icon={CalendarCheck}
          subtitle="Minimum 75% attendance mandatory"
        />
        <RingCard
          label="Average Examination Score"
          value={marks}
          color="var(--accent)"
          icon={GraduationCap}
          subtitle="Across all evaluated semesters"
        />
      </div>

      {/* AI Risk Assessment */}
      <div className="sa-section-title">
        <Sparkles size={15} color="var(--accent)" />
        AI Academic Risk Evaluation
      </div>
      <RiskCard risk={risk} reasons={reasons} />

      {recommendation && (
        <div className="sa-recommendation">
          <BookOpen size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Personalized Academic Advisory</strong>
            <p>{recommendation}</p>
          </div>
        </div>
      )}

      {/* Subject Performance Breakdown */}
      {subjects.length > 0 && (
        <div className="surface-card" style={{ padding: "20px", marginTop: "20px" }}>
          <div className="sa-section-title" style={{ marginBottom: "16px" }}>
            <BookOpen size={15} color="var(--accent)" />
            Subject-Wise Score Breakdown
          </div>
          <div className="sa-subject-list">
            {subjects.map((s, i) => {
              const val = Number(s.average_marks ?? 0);
              return (
                <div key={i} className="sa-subject-row">
                  <span className="sa-subject-name">{s.subject}</span>
                  <div className="sa-subject-bar-track">
                    <div
                      className="sa-subject-bar-fill"
                      style={{
                        width: `${Math.min(val, 100)}%`,
                        background: val < 50 ? "var(--danger)" : "var(--accent)",
                      }}
                    />
                  </div>
                  <span className="sa-subject-val">{val.toFixed(1)} / 100</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
