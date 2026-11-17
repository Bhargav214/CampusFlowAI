import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  GraduationCap,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Activity,
  Layers,
  LayoutDashboard,
  BarChart2,
  BookOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import CampusScene from "../components/dashboard/CampusScene";
import SubjectDetailPanel from "../components/SubjectDetailPanel";
import AnalyticsDetailPanel from "../components/AnalyticsDetailPanel";
import AskCampusFlowAI from "../components/dashboard/AskCampusFlowAI";
import "./DashboardPage.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // View mode: "analytics" (default, fast load) vs "3d"
  const [viewMode, setViewMode] = useState("analytics");

  // Chart view toggle: "chart" vs "list"
  const [subjectView, setSubjectView] = useState("chart");

  // Detail slide-over panels
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        if (user?.role === "parent") {
          navigate("/parent-dashboard");
          return;
        }

        if (user?.role === "student") {
          const res = await api.get("/analytics/student-dashboard");
          if (isMounted) {
            setDashboard(res.data);
            setRiskData(res.data);
          }
          return;
        }

        const [analyticsRes, riskRes] = await Promise.all([
          api.get("/analytics/dashboard").then((r) => r.data),
          api.get("/analytics/risk").then((r) => r.data),
        ]);

        if (isMounted) {
          setDashboard(analyticsRes);
          setRiskData(riskRes);
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        if (isMounted) {
          setError("Unable to connect to CampusFlow analytics services.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  const totalStudents = dashboard?.total_students ?? 0;
  const attendance = Number(dashboard?.average_attendance ?? 0);
  const averageMarks = Number(dashboard?.average_marks ?? 0);
  const highRisk = riskData?.high_risk ?? dashboard?.high_risk ?? 0;
  const mediumRisk = riskData?.medium_risk ?? dashboard?.medium_risk ?? 0;
  const lowRisk = riskData?.low_risk ?? dashboard?.low_risk ?? 0;
  const subjects = dashboard?.subject_performance || [];

  const studentsList = useMemo(() => {
    const list = [...(riskData?.students || dashboard?.risk_students || [])];
    const priority = { HIGH: 0, MEDIUM: 1, MODERATE: 1, LOW: 2 };
    return list.sort((a, b) => {
      const rA = priority[String(a.risk).toUpperCase()] ?? 3;
      const rB = priority[String(b.risk).toUpperCase()] ?? 3;
      return rA - rB;
    });
  }, [riskData, dashboard]);

  if (loading) {
    return (
      <div className="dashboard-loading-state">
        <div className="dashboard-spinner" />
        <p>Loading academic intelligence metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-card">
        <AlertTriangle size={32} style={{ margin: "0 auto 12px" }} />
        <h2>Dashboard Unavailable</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userGreetingName =
    user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User";

  // Columns for Students Requiring Attention Table
  const attentionColumns = [
    {
      header: "Roll No",
      accessor: "roll_no",
      cellStyle: { width: "120px" },
      render: (val) => <span className="roll-code-text">{val || "—"}</span>,
    },
    {
      header: "Student",
      accessor: "name",
      render: (name, row) => (
        <div className="student-meta-cell">
          <div className="student-avatar-badge">
            {(name || "S").charAt(0).toUpperCase()}
          </div>
          <span className="student-name-text">{name || "Student"}</span>
        </div>
      ),
    },
    {
      header: "Attendance",
      accessor: "attendance",
      render: (att) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {att !== undefined ? `${att}%` : "—"}
        </span>
      ),
    },
    {
      header: "Avg Marks",
      accessor: "average_marks",
      render: (marks) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {marks !== undefined ? marks : "—"}
        </span>
      ),
    },
    {
      header: "Risk Status",
      accessor: "risk",
      cellStyle: { width: "130px" },
      render: (risk) => <StatusBadge status={risk || "Low"} size="sm" />,
    },
  ];

  return (
    <div className="dashboard-page">
      {/* SaaS Page Header with View Switcher */}
      <PageHeader
        title={`${greeting}, ${userGreetingName}`}
        subtitle="Real-time academic telemetry, performance benchmarks, and student risk intervention radar."
        badge={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={12} /> AI Telemetry Active
          </span>
        }
        actions={
          <div className="segmented-control" role="tablist">
            <button
              className={`segmented-btn ${viewMode === "analytics" ? "active" : ""}`}
              onClick={() => setViewMode("analytics")}
              role="tab"
              aria-selected={viewMode === "analytics"}
            >
              <LayoutDashboard size={14} />
              <span>Analytics View</span>
            </button>
            <button
              className={`segmented-btn ${viewMode === "3d" ? "active" : ""}`}
              onClick={() => setViewMode("3d")}
              role="tab"
              aria-selected={viewMode === "3d"}
            >
              <Layers size={14} />
              <span>3D Campus Map</span>
            </button>
          </div>
        }
      />

      {/* 3D Campus Map View (Toggleable) */}
      {viewMode === "3d" && (
        <div className="campus-3d-wrapper">
          <div className="campus-3d-banner">
            <div className="campus-3d-banner-left">
              <span className="campus-3d-banner-tag">Digital Twin</span>
              <span>Interactive 3D Campus Node Intelligence</span>
            </div>
            <span className="campus-3d-banner-hint">
              Click and drag to rotate · Click building or subject nodes for deep insights
            </span>
          </div>
          <CampusScene
            totalStudents={totalStudents}
            attendance={attendance}
            averageMarks={averageMarks}
            highRisk={highRisk}
            subjectPerformance={subjects}
            onNodeClick={setSelectedNode}
            onSubjectClick={setSelectedSubject}
          />
        </div>
      )}

      {/* Ask CampusFlow AI Natural Language Query Bar */}
      <AskCampusFlowAI />

      {/* KPI Stat Cards (Crisp SaaS Metrics) */}
      <div className="dashboard-stats-grid">
        <StatCard
          label="Total Students"
          value={totalStudents}
          icon={Users}
          trend="Total enrolled"
          variant="default"
        />
        <StatCard
          label="Average Attendance"
          value={`${attendance.toFixed(1)}%`}
          icon={CalendarCheck}
          trend={attendance >= 75 ? "Optimal (>75%)" : "Needs attention (<75%)"}
          variant={attendance >= 75 ? "success" : "warning"}
        />
        <StatCard
          label="Average Marks"
          value={averageMarks.toFixed(1)}
          icon={GraduationCap}
          trend="Campus benchmark"
          variant="default"
        />
        <StatCard
          label="High-Risk Students"
          value={highRisk}
          icon={AlertTriangle}
          trend={highRisk > 0 ? `${highRisk} require intervention` : "Zero critical alerts"}
          variant={highRisk > 0 ? "danger" : "success"}
        />
      </div>

      {/* Analytics Mid Grid: Subject Telemetry + AI Risk Radar */}
      <div className="analytics-grid">
        {/* Subject Performance Panel */}
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div className="panel-title-area">
              <h2>Subject Performance</h2>
              <p>Average examination and assignment scores by course</p>
            </div>
            <div className="segmented-control">
              <button
                className={`segmented-btn ${subjectView === "chart" ? "active" : ""}`}
                onClick={() => setSubjectView("chart")}
                title="Bar Chart"
              >
                <BarChart2 size={13} />
              </button>
              <button
                className={`segmented-btn ${subjectView === "list" ? "active" : ""}`}
                onClick={() => setSubjectView("list")}
                title="Progress List"
              >
                <Activity size={13} />
              </button>
            </div>
          </div>

          <div className="dashboard-panel-body">
            {subjects.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                <BookOpen size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                <span>No subject performance records available.</span>
              </div>
            ) : subjectView === "chart" ? (
              <div className="chart-container-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjects}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="subject"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        boxShadow: "var(--shadow-md)",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "var(--accent)" }}
                      labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                      formatter={(val) => [`${Number(val).toFixed(1)} / 100`, "Avg Marks"]}
                    />
                    <Bar
                      dataKey="average_marks"
                      radius={[4, 4, 0, 0]}
                      onClick={(data) => setSelectedSubject(data)}
                      cursor="pointer"
                    >
                      {subjects.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Number(entry.average_marks) < 50 ? "var(--danger)" : "var(--accent)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="subject-list">
                {subjects.map((s, i) => {
                  const marks = Number(s.average_marks) || 0;
                  return (
                    <div
                      className="subject-item-row"
                      key={s.subject || i}
                      onClick={() => setSelectedSubject(s)}
                    >
                      <div className="subject-meta-line">
                        <span className="subject-name">{s.subject}</span>
                        <span className="subject-score">{marks.toFixed(1)}%</span>
                      </div>
                      <div className="subject-track">
                        <div
                          className="subject-fill"
                          style={{
                            width: `${Math.min(marks, 100)}%`,
                            backgroundColor: marks < 50 ? "var(--danger)" : "var(--accent)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* AI Risk Radar Overview */}
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div className="panel-title-area">
              <h2>AI Risk Radar</h2>
              <p>Predictive classification & academic alerts</p>
            </div>
            <span className="panel-header-badge">
              <Sparkles size={12} color="var(--accent)" /> ML v2
            </span>
          </div>

          <div className="dashboard-panel-body">
            <div className="risk-kpi-banner">
              <div className="risk-kpi-number">{highRisk}</div>
              <div className="risk-kpi-text">
                <strong>High-Risk Students</strong>
                <span>Prioritized for faculty advisory & support</span>
              </div>
            </div>

            <div className="risk-breakdown-list">
              {[
                { label: "High Risk", count: highRisk, cls: "high" },
                { label: "Medium Risk", count: mediumRisk, cls: "medium" },
                { label: "Low Risk", count: lowRisk, cls: "low" },
              ].map(({ label, count, cls }) => (
                <div className="risk-breakdown-row" key={label}>
                  <span className="risk-breakdown-label">{label}</span>
                  <div className="risk-breakdown-track">
                    <div
                      className={`risk-breakdown-bar ${cls}`}
                      style={{
                        width: `${totalStudents > 0 ? (count / totalStudents) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="risk-breakdown-count">{count}</span>
                </div>
              ))}
            </div>

            <div className="ai-briefing-note">
              <Sparkles size={16} className="ai-briefing-icon" />
              <div>
                <strong>Autonomous Intelligence Brief</strong>
                <p>
                  Attendance drop-offs below 75% correlate strongly with exam variance. Timely
                  mentorship before midterm evaluations reduces risk by 42%.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* At-Risk Students Action Table */}
      <section className="dashboard-table-panel">
        <div className="table-panel-header">
          <div>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Students Requiring Attention
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Immediate intervention recommended based on attendance and test performance
            </p>
          </div>
          <button
            className="table-header-action-btn"
            onClick={() => navigate("/ai-risk")}
          >
            <span>Full AI Risk Radar</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        <DataTable
          columns={attentionColumns}
          data={studentsList}
          searchPlaceholder="Search at-risk students by name, roll..."
          emptyMessage="No students currently identified at academic risk."
        />
      </section>

      {/* Slide-over Inspection Panels */}
      {selectedSubject && (
        <SubjectDetailPanel
          subject={selectedSubject}
          onClose={() => setSelectedSubject(null)}
        />
      )}
      {selectedNode && (
        <AnalyticsDetailPanel
          type={selectedNode}
          data={dashboard}
          riskData={riskData}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
