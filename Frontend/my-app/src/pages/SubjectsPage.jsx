/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, X, Loader2, GraduationCap, Building2 } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import "./Pages.css";

/* ── Add Subject Modal ── */
function AddSubjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", subject_code: "" });
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSubmitting(true);
      setAlertMsg(null);
      await api.post("/subjects", {
        name: form.name.trim(),
        subject_code: form.subject_code.trim(),
      });
      setAlertMsg({ type: "success", text: "Subject created successfully!" });
      setTimeout(() => {
        onCreated();
      }, 700);
    } catch (err) {
      setAlertMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to add subject. Please verify the code.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="cf-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cf-modal" style={{ maxWidth: "440px" }}>
        <div className="cf-modal-header">
          <h2 className="cf-modal-title">Add Academic Subject</h2>
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
              <label>Subject / Course Name *</label>
              <input
                className="cf-form-input"
                required
                placeholder="e.g. Machine Learning & Neural Networks"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="cf-form-group">
              <label>Subject Code *</label>
              <input
                className="cf-form-input"
                required
                placeholder="e.g. CS401"
                value={form.subject_code}
                onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
              />
            </div>
          </div>

          <div className="cf-modal-footer">
            <button type="button" className="cf-secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cf-submit-btn" disabled={submitting}>
              {submitting ? <Loader2 size={15} className="cf-spin" /> : <Plus size={15} />}
              {submitting ? "Adding..." : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subjects");
      setSubjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name || "this subject"}"?`)) return;
    try {
      setDeletingId(id);
      await api.delete(`/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to delete subject.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
      render: (val) => (
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
              flexShrink: 0,
            }}
          >
            <BookOpen size={16} />
          </div>
          <div>
            <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>
              {val || "Unnamed Subject"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Course Code",
      accessor: "subject_code",
      cellStyle: { width: "140px" },
      render: (code) => (
        <span
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "12px",
            color: "var(--accent)",
            background: "var(--accent-soft)",
            padding: "3px 8px",
            borderRadius: "4px",
            fontWeight: 700,
          }}
        >
          {code || "—"}
        </span>
      ),
    },
    {
      header: "Status",
      cellStyle: { width: "110px" },
      render: () => <StatusBadge status="Active" size="sm" />,
    },
    {
      header: "Actions",
      cellStyle: { width: "80px", textAlign: "right" },
      render: (_, s) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <button
            className="cf-icon-btn"
            style={{ color: "var(--danger)" }}
            title="Delete Subject"
            disabled={deletingId === s.id}
            onClick={() => handleDeleteSubject(s.id, s.name)}
          >
            {deletingId === s.id ? (
              <Loader2 size={13} className="cf-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="cf-page">
      <PageHeader
        title="Subjects & Curriculum"
        subtitle="Manage academic courses, subject codes, and curriculum offerings across faculties."
        badge={`${subjects.length} Courses`}
        actions={
          <button
            className="cf-primary-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={15} />
            <span>Add Subject</span>
          </button>
        }
      />

      {/* KPI Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label="Total Subjects"
          value={subjects.length}
          icon={BookOpen}
          trend="Course catalog"
          variant="default"
        />
        <StatCard
          label="Active Status"
          value="100%"
          icon={GraduationCap}
          trend="Accredited courses"
          variant="success"
        />
        <StatCard
          label="Curriculum Units"
          value={subjects.length}
          icon={Building2}
          trend="Department mapped"
          variant="default"
        />
      </div>

      {/* Subjects Data Table */}
      <DataTable
        columns={columns}
        data={subjects}
        isLoading={loading}
        searchPlaceholder="Search subjects by name or course code..."
        emptyMessage="No subjects found in the catalog."
      />

      {showAddModal && (
        <AddSubjectModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            fetchSubjects();
          }}
        />
      )}
    </div>
  );
}
