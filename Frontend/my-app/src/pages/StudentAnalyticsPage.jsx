import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  BookOpen,
} from "lucide-react";
import api from "../services/api";
import "./Pages.css";


/* ─── SVG arc progress ring ─────────────────────────────────── */
function ArcRing({ pct, size = 140, color = "#6366f1" }) {
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
        stroke="rgba(255,255,255,0.06)"
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
        fill="white"
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
  const map = {
    HIGH: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "High Risk" },
    MEDIUM: {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      label: "Medium Risk",
    },
    LOW: {
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      label: "Low Risk",
    },
  };
  const cfg = map[String(risk).toUpperCase()] || map.LOW;
  return (
    <div className="sa-risk-card" style={{ background: cfg.bg, borderColor: cfg.color + "40" }}>
      <ShieldAlert size={28} style={{ color: cfg.color }} />
      <div>
        <div className="sa-risk-level" style={{ color: cfg.color }}>
          {cfg.label}
        </div>
        <div className="sa-risk-reasons">
          {reasons.length
            ? reasons.join(" · ")
            : "Keep it up — no major concerns detected."}
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
      .catch(() => setError("Unable to load your analytics. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="cf-page">
        <div className="cf-loading">Loading your academic snapshot…</div>
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
  const me = data?.risk_students?.[0];
  const risk = me?.risk ?? "LOW";
  const reasons = me?.reasons ?? [];
  const recommendation = me?.recommendation ?? "";

  /* classes needed for 75% */
  const classesNeeded =
    attendance < 75
      ? Math.ceil((75 * (me?.total_classes || 60) - (me?.present || 0)) / 25)
      : 0;

  return (
    <div className="cf-page">
      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">
            <Sparkles size={12} style={{ display: "inline", marginRight: 6 }} />
            MY ACADEMIC SNAPSHOT
          </div>
          <h1 className="cf-page-title">My Analytics</h1>
          <p className="cf-page-subtitle">
            Your personal attendance, performance, and AI risk assessment — all
            in one place.
          </p>
        </div>
        {attendance >= 75 ? (
          <div
            className="reports-live-badge"
            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
          >
            <TrendingUp size={14} />
            On Track
          </div>
        ) : (
          <div
            className="reports-live-badge"
            style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
          >
            <TrendingDown size={14} />
            Needs Attention
          </div>
        )}
      </div>

      {/* Attendance warning */}
      {attendance < 75 && classesNeeded > 0 && (
        <div
          className="reports-banner"
          style={{
            background: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.25)",
            color: "#ef4444",
          }}
        >
          <CalendarCheck size={18} />
          <span>
            Your attendance is below 75%. You need approximately{" "}
            <strong>{classesNeeded} more consecutive present days</strong> to
            meet the minimum requirement.
          </span>
        </div>
      )}

      {/* Ring cards */}
      <div className="sa-rings-row">
        <RingCard
          label="Attendance"
          value={attendance}
          color="#38bdf8"
          icon={CalendarCheck}
          subtitle={attendance >= 75 ? "✓ Above threshold" : "Below 75% threshold"}
        />
        <RingCard
          label="Academic Score"
          value={marks}
          color="#6366f1"
          icon={GraduationCap}
          subtitle={marks >= 50 ? "✓ Passing" : "Below passing threshold"}
        />
      </div>

      {/* Risk card */}
      <div className="sa-section-title">
        <ShieldAlert size={17} />
        AI Risk Assessment
      </div>
      <RiskCard risk={risk} reasons={reasons} />

      {/* Recommendation */}
      {recommendation && (
        <div className="sa-recommendation">
          <Sparkles size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
          <div>
            <strong>AI Recommendation</strong>
            <p>{recommendation}</p>
          </div>
        </div>
      )}

      {/* Subject performance if any */}
      {(data?.subject_performance ?? []).length > 0 && (
        <>
          <div className="sa-section-title">
            <BookOpen size={17} />
            Subject Performance
          </div>
          <div className="sa-subject-list">
            {data.subject_performance.map((s, i) => {
              const pct = Math.min(Number(s.average_marks || 0), 100);
              return (
                <div key={i} className="sa-subject-row">
                  <span className="sa-subject-name">{s.subject}</span>
                  <div className="sa-subject-bar-track">
                    <div
                      className="sa-subject-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <strong className="sa-subject-val">
                    {pct.toFixed(1)}%
                  </strong>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
