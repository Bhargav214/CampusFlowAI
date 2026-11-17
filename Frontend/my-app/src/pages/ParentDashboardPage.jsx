/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ShieldAlert,
  Users,
  CalendarCheck,
  GraduationCap,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  UserCheck,
  Sparkles,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import "./Pages.css";

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Tab State: overview, attendance, marks, notifications
  const [activeTab, setActiveTab] = useState("overview");

  // Student specific detailed data
  const [attendanceData, setAttendanceData] = useState(null);
  const [marksData, setMarksData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchParentDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/parent/dashboard");
      setDashboardData(res.data);
      if (res.data?.students?.length > 0) {
        setSelectedStudentId(res.data.students[0].student_id);
      }
    } catch (err) {
      console.error("Failed to load parent dashboard:", err);
      setError(err.response?.data?.detail || "Failed to load parent portal dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/parent/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.warn("Could not fetch parent notifications:", err);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    if (!studentId) return;
    try {
      const [attRes, marksRes, analyticsRes] = await Promise.all([
        api.get(`/parent/students/${studentId}/attendance`),
        api.get(`/parent/students/${studentId}/marks`),
        api.get(`/parent/students/${studentId}/analytics`),
      ]);
      setAttendanceData(attRes.data);
      setMarksData(marksRes.data);
      setAnalyticsData(analyticsRes.data);
    } catch (err) {
      console.error("Failed to load student details:", err);
    }
  };

  useEffect(() => {
    fetchParentDashboard();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentDetails(selectedStudentId);
    }
  }, [selectedStudentId]);

  const markNotifRead = async (notifId) => {
    try {
      await api.patch(`/parent/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const currentStudent = dashboardData?.students?.find(
    (s) => s.student_id === selectedStudentId
  );

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="cf-page">
      <PageHeader
        title="Parent Supervision Portal"
        subtitle={`Welcome, Guardian (${user?.email || "Parent"}). Monitor academic progress, attendance records, and risk intervention alerts for your linked student.`}
        badge={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={12} /> Guardian Advisory
          </span>
        }
        actions={
          dashboardData?.students?.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Student:</span>
              <select
                className="cf-select"
                value={selectedStudentId || ""}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              >
                {dashboardData.students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.first_name} {s.last_name} ({s.roll_number})
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />

      {loading ? (
        <div className="cf-loading">Loading student academic telemetry…</div>
      ) : error ? (
        <div className="cf-form-alert error">{error}</div>
      ) : !dashboardData || dashboardData.students?.length === 0 ? (
        <div className="surface-card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <Users size={36} style={{ margin: "0 auto 12px", color: "var(--text-muted)", opacity: 0.5 }} />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            No Approved Student Linked Yet
          </h3>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
            Your guardian account is active, but an administrator has not yet authorized a link to your student's record.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Summary Cards */}
          {currentStudent && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <StatCard
                label="Linked Student"
                value={`${currentStudent.first_name} ${currentStudent.last_name}`}
                icon={Users}
                trend={`Roll: ${currentStudent.roll_number || "—"}`}
                variant="default"
              />
              <StatCard
                label="Attendance Rate"
                value={`${currentStudent.attendance_percentage}%`}
                icon={CalendarCheck}
                trend={currentStudent.attendance_percentage >= 75 ? "Target achieved (>75%)" : "Below required 75%"}
                variant={currentStudent.attendance_percentage >= 75 ? "success" : "warning"}
              />
              <StatCard
                label="Average Marks"
                value={`${currentStudent.academic_percentage}%`}
                icon={GraduationCap}
                trend="Overall examination average"
                variant="default"
              />
              <StatCard
                label="AI Risk Classification"
                value={`${currentStudent.risk_level} Risk`}
                icon={ShieldAlert}
                trend="Automated evaluation"
                variant={currentStudent.risk_level === "HIGH" ? "danger" : currentStudent.risk_level === "MEDIUM" ? "warning" : "success"}
              />
            </div>
          )}

          {/* Tab Navigation */}
          <div className="segmented-control" style={{ marginBottom: "20px" }}>
            <button
              onClick={() => setActiveTab("overview")}
              className={`segmented-btn ${activeTab === "overview" ? "active" : ""}`}
            >
              <span>Overview & Risk Insights</span>
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`segmented-btn ${activeTab === "attendance" ? "active" : ""}`}
            >
              <span>Attendance Supervision</span>
            </button>
            <button
              onClick={() => setActiveTab("marks")}
              className={`segmented-btn ${activeTab === "marks" ? "active" : ""}`}
            >
              <span>Academic Marks</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`segmented-btn ${activeTab === "notifications" ? "active" : ""}`}
            >
              <Bell size={13} />
              <span>Notifications {unreadNotifs > 0 ? `(${unreadNotifs})` : ""}</span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {attendanceData?.warning && (
                <div className="cf-form-alert error">
                  <AlertTriangle size={15} style={{ display: "inline-block", marginRight: "6px" }} />
                  <strong>Attendance Alert: </strong>{attendanceData.warning}
                </div>
              )}

              {analyticsData && (
                <div className="surface-card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                      AI Risk Analysis & Academic Insights
                    </h3>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Analysis Date: {analyticsData.analysis_date}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                        Risk Status & Factors
                      </span>
                      <div style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Calculated Risk Score</span>
                          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>
                            {analyticsData.risk_score} / 100
                          </div>
                        </div>
                        <StatusBadge status={analyticsData.risk_level} size="md" />
                      </div>

                      {analyticsData.contributing_reasons?.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {analyticsData.contributing_reasons.map((reason, idx) => (
                            <div key={idx} style={{ padding: "8px 10px", background: "var(--bg-elevated)", borderRadius: "6px", fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                              <AlertTriangle size={14} color="var(--warning)" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: "10px", background: "var(--success-soft)", color: "var(--success)", borderRadius: "6px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <CheckCircle2 size={16} />
                          <span>Student is performing within optimal parameters.</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                        Recommended Guidance for Parents
                      </span>
                      <div style={{ padding: "14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "12px" }}>
                        {analyticsData.suggested_actions}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                        <Info size={13} style={{ display: "inline-block", marginRight: "4px", verticalAlign: "middle" }} />
                        {analyticsData.disclaimer}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Attendance Supervision */}
          {activeTab === "attendance" && attendanceData && (
            <div className="surface-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Subject-Wise Attendance Supervision
                </h3>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>
                  Overall: {attendanceData.overall_percentage}% ({attendanceData.present_classes}/{attendanceData.total_classes} lectures)
                </span>
              </div>

              {attendanceData.subject_breakdown?.length === 0 ? (
                <p style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No attendance records recorded yet.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                  {attendanceData.subject_breakdown.map((subj, idx) => (
                    <div key={idx} style={{ padding: "12px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                        <span style={{ color: "var(--text-primary)" }}>{subj.subject_name}</span>
                        <span style={{ color: subj.percentage >= 75 ? "var(--success)" : "var(--warning)" }}>
                          {subj.percentage}%
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "var(--bg-secondary)", borderRadius: "99px", overflow: "hidden", marginBottom: "6px" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(subj.percentage, 100)}%`,
                            background: subj.percentage >= 75 ? "var(--success)" : "var(--warning)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Attended {subj.present_classes} of {subj.total_classes} conducted classes
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Marks */}
          {activeTab === "marks" && marksData && (
            <div className="surface-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Academic Performance & Grade Records
                </h3>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)" }}>
                  Cumulative Marks: {marksData.overall_percentage}%
                </span>
              </div>

              {marksData.subject_marks?.length === 0 ? (
                <p style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No examination marks recorded yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="cf-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Exam / Assessment</th>
                        <th>Marks Obtained</th>
                        <th>Max Marks</th>
                        <th style={{ textAlign: "right" }}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marksData.subject_marks.map((m, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{m.subject_name}</td>
                          <td style={{ color: "var(--text-muted)" }}>{m.exam_type}</td>
                          <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{m.marks_obtained}</td>
                          <td style={{ color: "var(--text-muted)" }}>{m.max_marks}</td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--accent)" }}>
                            {m.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Notifications */}
          {activeTab === "notifications" && (
            <div className="surface-card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                Parent Supervision Notifications
              </h3>

              {notifications.length === 0 ? (
                <p style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No notifications recorded.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "12px 14px",
                        background: n.is_read ? "var(--bg-card)" : "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: n.is_read ? 500 : 700, color: "var(--text-primary)" }}>
                          {n.message}
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {n.created_at || "Recent notification"}
                        </span>
                      </div>
                      {!n.is_read && (
                        <button
                          className="cf-secondary-btn"
                          style={{ fontSize: "11px", padding: "3px 8px" }}
                          onClick={() => markNotifRead(n.id)}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
