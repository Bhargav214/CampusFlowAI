import { useState } from "react";
import {
  FileText,
  CalendarCheck,
  GraduationCap,
  ShieldAlert,
  Users,
  Download,
  CheckCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import api from "../services/api";
import "./Pages.css";

const REPORTS = [
  {
    id: "attendance",
    title: "Attendance Report",
    description:
      "Complete attendance records for all students — classes held, present days, and attendance percentage.",
    icon: CalendarCheck,
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    endpoint: "/reports/attendance",
    filename: "attendance_report.pdf",
  },
  {
    id: "marks",
    title: "Academic Marks Report",
    description:
      "Student-wise academic performance across all subjects and assessment types with average marks.",
    icon: GraduationCap,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
    endpoint: "/reports/marks",
    filename: "marks_report.pdf",
  },
  {
    id: "risk",
    title: "AI Risk Report",
    description:
      "AI-classified academic risk levels for every student based on attendance and performance thresholds.",
    icon: ShieldAlert,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    endpoint: "/reports/risk",
    filename: "ai_risk_report.pdf",
  },
  {
    id: "students",
    title: "Full Student Report",
    description:
      "Comprehensive student-wise summary including department, semester, attendance % and average marks.",
    icon: Users,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    endpoint: "/reports/students",
    filename: "student_report.pdf",
  },
];

function ReportCard({ report }) {
  const [status, setStatus] = useState("idle");

  const download = async () => {
    setStatus("loading");
    try {
      // Use the centralized api client so VITE_API_URL and Authorization
      // headers are handled automatically — no manual token extraction needed.
      const response = await api.get(report.endpoint, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };


  const Icon = report.icon;

  return (
    <div className="report-card">
      <div className="report-card-top">
        <div
          className="report-icon"
          style={{ background: report.bg, color: report.color }}
        >
          <Icon size={22} />
        </div>
        <span className="report-type-tag">PDF</span>
      </div>

      <h3 className="report-title">{report.title}</h3>
      <p className="report-desc">{report.description}</p>

      <button
        className={`report-download-btn ${status}`}
        onClick={download}
        disabled={status === "loading"}
      >
        {status === "idle" && (
          <>
            <Download size={15} />
            Download PDF
          </>
        )}
        {status === "loading" && (
          <>
            <span className="cf-spin-sm" />
            Generating…
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={15} />
            Downloaded!
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle size={15} />
            Failed — Retry
          </>
        )}
      </button>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="cf-page">
      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">
            <Sparkles
              size={12}
              style={{ display: "inline", marginRight: 6 }}
            />
            REPORTING CENTER
          </div>
          <h1 className="cf-page-title">Reports</h1>
          <p className="cf-page-subtitle">
            Generate and download professional PDF reports — attendance, marks
            and AI risk analysis in one click.
          </p>
        </div>
        <div className="reports-live-badge">
          <span className="status-dot" />
          Live Data
        </div>
      </div>

      {/* Info banner */}
      <div className="reports-banner">
        <FileText size={18} />
        <span>
          All reports are generated in real-time from the latest database
          records and exported as print-ready PDF documents.
        </span>
      </div>

      {/* Cards */}
      <div className="reports-grid">
        {REPORTS.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
    </div>
  );
}
