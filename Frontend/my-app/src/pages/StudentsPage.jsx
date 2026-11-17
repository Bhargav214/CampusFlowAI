/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  GraduationCap,
  UserPlus,
  Eye,
  Trash2,
  X,
  Loader2,
  CheckCircle,
  Download,
} from "lucide-react";

import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import "./Pages.css";

const EMPTY_STUDENT_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  roll_number: "",
  department: "",
  semester: "1",
  phone: "",
  address: "",
  password: "",
};

/* ── Add / Edit Student Modal ── */
function StudentModal({ onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_STUDENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlertMsg(null);

    try {
      const payload = {
        ...form,
        semester: form.semester ? parseInt(form.semester, 10) : 1,
      };
      await api.post("/students/", payload);
      setAlertMsg({ type: "success", text: "Student enrolled successfully!" });
      setTimeout(() => {
        onSaved();
      }, 700);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data)
          ? err.response.data.map((e) => e.msg).join(", ")
          : "Failed to add student. Please verify the roll number and email.");
      setAlertMsg({ type: "error", text: detail });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="cf-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cf-modal">
        <div className="cf-modal-header">
          <h2 className="cf-modal-title">Enroll New Student</h2>
          <button className="cf-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cf-modal-body">
            {alertMsg && (
              <div className={`cf-form-alert ${alertMsg.type}`}>
                {alertMsg.text}
              </div>
            )}

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>First Name *</label>
                <input
                  className="cf-form-input"
                  required
                  value={form.first_name}
                  onChange={setField("first_name")}
                  placeholder="e.g. Alex"
                />
              </div>
              <div className="cf-form-group">
                <label>Last Name *</label>
                <input
                  className="cf-form-input"
                  required
                  value={form.last_name}
                  onChange={setField("last_name")}
                  placeholder="e.g. Morgan"
                />
              </div>
            </div>

            <div className="cf-form-group">
              <label>Email Address *</label>
              <input
                className="cf-form-input"
                type="email"
                required
                value={form.email}
                onChange={setField("email")}
                placeholder="alex.morgan@campus.edu"
              />
            </div>

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>Roll Number *</label>
                <input
                  className="cf-form-input"
                  required
                  value={form.roll_number}
                  onChange={setField("roll_number")}
                  placeholder="e.g. CS2026042"
                />
              </div>
              <div className="cf-form-group">
                <label>Semester</label>
                <input
                  className="cf-form-input"
                  type="number"
                  min="1"
                  max="12"
                  value={form.semester}
                  onChange={setField("semester")}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>Department</label>
                <input
                  className="cf-form-input"
                  value={form.department}
                  onChange={setField("department")}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className="cf-form-group">
                <label>Phone Number</label>
                <input
                  className="cf-form-input"
                  value={form.phone}
                  onChange={setField("phone")}
                  placeholder="e.g. +1 555-0199"
                />
              </div>
            </div>

            <div className="cf-form-group">
              <label>Residential Address</label>
              <input
                className="cf-form-input"
                value={form.address}
                onChange={setField("address")}
                placeholder="Campus Dorm Block A, Room 302"
              />
            </div>

            <div className="cf-form-group">
              <label>Student Account Password *</label>
              <input
                className="cf-form-input"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={setField("password")}
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>

          <div className="cf-modal-footer">
            <button
              type="button"
              className="cf-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cf-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 size={15} className="cf-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              {submitting ? "Enrolling..." : "Enroll Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── View Student Profile Modal ── */
function StudentProfileModal({ student, onClose }) {
  if (!student) return null;
  const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student Profile";

  return (
    <div
      className="cf-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cf-modal" style={{ maxWidth: "480px" }}>
        <div className="cf-modal-header">
          <h2 className="cf-modal-title">Student Profile</h2>
          <button className="cf-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cf-modal-body">
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: "var(--accent-soft)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                {fullName}
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                {student.roll_number || "No Roll #"}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
            <div style={{ padding: "10px", background: "var(--bg-elevated)", borderRadius: "6px" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Department
              </span>
              <strong style={{ color: "var(--text-primary)" }}>{student.department || "—"}</strong>
            </div>

            <div style={{ padding: "10px", background: "var(--bg-elevated)", borderRadius: "6px" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Semester
              </span>
              <strong style={{ color: "var(--text-primary)" }}>
                {student.semester ? `Semester ${student.semester}` : "—"}
              </strong>
            </div>

            <div style={{ padding: "10px", background: "var(--bg-elevated)", borderRadius: "6px" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Email
              </span>
              <span style={{ color: "var(--text-primary)", wordBreak: "break-all" }}>
                {student.email || "—"}
              </span>
            </div>

            <div style={{ padding: "10px", background: "var(--bg-elevated)", borderRadius: "6px" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Phone
              </span>
              <span style={{ color: "var(--text-primary)" }}>{student.phone || "—"}</span>
            </div>
          </div>

          {student.address && (
            <div style={{ marginTop: "12px", padding: "10px", background: "var(--bg-elevated)", borderRadius: "6px", fontSize: "13px" }}>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Address
              </span>
              <span style={{ color: "var(--text-primary)" }}>{student.address}</span>
            </div>
          )}
        </div>

        <div className="cf-modal-footer">
          <button className="cf-secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/students/");
      const data = response.data;
      setStudents(
        Array.isArray(data)
          ? data
          : data?.students || data?.data || data?.results || []
      );
    } catch (err) {
      console.error("Students API error:", err);
      setError("Unable to retrieve student directory from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const departments = useMemo(() => {
    return [
      ...new Set(
        students
          .map((s) => s.department)
          .filter(Boolean)
      ),
    ];
  }, [students]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name || "this student"}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/students/${id}`);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete student.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    if (departmentFilter === "all") return students;
    return students.filter((s) => s.department === departmentFilter);
  }, [students, departmentFilter]);

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const dateStr = new Date().toISOString().split("T")[0];
    const headers = ["Roll Number", "First Name", "Last Name", "Email", "Department", "Semester", "Phone"];
    const rows = filteredStudents.map((s) => [
      s.roll_number || "",
      s.first_name || "",
      s.last_name || "",
      s.email || "",
      s.department || "",
      s.semester || "",
      s.phone || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `CampusFlow_Student_Directory_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table Columns
  const columns = [
    {
      header: "Student",
      accessor: "name",
      render: (_, s) => {
        const name = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Student";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "var(--accent-soft)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>
                {name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {s.email || "No email"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Roll Number",
      accessor: "roll_number",
      cellStyle: { width: "130px" },
      render: (val) => (
        <span
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "12px",
            color: "var(--text-muted)",
            fontWeight: 600,
          }}
        >
          {val || "—"}
        </span>
      ),
    },
    {
      header: "Department",
      accessor: "department",
      render: (val) => (
        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
          {val || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Semester",
      accessor: "semester",
      cellStyle: { width: "100px" },
      render: (val) => (
        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
          {val ? `Sem ${val}` : "—"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cellStyle: { width: "100px" },
      render: () => <StatusBadge status="Active" size="sm" />,
    },
    {
      header: "Actions",
      cellStyle: { width: "100px", textAlign: "right" },
      render: (_, s) => {
        const name = `${s.first_name || ""} ${s.last_name || ""}`.trim();
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
            <button
              className="cf-icon-btn"
              title="View Profile"
              onClick={() => setSelectedStudent(s)}
            >
              <Eye size={14} />
            </button>
            <button
              className="cf-icon-btn"
              style={{ color: "var(--danger)" }}
              title="Remove Student"
              disabled={deletingId === s.id}
              onClick={() => handleDelete(s.id, name)}
            >
              {deletingId === s.id ? (
                <Loader2 size={13} className="cf-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="cf-page">
      <PageHeader
        title="Student Directory"
        subtitle="Manage enrolled student records, departmental distribution, and academic profiles."
        badge={`${students.length} Total Enrolled`}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="cf-secondary-btn"
              onClick={handleExportCSV}
              title="Download directory as CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              className="cf-primary-btn"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={15} />
              <span>Add Student</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Total Students"
          value={students.length}
          icon={Users}
          trend="Active enrollment"
          variant="default"
        />
        <StatCard
          label="Active Departments"
          value={departments.length}
          icon={Building2}
          trend="Faculties & Programs"
          variant="default"
        />
        <StatCard
          label="Current Term"
          value="AY 2026-27"
          icon={GraduationCap}
          trend="Semester in session"
          variant="success"
        />
      </div>

      {/* Directory Table */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        isLoading={loading}
        searchPlaceholder="Search by name, roll number, or email..."
        emptyMessage="No students match the current filters."
        filters={
          <select
            className="cf-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        }
      />

      {/* Modals */}
      {showAddModal && (
        <StudentModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadStudents();
          }}
        />
      )}

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
