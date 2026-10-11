/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
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
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import "./Pages.css";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [analyticsDept, setAnalyticsDept] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/departments/";
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (statusFilter !== "all") params.append("is_active", statusFilter === "active");

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setError(err.response?.data?.detail || "Failed to load departments.");
    } finally {
      setLoading(false);
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
        department_code: formData.department_code,
        department_name: formData.department_name,
        description: formData.description || null,
        head_of_department_id: formData.head_of_department_id ? Number(formData.head_of_department_id) : null,
        is_active: formData.is_active,
      };

      await api.post("/departments/", payload);
      setShowAddModal(false);
      fetchDepartments();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create department.");
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
        department_code: formData.department_code,
        department_name: formData.department_name,
        description: formData.description || null,
        head_of_department_id: formData.head_of_department_id ? Number(formData.head_of_department_id) : 0,
        is_active: formData.is_active,
      };

      await api.put(`/departments/${selectedDept.id}`, payload);
      setShowEditModal(false);
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
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update department status.");
    }
  };

  // Stats calculation
  const totalDepts = departments.length;
  const activeDepts = departments.filter((d) => d.is_active).length;
  const totalStudents = departments.reduce((acc, d) => acc + (d.student_count || 0), 0);
  const totalFaculty = departments.reduce((acc, d) => acc + (d.faculty_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-400" />
            Multi-Department Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize academic departments, associate faculty & students, and track department-level analytics.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Departments</span>
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{totalDepts}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Active Departments</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{activeDepts}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Enrolled Students</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{totalStudents}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Assigned Faculty</span>
            <UserRound className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{totalFaculty}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search department name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            onClick={fetchDepartments}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl">
          Loading departments...
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No departments found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? "Try refining your search query." : "Click 'Add Department' to create your first department."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className={`bg-slate-900/60 border ${
                dept.is_active ? "border-slate-800 hover:border-slate-700" : "border-slate-800/50 opacity-75"
              } rounded-xl p-5 transition flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-md">
                      {dept.department_code}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-100 mt-2">{dept.department_name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dept.is_active
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {dept.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {dept.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {dept.description || "No department description provided."}
                </p>

                {dept.head_of_department && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-300">
                    <UserRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      HOD: <strong className="text-slate-200">{dept.head_of_department.first_name} {dept.head_of_department.last_name}</strong>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-center">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/40">
                    <span className="block text-xs text-slate-400">Students</span>
                    <span className="text-sm font-bold text-slate-200">{dept.student_count}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/40">
                    <span className="block text-xs text-slate-400">Faculty</span>
                    <span className="text-sm font-bold text-slate-200">{dept.faculty_count}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/40">
                    <span className="block text-xs text-slate-400">Subjects</span>
                    <span className="text-sm font-bold text-slate-200">{dept.subject_count}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => openAnalytics(dept)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium transition"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Analytics
                </button>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleToggleStatus(dept)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                        title={dept.is_active ? "Deactivate department" : "Activate department"}
                      >
                        {dept.is_active ? <XCircle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </button>

                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                        title="Edit department"
                      >
                        <Edit2 className="w-4 h-4 text-indigo-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Add New Department
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS"
                    value={formData.department_code}
                    onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of department scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Head of Department (HOD)
                </label>
                <select
                  value={formData.head_of_department_id}
                  onChange={(e) => setFormData({ ...formData, head_of_department_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Faculty HOD (Optional) --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.first_name} {f.last_name} ({f.faculty_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="add_active" className="text-xs text-slate-300 cursor-pointer">
                  Activate department immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                Edit Department
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department_code}
                    onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Head of Department (HOD)
                </label>
                <select
                  value={formData.head_of_department_id}
                  onChange={(e) => setFormData({ ...formData, head_of_department_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- No Head Assigned --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.first_name} {f.last_name} ({f.faculty_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="edit_active" className="text-xs text-slate-300 cursor-pointer">
                  Department is active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Modal / Drawer */}
      {analyticsDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  {analyticsDept.department_name} ({analyticsDept.department_code}) Analytics
                </h3>
                <p className="text-xs text-slate-400 mt-1">Real-time department statistics & risk breakdown</p>
              </div>
              <button
                onClick={() => setAnalyticsDept(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {analyticsLoading ? (
              <div className="p-8 text-center text-slate-400">Loading department statistics...</div>
            ) : analyticsData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 block">Total Students</span>
                    <span className="text-xl font-bold text-slate-100">{analyticsData.total_students}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 block">Faculty Members</span>
                    <span className="text-xl font-bold text-slate-100">{analyticsData.total_faculty}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 block">Avg Attendance</span>
                    <span className={`text-xl font-bold ${analyticsData.average_attendance >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                      {analyticsData.average_attendance}%
                    </span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 block">Avg Academic Score</span>
                    <span className="text-xl font-bold text-indigo-400">{analyticsData.average_marks}%</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-200">Academic Risk Classification Breakdown</h4>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-lg text-center">
                      <span className="text-xs text-red-400 font-medium block">HIGH RISK</span>
                      <span className="text-xl font-bold text-red-300 mt-1 block">
                        {analyticsData.risk_distribution?.high_risk || 0}
                      </span>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-900/60 p-3 rounded-lg text-center">
                      <span className="text-xs text-amber-400 font-medium block">MEDIUM RISK</span>
                      <span className="text-xl font-bold text-amber-300 mt-1 block">
                        {analyticsData.risk_distribution?.medium_risk || 0}
                      </span>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-900/60 p-3 rounded-lg text-center">
                      <span className="text-xs text-emerald-400 font-medium block">LOW RISK</span>
                      <span className="text-xl font-bold text-emerald-300 mt-1 block">
                        {analyticsData.risk_distribution?.low_risk || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">Failed to load analytics.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
