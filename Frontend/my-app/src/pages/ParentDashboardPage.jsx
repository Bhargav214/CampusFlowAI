/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
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
} from "lucide-react";
import "./Pages.css";

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState("overview"); // overview, attendance, marks, risk, notifications

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

  return (
    <div className="space-y-6">
      {/* Header & Student Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
        <div>
          <span className="px-2.5 py-1 text-xs font-semibold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-md">
            Parent Supervision Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-indigo-400" />
            Welcome, Guardian ({user?.email})
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor academic progress, attendance records, and risk assessments for your linked student(s).
          </p>
        </div>

        {dashboardData?.students?.length > 1 && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select Linked Student:</label>
            <select
              value={selectedStudentId || ""}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {dashboardData.students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.first_name} {s.last_name} ({s.roll_number})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl">
          Loading parent portal...
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : !dashboardData || dashboardData.students?.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Approved Student Linked</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Your parent account is active, but an administrator has not yet approved a link to your student's record. Please contact institution administration.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Summary Cards */}
          {currentStudent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400">Student Profile</span>
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-lg font-bold text-slate-100 mt-2">
                  {currentStudent.first_name} {currentStudent.last_name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Roll No: <span className="font-mono text-slate-300">{currentStudent.roll_number}</span> | {currentStudent.department || "General"}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400">Attendance Rate</span>
                  <CalendarCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className={`text-2xl font-bold mt-2 ${currentStudent.attendance_percentage >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                  {currentStudent.attendance_percentage}%
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Threshold: <span className="text-slate-300">75% required</span>
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400">Academic Score</span>
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400 mt-2">
                  {currentStudent.academic_percentage}%
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Overall marks average</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400">AI Risk Status</span>
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      currentStudent.risk_level === "HIGH"
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : currentStudent.risk_level === "MEDIUM"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}
                  >
                    {currentStudent.risk_level} RISK
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Automated model metric</p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              Overview & Risk Insights
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === "attendance"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              Attendance Supervision
            </button>

            <button
              onClick={() => setActiveTab("marks")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === "marks"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              Academic Marks
            </button>

            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "notifications"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifications
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
                  {notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Overview & Risk Insights */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {attendanceData?.warning && (
                <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <h4 className="font-semibold text-sm">Attendance Alert</h4>
                    <p className="text-xs mt-1 text-amber-300/90">{attendanceData.warning}</p>
                  </div>
                </div>
              )}

              {analyticsData && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-indigo-400" />
                      Academic Risk & Performance Insights
                    </h3>
                    <span className="text-xs text-slate-500">Analysis Date: {analyticsData.analysis_date}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-slate-400">Risk Classification</h4>
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block">Calculated Risk Score</span>
                          <span className="text-2xl font-bold text-slate-100 mt-1 block">
                            {analyticsData.risk_score} / 100
                          </span>
                        </div>
                        <span
                          className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                            analyticsData.risk_level === "HIGH"
                              ? "bg-red-950 text-red-300 border border-red-800"
                              : analyticsData.risk_level === "MEDIUM"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {analyticsData.risk_level} RISK
                        </span>
                      </div>

                      {analyticsData.contributing_reasons?.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-400">Contributing Factors:</h4>
                          <ul className="space-y-1.5">
                            {analyticsData.contributing_reasons.map((reason, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Student is performing within optimal threshold bounds.
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-slate-400">Recommended Actions for Parents</h4>
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        {analyticsData.suggested_actions}
                      </div>

                      <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl text-xs text-slate-400 flex items-start gap-2">
                        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <p>{analyticsData.disclaimer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Attendance Supervision */}
          {activeTab === "attendance" && attendanceData && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-emerald-400" />
                  Subject-Wise Attendance Supervision
                </h3>
                <span className="text-sm font-semibold text-emerald-400">
                  Overall: {attendanceData.overall_percentage}% ({attendanceData.present_classes}/{attendanceData.total_classes} classes)
                </span>
              </div>

              {attendanceData.subject_breakdown?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No attendance records registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attendanceData.subject_breakdown.map((subj, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-200">{subj.subject_name}</span>
                        <span className={`font-bold ${subj.percentage >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                          {subj.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${subj.percentage >= 75 ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(subj.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        Attended {subj.present_classes} of {subj.total_classes} conducted lectures
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Academic Marks */}
          {activeTab === "marks" && marksData && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  Academic Assessment Marks
                </h3>
                <span className="text-sm font-semibold text-blue-400">
                  Overall Score: {marksData.overall_percentage}% ({marksData.total_obtained}/{marksData.total_max})
                </span>
              </div>

              {marksData.records?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No assessment marks uploaded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Assessment Type</th>
                        <th className="px-4 py-3">Marks Obtained</th>
                        <th className="px-4 py-3">Maximum Marks</th>
                        <th className="px-4 py-3">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {marksData.records.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-950/40">
                          <td className="px-4 py-3 font-medium text-slate-200">
                            {m.subject_name} ({m.subject_code})
                          </td>
                          <td className="px-4 py-3">{m.exam_type}</td>
                          <td className="px-4 py-3 font-bold text-slate-100">{m.marks_obtained}</td>
                          <td className="px-4 py-3 text-slate-400">{m.max_marks}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${m.percentage >= 60 ? "text-emerald-400" : "text-amber-400"}`}>
                              {m.percentage}%
                            </span>
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
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Bell className="w-5 h-5 text-indigo-400" />
                Parent Alerts & Notifications
              </h3>

              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No notifications received yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                        n.is_read ? "bg-slate-950/40 border-slate-800/60 opacity-80" : "bg-slate-950 border-indigo-800/80 shadow-md shadow-indigo-950/30"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">{n.title}</span>
                          {!n.is_read && (
                            <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full font-bold">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">{n.message}</p>
                        <span className="text-[11px] text-slate-500 block">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>

                      {!n.is_read && (
                        <button
                          onClick={() => markNotifRead(n.id)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition flex-shrink-0"
                        >
                          Mark as read
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
