/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  GraduationCap,
  UserPlus,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

import {
  getFaculty,
  createFaculty,
  deleteFaculty,
} from "../services/facultyservice";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import "./Pages.css";

const EMPTY_FACULTY = {
  faculty_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  password: "",
};

/* ── Add Faculty Modal ── */
function AddFacultyModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FACULTY);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlertMsg(null);

    try {
      await createFaculty(form);
      setAlertMsg({ type: "success", text: "Faculty member added successfully!" });
      setTimeout(() => {
        onCreated();
      }, 700);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data)
          ? err.response.data.map((e) => e.msg).join(", ")
          : "Failed to add faculty member. Check if ID or Email already exists.");
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
          <h2 className="cf-modal-title">Add New Faculty Member</h2>
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

            <div className="cf-form-group">
              <label>Faculty ID *</label>
              <input
                className="cf-form-input"
                required
                value={form.faculty_id}
                onChange={setField("faculty_id")}
                placeholder="e.g. FAC202601"
              />
            </div>

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>First Name *</label>
                <input
                  className="cf-form-input"
                  required
                  value={form.first_name}
                  onChange={setField("first_name")}
                  placeholder="e.g. Jane"
                />
              </div>
              <div className="cf-form-group">
                <label>Last Name *</label>
                <input
                  className="cf-form-input"
                  required
                  value={form.last_name}
                  onChange={setField("last_name")}
                  placeholder="e.g. Smith"
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
                placeholder="jane.smith@campus.edu"
              />
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
                <label>Designation</label>
                <input
                  className="cf-form-input"
                  value={form.designation}
                  onChange={setField("designation")}
                  placeholder="e.g. Associate Professor"
                />
              </div>
            </div>

            <div className="cf-form-group">
              <label>Phone Number</label>
              <input
                className="cf-form-input"
                value={form.phone}
                onChange={setField("phone")}
                placeholder="e.g. +1 555-0210"
              />
            </div>

            <div className="cf-form-group">
              <label>Password *</label>
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
              {submitting ? "Adding..." : "Add Faculty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getFaculty();
      setFaculty(Array.isArray(data) ? data : data?.faculty || data?.data || []);
    } catch (err) {
      console.error("Faculty API error:", err);
      setError("Unable to load faculty records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const departments = useMemo(() => {
    return [
      ...new Set(
        faculty
          .map((f) => f.department)
          .filter(Boolean)
      ),
    ];
  }, [faculty]);

  const designations = useMemo(() => {
    return [
      ...new Set(
        faculty
          .map((f) => f.designation)
          .filter(Boolean)
      ),
    ];
  }, [faculty]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name || "this faculty member"}?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteFaculty(id);
      setFaculty((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete faculty member.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFaculty = useMemo(() => {
    if (departmentFilter === "all") return faculty;
    return faculty.filter((f) => f.department === departmentFilter);
  }, [faculty, departmentFilter]);

  const columns = [
    {
      header: "Faculty Member",
      accessor: "name",
      render: (_, f) => {
        const name = `${f.first_name || ""} ${f.last_name || ""}`.trim() || "Faculty";
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
                {f.email || "No email"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Faculty ID",
      accessor: "faculty_id",
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
      header: "Designation",
      accessor: "designation",
      render: (val) => (
        <span style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>
          {val || "Faculty"}
        </span>
      ),
    },
    {
      header: "Status",
      cellStyle: { width: "100px" },
      render: () => <StatusBadge status="Active" size="sm" />,
    },
    {
      header: "Actions",
      cellStyle: { width: "80px", textAlign: "right" },
      render: (_, f) => {
        const name = `${f.first_name || ""} ${f.last_name || ""}`.trim();
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <button
              className="cf-icon-btn"
              style={{ color: "var(--danger)" }}
              title="Delete Faculty"
              disabled={deletingId === f.id}
              onClick={() => handleDelete(f.id, name)}
            >
              {deletingId === f.id ? (
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
        title="Faculty Directory"
        subtitle="Manage academic staff, department assignments, and professor designations."
        badge={`${faculty.length} Faculty Members`}
        actions={
          <button
            className="cf-primary-btn"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={15} />
            <span>Add Faculty</span>
          </button>
        }
      />

      {/* KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Total Faculty"
          value={faculty.length}
          icon={Users}
          trend="Teaching staff"
          variant="default"
        />
        <StatCard
          label="Departments"
          value={departments.length}
          icon={Building2}
          trend="Assigned departments"
          variant="default"
        />
        <StatCard
          label="Designations"
          value={designations.length}
          icon={GraduationCap}
          trend="Academic ranks"
          variant="success"
        />
      </div>

      {/* Directory Table */}
      <DataTable
        columns={columns}
        data={filteredFaculty}
        isLoading={loading}
        searchPlaceholder="Search by name, ID, or email..."
        emptyMessage="No faculty records match the selected filter."
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

      {/* Modal */}
      {showAddModal && (
        <AddFacultyModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            loadFaculty();
          }}
        />
      )}
    </div>
  );
}
