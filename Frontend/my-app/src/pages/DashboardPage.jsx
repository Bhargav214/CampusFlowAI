import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users, CalendarCheck, GraduationCap, AlertTriangle,
    TrendingUp, Sparkles, ArrowUpRight, Activity, BookOpen
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import CampusScene from "../components/dashboard/CampusScene";
import SubjectDetailPanel from "../components/SubjectDetailPanel";
import AnalyticsDetailPanel from "../components/AnalyticsDetailPanel";
import "./DashboardPage.css";

function StatCard({ title, value, subtitle, icon: Icon, type }) {
    return (
        <div className={"stat-card " + type}>
            <div className="stat-card-top">
                <div className="stat-icon"><Icon size={18} strokeWidth={2} /></div>
                <div className="stat-trend"><TrendingUp size={11} /> Academic</div>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-title">{title}</div>
            <div className="stat-subtitle">{subtitle}</div>
        </div>
    );
}

function RiskBadge({ risk }) {
    const v = String(risk || "").toUpperCase();
    return (
        <span className={"risk-badge " + v.toLowerCase()}>
            <span className="risk-dot" />
            {v}
        </span>
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                if (user?.role === "parent") { navigate("/parent-dashboard"); return; }
                if (user?.role === "student") {
                    const r = await api.get("/analytics/student-dashboard");
                    setDashboard(r.data); setRiskData(r.data); return;
                }
                const [analytics, risk] = await Promise.all([
                    api.get("/analytics/dashboard").then(r => r.data),
                    api.get("/analytics/risk").then(r => r.data)
                ]);
                setDashboard(analytics); setRiskData(risk);
            } catch (err) {
                console.error("Dashboard Load Error:", err);
                setError("Unable to connect to CampusFlow analytics.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Loading academic intelligence...</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="dashboard-error">
                <AlertTriangle size={28} />
                <h2>Dashboard unavailable</h2>
                <p>{error}</p>
            </div>
        );
    }

    const totalStudents = dashboard?.total_students ?? 0;
    const attendance = dashboard?.average_attendance ?? 0;
    const averageMarks = dashboard?.average_marks ?? 0;
    const highRisk = riskData?.high_risk ?? dashboard?.high_risk ?? 0;
    const subjects = dashboard?.subject_performance || [];
    const students = [...(riskData?.students || dashboard?.risk_students || [])].sort((a, b) => {
        const o = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (o[String(a.risk).toUpperCase()] ?? 3) - (o[String(b.risk).toUpperCase()] ?? 3);
    });

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <div className="eyebrow"><Sparkles size={12} /> AI Academic Intelligence</div>
                    <h1>{greeting}, {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}</h1>
                    <p>Real-time insights into student performance, attendance and academic risk.</p>
                </div>
                <div className="dashboard-status">
                    <span className="status-pulse" />
                    Live data
                </div>
            </div>

            {/* 3D Campus Scene */}
            <div className="mb-8">
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

            {/* KPI Cards */}
            <div className="stats-grid">
                <StatCard title="Total Students" value={totalStudents} subtitle="Students enrolled" icon={Users} type="blue" />
                <StatCard title="Avg. Attendance" value={attendance + "%"} subtitle="Across all students" icon={CalendarCheck} type="green" />
                <StatCard title="Avg. Marks" value={averageMarks} subtitle="Overall academic score" icon={GraduationCap} type="purple" />
                <StatCard title="High-Risk Students" value={highRisk} subtitle="Require immediate attention" icon={AlertTriangle} type="red" />
            </div>

            {/* Analytics Grid */}
            <div className="analytics-grid">
                <section className="panel">
                    <div className="panel-header">
                        <div>
                            <h2>Subject Performance</h2>
                            <p>Average marks by subject</p>
                        </div>
                        <div className="panel-icon"><Activity size={16} /></div>
                    </div>
                    <div className="subject-list">
                        {subjects.length === 0 ? (
                            <div style={{padding:"24px",textAlign:"center",color:"var(--text-muted)",fontSize:"12px"}}>
                                <BookOpen size={28} style={{margin:"0 auto 10px",opacity:0.3}} />
                                No subject performance data yet
                            </div>
                        ) : subjects.map((s, i) => {
                            const marks = Number(s.average_marks) || 0;
                            return (
                                <div className="subject-row" key={s.subject || i} onClick={() => setSelectedSubject(s)}>
                                    <div className="subject-info">
                                        <span>{s.subject}</span>
                                        <strong>{marks.toFixed(1)}</strong>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: Math.min(marks, 100) + "%" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="panel risk-panel">
                    <div className="panel-header">
                        <div>
                            <h2>AI Risk Overview</h2>
                            <p>Students requiring attention</p>
                        </div>
                        <div className="panel-icon warning"><Sparkles size={16} /></div>
                    </div>
                    <div className="risk-summary">
                        <div className="risk-number">{highRisk}</div>
                        <div>
                            <strong>High-risk students</strong>
                            <span>AI-assisted classification</span>
                        </div>
                    </div>
                    <div className="risk-bars">
                        {[
                            { label: "High", count: riskData?.high_risk ?? 0, cls: "high" },
                            { label: "Medium", count: riskData?.medium_risk ?? 0, cls: "medium" },
                            { label: "Low", count: riskData?.low_risk ?? 0, cls: "low" },
                        ].map(({ label, count, cls }) => (
                            <div className="risk-bar-row" key={label}>
                                <span>{label}</span>
                                <div className="risk-track">
                                    <div className={"risk-fill " + cls} style={{ width: (totalStudents ? (count / totalStudents) * 100 : 0) + "%" }} />
                                </div>
                                <strong>{count}</strong>
                            </div>
                        ))}
                    </div>
                    <div className="ai-insight">
                        <Sparkles size={16} />
                        <div>
                            <strong>AI Insight</strong>
                            <p>Students with low attendance and marks are prioritized for intervention.</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* At-Risk Students Table */}
            <section className="panel students-panel">
                <div className="panel-header">
                    <div>
                        <h2>Students Requiring Attention</h2>
                        <p>AI-identified academic risk</p>
                    </div>
                    <button className="view-button" onClick={() => navigate("/ai-risk")}>
                        View full analysis <ArrowUpRight size={13} />
                    </button>
                </div>
                <div className="table-wrapper">
                    <table className="risk-table">
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Student</th>
                                <th>Attendance</th>
                                <th>Avg. Marks</th>
                                <th>Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr><td colSpan="5" style={{padding:"32px",textAlign:"center",color:"var(--text-muted)",fontSize:"12px"}}>No at-risk student data available</td></tr>
                            ) : students.slice(0, 10).map(s => (
                                <tr key={s.student_id || s.roll_no}>
                                    <td className="roll-cell">{s.roll_no}</td>
                                    <td>
                                        <div className="student-cell">
                                            <div className="student-avatar">{(s.name || "S").charAt(0).toUpperCase()}</div>
                                            <span>{s.name || "Student"}</span>
                                        </div>
                                    </td>
                                    <td><span className="attendance-value">{s.attendance}%</span></td>
                                    <td>{s.average_marks}</td>
                                    <td><RiskBadge risk={s.risk} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {selectedSubject && <SubjectDetailPanel subject={selectedSubject} onClose={() => setSelectedSubject(null)} />}
            {selectedNode && <AnalyticsDetailPanel type={selectedNode} data={dashboard} riskData={riskData} onClose={() => setSelectedNode(null)} />}
        </div>
    );
}
