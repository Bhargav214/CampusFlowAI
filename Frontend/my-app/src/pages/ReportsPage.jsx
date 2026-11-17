import React, { useState, useEffect } from "react";
import {
  FileText,
  CalendarCheck,
  GraduationCap,
  ShieldAlert,
  Users,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Printer,
  Sparkles,
  X,
  FileSpreadsheet,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import "./Pages.css";

const REPORTS = [
  {
    id: "attendance",
    title: "Attendance Report",
    description:
      "Complete attendance records for all students — classes held, present days, and percentage compliance.",
    icon: CalendarCheck,
    endpoint: "/reports/attendance",
    filename: "attendance_report.pdf",
    category: "Attendance",
    variant: "success",
  },
  {
    id: "marks",
    title: "Academic Marks Report",
    description:
      "Student-wise academic performance across all subjects and assessment types with grade distribution.",
    icon: GraduationCap,
    endpoint: "/reports/marks",
    filename: "marks_report.pdf",
    category: "Examination",
    variant: "default",
  },
  {
    id: "risk",
    title: "AI Risk Audit Report",
    description:
      "AI-classified academic risk audit based on attendance and performance thresholds with causal drivers.",
    icon: ShieldAlert,
    endpoint: "/reports/risk",
    filename: "ai_risk_report.pdf",
    category: "Intelligence",
    variant: "danger",
  },
  {
    id: "students",
    title: "Cohort Summary Report",
    description:
      "Comprehensive student-wise roster summary including department, semester, attendance %, and benchmark.",
    icon: Users,
    endpoint: "/reports/students",
    filename: "student_report.pdf",
    category: "Roster",
    variant: "warning",
  },
];

/* ── Printable Official Institutional Report Modal ── */
function PrintableOfficialReportModal({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, riskRes] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/analytics/risk"),
        ]);
        setData({
          stats: dashRes.data,
          students: riskRes.data?.students || [],
        });
      } catch (err) {
        console.error("Failed to load report data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="cf-modal-overlay"
      style={{ zIndex: 9999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="cf-modal printable-modal-content"
        style={{
          maxWidth: "880px",
          width: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#FFFFFF",
          color: "#0F172A",
          padding: "36px",
        }}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "14px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Printer size={18} color="#4F46E5" />
            <strong style={{ fontSize: "14px", color: "#0F172A" }}>
              Official Institutional Report Preview
            </strong>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handlePrint}
              style={{
                background: "#4F46E5",
                color: "#FFFFFF",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: "#F1F5F9",
                color: "#475569",
                border: "1px solid #CBD5E1",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 size={24} className="cf-spin" style={{ margin: "0 auto 10px" }} />
            <span>Compiling academic dossier...</span>
          </div>
        ) : (
          <div id="printable-official-dossier">
            {/* Formal College Header */}
            <div
              style={{
                borderBottom: "2px solid #0F172A",
                paddingBottom: "14px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "1.2px",
                  color: "#4F46E5",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                CampusFlow AI · Academic Data Intelligence
              </div>
              <h1
                style={{
                  margin: "0 0 4px",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0F172A",
                  letterSpacing: "-0.3px",
                }}
              >
                CAMPUSFLOW AI — ACADEMIC ANALYTICS & MANAGEMENT REPORT
              </h1>
              <div style={{ fontSize: "12px", color: "#475569" }}>
                Affiliated College of Computing & Management · Bengaluru, Karnataka · Academic Term 2026–2027
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                Generated: {currentDateStr} · Autonomous Telemetry & Risk Mitigation Dossier
              </div>
            </div>

            {/* Institutional Summary KPIs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                marginBottom: "24px",
                padding: "12px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
              }}
            >
              <div>
                <span style={{ display: "block", fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>
                  Enrolled Students
                </span>
                <strong style={{ fontSize: "16px", color: "#0F172A" }}>
                  {data?.stats?.total_students || data?.students?.length || 0}
                </strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>
                  Avg Attendance
                </span>
                <strong style={{ fontSize: "16px", color: "#0F172A" }}>
                  {data?.stats?.average_attendance ? `${Number(data.stats.average_attendance).toFixed(1)}%` : "—"}
                </strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>
                  Avg Academic Score
                </span>
                <strong style={{ fontSize: "16px", color: "#0F172A" }}>
                  {data?.stats?.average_marks ? `${Number(data.stats.average_marks).toFixed(1)}%` : "—"}
                </strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>
                  High-Risk Flagged
                </span>
                <strong style={{ fontSize: "16px", color: "#EF4444" }}>
                  {data?.students?.filter((s) => s.risk === "HIGH").length || 0} Students
                </strong>
              </div>
            </div>

            {/* Official Student Telemetry Table */}
            <h3 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 8px", color: "#0F172A" }}>
              Student Academic Standing & Early Warning Roster
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
                marginBottom: "36px",
              }}
            >
              <thead>
                <tr style={{ background: "#F1F5F9", borderBottom: "2px solid #CBD5E1" }}>
                  <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700 }}>Roll Number</th>
                  <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700 }}>Student Name</th>
                  <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>Attendance %</th>
                  <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>Avg Marks %</th>
                  <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700 }}>Risk Level</th>
                  <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700 }}>Advisory / Driver</th>
                </tr>
              </thead>
              <tbody>
                {data?.students?.map((s, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #E2E8F0",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                    }}
                  >
                    <td style={{ padding: "6px", fontFamily: "monospace", fontWeight: 600 }}>{s.roll_no}</td>
                    <td style={{ padding: "6px", fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{s.attendance}%</td>
                    <td style={{ padding: "6px", textAlign: "right" }}>{s.average_marks}%</td>
                    <td
                      style={{
                        padding: "6px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: s.risk === "HIGH" ? "#EF4444" : s.risk === "MEDIUM" ? "#D97706" : "#059669",
                      }}
                    >
                      {s.risk}
                    </td>
                    <td style={{ padding: "6px", fontSize: "10px", color: "#475569" }}>
                      {Array.isArray(s.reasons) && s.reasons.length > 0
                        ? s.reasons[0]
                        : s.recommendation
                        ? s.recommendation.slice(0, 50) + "..."
                        : "Normal trajectory"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Official Signature Section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "24px",
                marginTop: "40px",
                paddingTop: "24px",
                borderTop: "1px dashed #CBD5E1",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ height: "40px", borderBottom: "1px solid #94A3B8", marginBottom: "6px" }} />
                <strong style={{ display: "block", fontSize: "11px", color: "#0F172A" }}>
                  Faculty Advisor / Coordinator
                </strong>
                <span style={{ fontSize: "10px", color: "#64748B" }}>Department Committee</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ height: "40px", borderBottom: "1px solid #94A3B8", marginBottom: "6px" }} />
                <strong style={{ display: "block", fontSize: "11px", color: "#0F172A" }}>
                  Head of Department (HoD)
                </strong>
                <span style={{ fontSize: "10px", color: "#64748B" }}>Academic Affairs</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ height: "40px", borderBottom: "1px solid #94A3B8", marginBottom: "6px" }} />
                <strong style={{ display: "block", fontSize: "11px", color: "#0F172A" }}>
                  Principal / Academic Dean
                </strong>
                <span style={{ fontSize: "10px", color: "#64748B" }}>Institutional Authority</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS for Print Styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-official-dossier,
          #printable-official-dossier * {
            visibility: visible;
          }
          #printable-official-dossier {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .cf-modal-overlay {
            background: white !important;
            position: static !important;
          }
          .printable-modal-content {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function ReportCardItem({ report }) {
  const [pdfStatus, setPdfStatus] = useState("idle");
  const [csvStatus, setCsvStatus] = useState("idle");

  const downloadPDF = async () => {
    setPdfStatus("loading");
    try {
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

      setPdfStatus("success");
      setTimeout(() => setPdfStatus("idle"), 2500);
    } catch {
      setPdfStatus("error");
      setTimeout(() => setPdfStatus("idle"), 2500);
    }
  };

  const downloadCSV = async () => {
    setCsvStatus("loading");
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      let csvContent = "";
      let filename = `CampusFlow_${report.id}_${dateStr}.csv`;

      if (report.id === "attendance" || report.id === "students") {
        const res = await api.get("/student/");
        const students = Array.isArray(res.data) ? res.data : [];
        const headers = ["Roll Number", "First Name", "Last Name", "Email", "Department", "Semester"];
        const rows = students.map((s) => [
          s.roll_number || "",
          s.first_name || "",
          s.last_name || "",
          s.email || "",
          s.department || "",
          s.semester || "",
        ]);
        csvContent =
          "data:text/csv;charset=utf-8," +
          [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join(
            "\n"
          );
      } else if (report.id === "marks") {
        const res = await api.get("/marks/");
        const marks = Array.isArray(res.data) ? res.data : [];
        const headers = ["Student ID", "Subject ID", "Exam Type", "Marks Obtained", "Max Marks", "Grade"];
        const rows = marks.map((m) => [
          m.student_id,
          m.subject_id,
          m.exam_type || "",
          m.marks_obtained,
          m.max_marks,
          m.grade || "",
        ]);
        csvContent =
          "data:text/csv;charset=utf-8," +
          [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join(
            "\n"
          );
      } else {
        // risk report
        const res = await api.get("/analytics/risk");
        const students = res.data?.students || [];
        const headers = ["Roll Number", "Student Name", "Attendance %", "Marks %", "Risk Status", "Risk Score", "Primary Reason"];
        const rows = students.map((s) => [
          s.roll_no || "",
          s.name || "",
          s.attendance !== undefined ? `${s.attendance}%` : "",
          s.average_marks !== undefined ? `${s.average_marks}%` : "",
          s.risk || "",
          s.risk_score || "",
          Array.isArray(s.reasons) ? s.reasons.join("; ") : s.recommendation || "",
        ]);
        csvContent =
          "data:text/csv;charset=utf-8," +
          [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join(
            "\n"
          );
      }

      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCsvStatus("success");
      setTimeout(() => setCsvStatus("idle"), 2500);
    } catch {
      setCsvStatus("error");
      setTimeout(() => setCsvStatus("idle"), 2500);
    }
  };

  const Icon = report.icon;

  return (
    <div className="report-card">
      <div className="report-card-top">
        <div className="report-icon">
          <Icon size={20} />
        </div>
        <span className="report-type-tag">{report.category}</span>
      </div>

      <h3 className="report-title">{report.title}</h3>
      <p className="report-desc">{report.description}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "auto" }}>
        <button
          className={`report-download-btn ${pdfStatus}`}
          onClick={downloadPDF}
          disabled={pdfStatus === "loading"}
          style={{ width: "100%", padding: "8px" }}
          title="Download formatted PDF documentation"
        >
          {pdfStatus === "loading" && <Loader2 size={13} className="cf-spin" />}
          {pdfStatus === "success" && <CheckCircle size={13} style={{ color: "var(--success)" }} />}
          {pdfStatus === "error" && <AlertTriangle size={13} style={{ color: "var(--danger)" }} />}
          {pdfStatus === "idle" && <Download size={13} />}
          <span style={{ fontSize: "11px" }}>
            {pdfStatus === "loading" ? "PDF..." : pdfStatus === "success" ? "Done" : "Download PDF"}
          </span>
        </button>

        <button
          className="cf-secondary-btn"
          onClick={downloadCSV}
          disabled={csvStatus === "loading"}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
          title="Export as CSV spreadsheet"
        >
          {csvStatus === "loading" ? (
            <Loader2 size={13} className="cf-spin" />
          ) : (
            <FileSpreadsheet size={13} />
          )}
          <span>{csvStatus === "loading" ? "CSV..." : csvStatus === "success" ? "Done" : "Export CSV"}</span>
        </button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [showPrintModal, setShowPrintModal] = useState(false);

  return (
    <div className="cf-page">
      <PageHeader
        title="Institutional Reports & Export"
        subtitle="Generate certified academic PDF documentation and raw CSV exports for compliance, examinations, and faculty advisories."
        badge="Official PDFs & CSV"
        actions={
          <button
            className="cf-primary-btn"
            onClick={() => setShowPrintModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Printer size={15} />
            <span>Generate Official Report (PDF / Print)</span>
          </button>
        }
      />

      {/* Overview Stat Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Attendance Documentation"
          value="PDF / CSV Ready"
          icon={CalendarCheck}
          trend="Session logs"
          variant="success"
        />
        <StatCard
          label="Examinations & Grades"
          value="PDF / CSV Ready"
          icon={GraduationCap}
          trend="Midterm & Final marks"
          variant="default"
        />
        <StatCard
          label="Risk Classification"
          value="PDF / CSV Ready"
          icon={ShieldAlert}
          trend="ML early warning"
          variant="danger"
        />
        <StatCard
          label="Cohort Census"
          value="PDF / CSV Ready"
          icon={Users}
          trend="Full student roster"
          variant="warning"
        />
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {REPORTS.map((report) => (
          <ReportCardItem key={report.id} report={report} />
        ))}
      </div>

      {/* Printable Institutional Modal */}
      {showPrintModal && (
        <PrintableOfficialReportModal onClose={() => setShowPrintModal(false)} />
      )}
    </div>
  );
}
