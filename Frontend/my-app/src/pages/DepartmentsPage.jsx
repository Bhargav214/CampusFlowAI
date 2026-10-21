/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  Plus,
  Search,
  Users,
  UserRound,
  BarChart2,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  ShieldAlert,
  Sparkles,
  PieChart as PieChartIcon,
  Layers,
  GraduationCap,
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Pages.css";
import "./DepartmentsPage.css";

// Color palette for charts
const CHART_COLORS = ["#38BDF8", "#818CF8", "#A855F7", "#10B981", "#F59E0B", "#F43F5E", "#06B6D4"];

export default function DepartmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Data states
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Analytics Collapsible
  const [showOverviewAnalytics, setShowOverviewAnalytics] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Delete Confirmation Modal
  const [deleteDept, setDeleteDept] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Analytics Drawer / Modal
  const [analyticsDept, setAnalyticsDept] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    department_code: "",
    department_name: "",
    description: "",
    head_of_department_id: "",
    is_active: true,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToastNotification = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Keyboard accessibility: ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setShowEditModal(false);
        setAnalyticsDept(null);
        setDeleteDept(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchDepartments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let url = "/departments/";
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (statusFilter !== "all") params.append("is_active", statusFilter === "active");

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      setDepartments(res.data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setError(err.response?.data?.detail || "Failed to load academic departments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter]);

  const fetchFacultyList = async () => {
    try {
      const res = await api.get("/faculty/");
      setFacultyList(res.data || []);
    } catch (err) {
      console.warn("Could not fetch faculty list for HOD dropdown:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchFacultyList();
  }, [fetchDepartments]);

  const openAddModal = () => {
    setFormData({
      department_code: "",
      department_name: "",
      description: "",
      head_of_department_id: "",
      is_active: true,
    });
    setFormError("");
    setShowAddModal(true);
  };

  const openEditModal = (dept) => {
    setSelectedDept(dept);
    setFormData({
      department_code: dept.department_code,
      department_name: dept.department_name,
      description: dept.description || "",
      head_of_department_id: dept.head_of_department_id || "",
      is_active: dept.is_active,
    });
    setFormError("");
    setShowEditModal(true);
  };

  const openAnalytics = async (dept) => {
    setAnalyticsDept(dept);
    setAnalyticsLoading(true);
    setAnalyticsData(null);
    try {
      const res = await api.get(`/departments/${dept.id}/dashboard`);
      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Failed to load department analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const payload = {
        department_code: formData.department_code.trim().toUpperCase(),
        department_name: formData.department_name.trim(),
        description: formData.description?.trim() || null,
        head_of_department_id: formData.head_of_department_id ? Number(formData.head_of_department_id) : null,
        is_active: formData.is_active,
      };

      await api.post("/departments/", payload);
      setShowAddModal(false);
      showToastNotification(`Department '${payload.department_code}' created successfully!`);
      fetchDepartments();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create department. Verify the code is unique.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDept) return;
    setFormError("");
    setSubmitting(true);

    try {
      const payload = {
        department_code: formData.department_code.trim().toUpperCase(),
        department_name: formData.department_name.trim(),
        description: formData.description?.trim() || null,
        head_of_department_id: formData.head_of_department_id ? Number(formData.head_of_department_id) : 0,
        is_active: formData.is_active,
      };

      await api.put(`/departments/${selectedDept.id}`, payload);
      setShowEditModal(false);
      showToastNotification(`Department '${payload.department_code}' updated successfully!`);
      fetchDepartments();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to update department.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      await api.patch(`/departments/${dept.id}/status`, { is_active: !dept.is_active });
      showToastNotification(
        `Department '${dept.department_code}' is now ${!dept.is_active ? "Active" : "Inactive"}.`
      );
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update department status.");
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deleteDept) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/departments/${deleteDept.id}`);
      setDeleteDept(null);
      showToastNotification(res.data?.message || `Department removed or archived safely.`);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete department.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // Real Stats Calculations from backend data
  const totalDepts = departments.length;
  const activeDepts = useMemo(() => departments.filter((d) => d.is_active).length, [departments]);
  const totalStudents = useMemo(() => departments.reduce((acc, d) => acc + (d.student_count || 0), 0), [departments]);
  const totalFaculty = useMemo(() => departments.reduce((acc, d) => acc + (d.faculty_count || 0), 0), [departments]);

  // Real Data for Recharts Overview
  const barChartData = useMemo(() => {
    return departments.map((d) => ({
      code: d.department_code,
      name: d.department_name,
      students: d.student_count || 0,
      faculty: d.faculty_count || 0,
      subjects: d.subject_count || 0,
    }));
  }, [departments]);

  const pieChartData = useMemo(() => {
    const listWithStudents = departments.filter((d) => (d.student_count || 0) > 0);
    if (listWithStudents.length > 0) {
      return listWithStudents.map((d) => ({
        name: d.department_code,
        fullName: d.department_name,
        value: d.student_count,
      }));
    }
    // If student counts are not yet populated, show faculty distribution
    return departments.map((d) => ({
      name: d.department_code,
      fullName: d.department_name,
      value: d.faculty_count || 1,
    }));
  }, [departments]);

  const hasPieData = pieChartData.some((item) => item.value > 0);

  return (
    <div className="dept-page">
      {/* ── 1. PAGE HEADER ────────────────────────────────────────────────── */}
      <header className="dept-header-wrap">
        <div className="dept-header-info">
          <div className="dept-header-icon-box" aria-hidden="true">
            <Building2 size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="dept-eyebrow">
              <span>CampusFlow AI</span>
              <span className="dept-eyebrow-pill">Academic Intelligence</span>
            </div>
            <h1 className="dept-title">Department Management</h1>
            <p className="dept-subtitle">
              Manage academic departments, faculty assignments, and department-level performance.
            </p>
          </div>
        </div>

        <div className="dept-header-actions">
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="dept-primary-btn"
              id="add-department-btn"
              title="Add New Academic Department"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </header>

      {/* ── 2. STATISTICS CARDS (Responsive Horizontal Grid) ─────────────── */}
      <section className="dept-stats-grid" aria-label="Department Statistics">
        {loading ? (
          <>
            <div className="dept-skeleton dept-skeleton-stat" />
            <div className="dept-skeleton dept-skeleton-stat" />
            <div className="dept-skeleton dept-skeleton-stat" />
            <div className="dept-skeleton dept-skeleton-stat" />
          </>
        ) : (
          <>
            {/* Card 1: Total Departments */}
            <div className="dept-stat-card blue">
              <div className="dept-stat-top">
                <span className="dept-stat-label">Total Departments</span>
                <div className="dept-stat-icon-wrap">
                  <Building2 size={20} strokeWidth={2} />
                </div>
              </div>
              <div className="dept-stat-number">{totalDepts}</div>
              <div className="dept-stat-subtext">
                <Sparkles size={12} color="#38bdf8" />
                <span>Academic faculties in campus</span>
              </div>
            </div>

            {/* Card 2: Active Departments */}
            <div className="dept-stat-card emerald">
              <div className="dept-stat-top">
                <span className="dept-stat-label">Active Departments</span>
                <div className="dept-stat-icon-wrap">
                  <CheckCircle2 size={20} strokeWidth={2} />
                </div>
              </div>
              <div className="dept-stat-number">{activeDepts}</div>
              <div className="dept-stat-subtext">
                <Activity size={12} color="#10b981" />
                <span>
                  {totalDepts > 0 ? `${Math.round((activeDepts / totalDepts) * 100)}% operational rate` : "No units registered"}
                </span>
              </div>
            </div>

            {/* Card 3: Total Enrolled Students */}
            <div className="dept-stat-card violet">
              <div className="dept-stat-top">
                <span className="dept-stat-label">Total Enrolled Students</span>
                <div className="dept-stat-icon-wrap">
                  <GraduationCap size={20} strokeWidth={2} />
                </div>
              </div>
              <div className="dept-stat-number">{totalStudents}</div>
              <div className="dept-stat-subtext">
                <Users size={12} color="#c084fc" />
                <span>Across all departments</span>
              </div>
            </div>

            {/* Card 4: Assigned Faculty */}
            <div className="dept-stat-card amber">
              <div className="dept-stat-top">
                <span className="dept-stat-label">Assigned Faculty</span>
                <div className="dept-stat-icon-wrap">
                  <UserRound size={20} strokeWidth={2} />
                </div>
              </div>
              <div className="dept-stat-number">{totalFaculty}</div>
              <div className="dept-stat-subtext">
                <BookOpen size={12} color="#fbbf24" />
                <span>Professors & instructors</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── 3. SEARCH AND FILTERS TOOLBAR ─────────────────────────────────── */}
      <section className="dept-toolbar" aria-label="Search and Filter Controls">
        <div className="dept-toolbar-left">
          <div className="dept-search-box">
            <Search size={16} className="dept-search-icon" />
            <input
              id="department-search-input"
              type="text"
              placeholder="Search departments by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dept-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="dept-search-clear"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="dept-segmented-filter" role="tablist">
            <button
              onClick={() => setStatusFilter("all")}
              className={`dept-segmented-btn ${statusFilter === "all" ? "active" : ""}`}
            >
              All ({totalDepts})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`dept-segmented-btn ${statusFilter === "active" ? "active" : ""}`}
            >
              Active ({activeDepts})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`dept-segmented-btn ${statusFilter === "inactive" ? "active" : ""}`}
            >
              Inactive ({totalDepts - activeDepts})
            </button>
          </div>
        </div>

        <div className="dept-toolbar-right">
          {departments.length > 0 && (
            <button
              onClick={() => setShowOverviewAnalytics((prev) => !prev)}
              className="dept-analytics-toggle"
              title="Toggle Academic Overview Analytics"
            >
              <BarChart2 size={14} />
              <span>{showOverviewAnalytics ? "Hide Benchmarks" : "Academic Benchmarks"}</span>
              {showOverviewAnalytics ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {(searchQuery || statusFilter !== "all") && (
            <button onClick={handleClearFilters} className="dept-clear-filter-btn">
              Reset Filters
            </button>
          )}

          <button
            onClick={() => fetchDepartments(true)}
            className={`dept-refresh-btn ${refreshing ? "spinning" : ""}`}
            title="Refresh department list"
            aria-label="Refresh departments"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </section>

      {/* ── 5. DEPARTMENT ANALYTICS SECTION (Collapsible Overview) ─────────── */}
      {showOverviewAnalytics && departments.length > 0 && (
        <section className="dept-analytics-panel" aria-label="Executive Academic Analytics">
          <div className="dept-analytics-header">
            <div>
              <h2 className="dept-analytics-title">
                <BarChart2 size={18} color="#38bdf8" />
                Department Comparisons & Distribution
              </h2>
              <div className="dept-analytics-sub">
                Live metrics rendered directly from campus database responses
              </div>
            </div>
            <div className="dept-count-badge">
              {departments.length} Units Analyzed
            </div>
          </div>

          <div className="dept-charts-row">
            {/* Chart 1: Students & Faculty Comparison */}
            <div className="dept-chart-box">
              <div className="dept-chart-title">Students & Faculty by Department</div>
              <div className="dept-chart-desc">
                Comparison of enrolled student headcounts versus assigned teaching staff
              </div>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="code" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0c1424",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#f1f5f9",
                      }}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="students" name="Students" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="faculty" name="Faculty" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="subjects" name="Subjects" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Student Enrollment Proportion */}
            <div className="dept-chart-box">
              <div className="dept-chart-title">Campus Share Distribution</div>
              <div className="dept-chart-desc">
                {totalStudents > 0 ? "Proportional student enrollment distribution" : "Faculty allocation by department"}
              </div>
              <div style={{ width: "100%", height: 240 }}>
                {hasPieData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#0c1424",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#f1f5f9",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center h-full">
                    No enrollment distribution data available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 8. ERROR STATE ────────────────────────────────────────────────── */}
      {error && (
        <div className="dept-error-card" role="alert">
          <div className="dept-error-left">
            <AlertTriangle size={24} color="#f87171" />
            <div>
              <div className="dept-error-title">Database Communication Error</div>
              <div className="dept-error-msg">{error}</div>
            </div>
          </div>
          <button onClick={() => fetchDepartments()} className="dept-secondary-btn">
            Retry Connection
          </button>
        </div>
      )}

      {/* ── 4. DEPARTMENT CARDS (Main Content Grid) ───────────────────────── */}
      {loading ? (
        <div className="dept-cards-grid">
          <div className="dept-skeleton dept-skeleton-card" />
          <div className="dept-skeleton dept-skeleton-card" />
          <div className="dept-skeleton dept-skeleton-card" />
          <div className="dept-skeleton dept-skeleton-card" />
          <div className="dept-skeleton dept-skeleton-card" />
          <div className="dept-skeleton dept-skeleton-card" />
        </div>
      ) : departments.length === 0 ? (
        /* Empty State */
        <div className="dept-empty-card">
          <div className="dept-empty-icon-wrap">
            <Building2 size={32} />
          </div>
          <h3 className="dept-empty-title">No Departments Found</h3>
          <p className="dept-empty-sub">
            {searchQuery || statusFilter !== "all"
              ? "No departments match your current filter criteria. Try clearing search filters."
              : "No academic departments have been configured yet. Create your first department to start assigning faculty and students."}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {searchQuery || statusFilter !== "all" ? (
              <button onClick={handleClearFilters} className="dept-secondary-btn">
                Clear Filters
              </button>
            ) : (
              isAdmin && (
                <button onClick={openAddModal} className="dept-primary-btn">
                  <Plus size={16} />
                  <span>Create First Department</span>
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        /* Department Cards Grid */
        <section className="dept-cards-grid" aria-label="Department Listing">
          {departments.map((dept) => {
            const studentCount = dept.student_count || 0;
            const facultyCount = dept.faculty_count || 0;
            const subjectCount = dept.subject_count || 0;

            // Real derived metrics
            const enrollmentShare =
              totalStudents > 0 ? ((studentCount / totalStudents) * 100).toFixed(1) : "0.0";
            const studentFacultyRatio =
              facultyCount > 0 ? (studentCount / facultyCount).toFixed(1) : studentCount > 0 ? studentCount : "—";

            return (
              <article
                key={dept.id}
                className={`dept-card ${!dept.is_active ? "inactive" : ""}`}
                id={`dept-card-${dept.id}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="dept-card-header">
                    <div className="dept-card-brand">
                      <span className="dept-code-badge" title="Department Code">
                        {dept.department_code}
                      </span>
                    </div>

                    <span
                      className={`dept-status-pill ${dept.is_active ? "active" : "inactive"}`}
                      title={dept.is_active ? "Active Department" : "Inactive Department"}
                    >
                      <span className="dept-status-dot" />
                      {dept.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h3 className="dept-card-title">{dept.department_name}</h3>

                  {/* Description */}
                  <p className="dept-card-desc" title={dept.description || "No description provided."}>
                    {dept.description || "No specific department description provided."}
                  </p>

                  {/* Head of Department Row */}
                  <div className="dept-hod-row">
                    <UserRound size={14} className="dept-hod-icon" />
                    {dept.head_of_department ? (
                      <span className="dept-hod-name" title={dept.head_of_department.email}>
                        <span className="dept-hod-label">HOD:</span>
                        {dept.head_of_department.first_name} {dept.head_of_department.last_name}
                      </span>
                    ) : (
                      <span className="dept-hod-none">
                        <span className="dept-hod-label">HOD:</span>
                        Not Assigned
                      </span>
                    )}
                  </div>

                  {/* 3-Column Metrics Box */}
                  <div className="dept-metrics-box">
                    <div className="dept-metric-item">
                      <div className="dept-metric-label">Students</div>
                      <div className="dept-metric-val">{studentCount}</div>
                    </div>
                    <div className="dept-metric-item">
                      <div className="dept-metric-label">Faculty</div>
                      <div className="dept-metric-val">{facultyCount}</div>
                    </div>
                    <div className="dept-metric-item">
                      <div className="dept-metric-label">Subjects</div>
                      <div className="dept-metric-val">{subjectCount}</div>
                    </div>
                  </div>

                  {/* Real Data Distribution Bar */}
                  <div className="dept-distribution-bar-wrap">
                    <div className="dept-distribution-info">
                      <span className="dept-distribution-label">
                        {totalStudents > 0 ? "Campus Enrollment Share" : "Faculty-Student Ratio"}
                      </span>
                      <span className="dept-distribution-val">
                        {totalStudents > 0 ? `${enrollmentShare}%` : `${studentFacultyRatio} : 1`}
                      </span>
                    </div>
                    <div className="dept-progress-track">
                      <div
                        className="dept-progress-fill"
                        style={{
                          width: `${Math.min(
                            totalStudents > 0 ? Number(enrollmentShare) || 5 : studentCount > 0 ? 50 : 8,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="dept-card-footer">
                  <button
                    onClick={() => openAnalytics(dept)}
                    className="dept-analytics-btn"
                    title="View Analytics & Risk Dashboard"
                  >
                    <BarChart2 size={14} />
                    <span>View Analytics</span>
                  </button>

                  {isAdmin && (
                    <div className="dept-action-icons">
                      <button
                        onClick={() => handleToggleStatus(dept)}
                        className={`dept-icon-btn ${dept.is_active ? "status-active" : "status-inactive"}`}
                        title={dept.is_active ? "Deactivate department" : "Activate department"}
                        aria-label="Toggle department active status"
                      >
                        {dept.is_active ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                      </button>

                      <button
                        onClick={() => openEditModal(dept)}
                        className="dept-icon-btn edit"
                        title="Edit Department"
                        aria-label="Edit department"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteDept(dept)}
                        className="dept-icon-btn delete"
                        title="Delete or Archive Department"
                        aria-label="Delete or archive department"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* ── 6. ADD DEPARTMENT MODAL ───────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="dept-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="dept-modal" role="dialog" aria-modal="true" aria-labelledby="add-dept-title">
            <div className="dept-modal-header">
              <div className="dept-modal-header-left">
                <div className="dept-modal-icon-badge">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="dept-modal-title" id="add-dept-title">Add New Department</h3>
                  <p className="dept-modal-sub">Create an academic division and link faculty head</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="dept-modal-close-btn"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: "0 24px", paddingTop: "18px" }}>
                <div className="dept-form-alert">
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="dept-modal-body">
                <div className="dept-form-row">
                  <div className="dept-form-group">
                    <label htmlFor="add_dept_code">
                      Department Code <span className="req">*</span>
                    </label>
                    <input
                      id="add_dept_code"
                      type="text"
                      required
                      placeholder="e.g. CS"
                      value={formData.department_code}
                      onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                      className="dept-form-input code"
                      maxLength={30}
                    />
                  </div>

                  <div className="dept-form-group">
                    <label htmlFor="add_dept_name">
                      Department Name <span className="req">*</span>
                    </label>
                    <input
                      id="add_dept_name"
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={formData.department_name}
                      onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                      className="dept-form-input"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="dept-form-group">
                  <label htmlFor="add_dept_desc">Department Description</label>
                  <textarea
                    id="add_dept_desc"
                    rows={2}
                    placeholder="Brief description of department curriculum, goals, or scope..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="dept-form-textarea"
                    maxLength={255}
                  />
                </div>

                <div className="dept-form-group">
                  <label htmlFor="add_dept_hod">Head of Department (HOD)</label>
                  <select
                    id="add_dept_hod"
                    value={formData.head_of_department_id}
                    onChange={(e) => setFormData({ ...formData, head_of_department_id: e.target.value })}
                    className="dept-form-select"
                  >
                    <option value="">-- Select Faculty HOD (Optional) --</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.first_name} {f.last_name} ({f.faculty_id})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="dept-toggle-row">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="dept-toggle-input"
                  />
                  <div>
                    <div className="dept-toggle-text">Active Status</div>
                    <div className="dept-toggle-desc">
                      Department will immediately accept course registrations and faculty assignments
                    </div>
                  </div>
                </label>
              </div>

              <div className="dept-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="dept-secondary-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="dept-primary-btn"
                >
                  {submitting ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. EDIT DEPARTMENT MODAL ──────────────────────────────────────── */}
      {showEditModal && selectedDept && (
        <div
          className="dept-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="dept-modal" role="dialog" aria-modal="true" aria-labelledby="edit-dept-title">
            <div className="dept-modal-header">
              <div className="dept-modal-header-left">
                <div className="dept-modal-icon-badge">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="dept-modal-title" id="edit-dept-title">Edit Department</h3>
                  <p className="dept-modal-sub">
                    Update details for {selectedDept.department_name} ({selectedDept.department_code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="dept-modal-close-btn"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: "0 24px", paddingTop: "18px" }}>
                <div className="dept-form-alert">
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="dept-modal-body">
                <div className="dept-form-row">
                  <div className="dept-form-group">
                    <label htmlFor="edit_dept_code">
                      Department Code <span className="req">*</span>
                    </label>
                    <input
                      id="edit_dept_code"
                      type="text"
                      required
                      value={formData.department_code}
                      onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                      className="dept-form-input code"
                      maxLength={30}
                    />
                  </div>

                  <div className="dept-form-group">
                    <label htmlFor="edit_dept_name">
                      Department Name <span className="req">*</span>
                    </label>
                    <input
                      id="edit_dept_name"
                      type="text"
                      required
                      value={formData.department_name}
                      onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                      className="dept-form-input"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="dept-form-group">
                  <label htmlFor="edit_dept_desc">Department Description</label>
                  <textarea
                    id="edit_dept_desc"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="dept-form-textarea"
                    maxLength={255}
                  />
                </div>

                <div className="dept-form-group">
                  <label htmlFor="edit_dept_hod">Head of Department (HOD)</label>
                  <select
                    id="edit_dept_hod"
                    value={formData.head_of_department_id}
                    onChange={(e) => setFormData({ ...formData, head_of_department_id: e.target.value })}
                    className="dept-form-select"
                  >
                    <option value="">-- No Head Assigned --</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.first_name} {f.last_name} ({f.faculty_id})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="dept-toggle-row">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="dept-toggle-input"
                  />
                  <div>
                    <div className="dept-toggle-text">Active Department</div>
                    <div className="dept-toggle-desc">
                      Controls visibility in student admissions and subject allocation
                    </div>
                  </div>
                </label>
              </div>

              <div className="dept-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="dept-secondary-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="dept-primary-btn"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. DEPARTMENT DETAILS & ANALYTICS MODAL / DRAWER ──────────────── */}
      {analyticsDept && (
        <div
          className="dept-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setAnalyticsDept(null)}
        >
          <div
            className="dept-analytics-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="analytics-modal-title"
          >
            <div className="dept-analytics-modal-header">
              <div className="flex items-center gap-3">
                <div className="dept-modal-icon-badge">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 className="dept-modal-title" id="analytics-modal-title">
                    {analyticsDept.department_name} ({analyticsDept.department_code})
                  </h3>
                  <p className="dept-modal-sub">
                    Real-time academic performance & predictive risk classification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAnalyticsDept(null)}
                className="dept-modal-close-btn"
                aria-label="Close analytics drawer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="dept-analytics-modal-body">
              {analyticsLoading ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  <div className="dept-refresh-btn spinning mx-auto mb-3" style={{ margin: "0 auto" }}>
                    <RefreshCw size={20} />
                  </div>
                  <span>Loading department performance data...</span>
                </div>
              ) : analyticsData ? (
                <>
                  {/* KPI Grid */}
                  <div className="dept-analytics-kpi-grid">
                    <div className="dept-kpi-card">
                      <div className="dept-kpi-label">Total Students</div>
                      <div className="dept-kpi-value">{analyticsData.total_students}</div>
                    </div>
                    <div className="dept-kpi-card">
                      <div className="dept-kpi-label">Faculty Staff</div>
                      <div className="dept-kpi-value">{analyticsData.total_faculty}</div>
                    </div>
                    <div className="dept-kpi-card">
                      <div className="dept-kpi-label">Avg Attendance</div>
                      <div
                        className={`dept-kpi-value ${
                          analyticsData.average_attendance >= 75 ? "green" : "amber"
                        }`}
                      >
                        {analyticsData.average_attendance}%
                      </div>
                    </div>
                    <div className="dept-kpi-card">
                      <div className="dept-kpi-label">Avg Academic Marks</div>
                      <div className="dept-kpi-value blue">{analyticsData.average_marks}%</div>
                    </div>
                  </div>

                  {/* Academic Risk Classification Card */}
                  <div className="dept-risk-breakdown-card">
                    <div className="dept-risk-header">
                      <div className="dept-risk-title">
                        <ShieldAlert size={16} color="#38bdf8" />
                        <span>AI Academic Risk Classification</span>
                      </div>
                      <span className="dept-eyebrow-pill">Predictive Analysis</span>
                    </div>

                    <div className="dept-risk-grid">
                      <div className="dept-risk-box high">
                        <div className="dept-risk-pill">High Academic Risk</div>
                        <div className="dept-risk-count">
                          {analyticsData.risk_distribution?.high_risk || 0}
                        </div>
                        <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.85 }}>
                          Attendance &lt; 75% or Failing Marks
                        </div>
                      </div>

                      <div className="dept-risk-box medium">
                        <div className="dept-risk-pill">Medium Risk</div>
                        <div className="dept-risk-count">
                          {analyticsData.risk_distribution?.medium_risk || 0}
                        </div>
                        <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.85 }}>
                          Marginal Attendance or Marks
                        </div>
                      </div>

                      <div className="dept-risk-box low">
                        <div className="dept-risk-pill">Good Standing</div>
                        <div className="dept-risk-count">
                          {analyticsData.risk_distribution?.low_risk || 0}
                        </div>
                        <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.85 }}>
                          Optimal Attendance &gt;= 75%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Curricular & Structural Overview */}
                  <div className="dept-chart-box">
                    <div className="dept-chart-title">Academic Architecture</div>
                    <div className="dept-chart-desc">
                      Current curriculum subjects and mentoring faculty allocation
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ padding: "12px", background: "#090e1b", borderRadius: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
                          Configured Subjects
                        </span>
                        <strong style={{ fontSize: "18px", color: "var(--text-primary)" }}>
                          {analyticsData.total_subjects} Modules
                        </strong>
                      </div>
                      <div style={{ padding: "12px", background: "#090e1b", borderRadius: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>
                          Student-Faculty Ratio
                        </span>
                        <strong style={{ fontSize: "18px", color: "#38bdf8" }}>
                          {analyticsData.total_faculty > 0
                            ? (analyticsData.total_students / analyticsData.total_faculty).toFixed(1)
                            : analyticsData.total_students}{" "}
                          : 1
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                  Failed to load analytics dashboard for this department.
                </div>
              )}
            </div>

            <div className="dept-modal-footer">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const d = analyticsDept;
                    setAnalyticsDept(null);
                    openEditModal(d);
                  }}
                  className="dept-secondary-btn"
                >
                  <Edit2 size={14} />
                  <span>Edit Department</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setAnalyticsDept(null)}
                className="dept-primary-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE / ARCHIVE CONFIRMATION MODAL ───────────────────────────── */}
      {deleteDept && (
        <div
          className="dept-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setDeleteDept(null)}
        >
          <div className="dept-modal" style={{ maxWidth: 460 }} role="dialog" aria-modal="true">
            <div className="dept-modal-header">
              <div className="dept-modal-header-left">
                <div className="dept-modal-icon-badge" style={{ color: "#f87171", background: "rgba(239, 68, 68, 0.12)" }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="dept-modal-title">Delete or Archive Department</h3>
                  <p className="dept-modal-sub">{deleteDept.department_name}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteDept(null)}
                className="dept-modal-close-btn"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="dept-modal-body">
              <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.5" }}>
                Are you sure you want to remove <strong>{deleteDept.department_name}</strong> (
                <code>{deleteDept.department_code}</code>)?
              </p>
              <div style={{ padding: "12px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "8px", fontSize: "12px", color: "#fbbf24" }}>
                <strong>Campus Safe Policy:</strong> If active students or faculty are associated with this department, it will be safely deactivated rather than deleted.
              </div>
            </div>

            <div className="dept-modal-footer">
              <button
                type="button"
                onClick={() => setDeleteDept(null)}
                className="dept-secondary-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteDepartment}
                className="dept-primary-btn"
                style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)" }}
              >
                {deleting ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING TOAST NOTIFICATION ──────────────────────────────────── */}
      {toast && (
        <div className="dept-toast" role="status">
          <CheckCircle2 size={18} className="dept-toast-icon" />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
