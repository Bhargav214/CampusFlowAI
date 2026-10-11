/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Trash2,
} from "lucide-react";

import {
  getFaculty,
  createFaculty,
  deleteFaculty,
} from "../services/facultyservice";
import "./Pages.css";

/* ── Add Faculty Modal ── */
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

function AddFacultyModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FACULTY);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    try {
      await createFaculty(form);
      setAlert({ type: "success", msg: "Faculty member added successfully!" });
      setForm(EMPTY_FACULTY);
      onCreated();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data)
          ? err.response.data.map((e) => e.msg).join(", ")
          : "Failed to add faculty.");
      setAlert({ type: "error", msg: detail });
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
          <h2 className="cf-modal-title">Add New Faculty</h2>
          <button className="cf-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cf-modal-body">
            {alert && (
              <div className={`cf-form-alert ${alert.type}`}>{alert.msg}</div>
            )}

            <div className="cf-form-group">
              <label>Faculty ID *</label>
              <input
                className="cf-form-input"
                required
                value={form.faculty_id}
                onChange={set("faculty_id")}
                placeholder="e.g. FAC2024001"
              />
            </div>

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>First Name *</label>
                <input
                  className="cf-form-input"
                  required
                  value={form.first_name}
                  onChange={set("first_name")}
                  placeholder="e.g. Jane"
                />
              </div>
              <div className="cf-form-group">
                <label>Last Name *</label>
                <input
                  className="cf-form-input"
                  required
                  value={form.last_name}
                  onChange={set("last_name")}
                  placeholder="e.g. Smith"
                />
              </div>
            </div>

            <div className="cf-form-group">
              <label>Email *</label>
              <input
                className="cf-form-input"
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="faculty@example.com"
              />
            </div>

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>Department</label>
                <input
                  className="cf-form-input"
                  value={form.department}
                  onChange={set("department")}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className="cf-form-group">
                <label>Designation</label>
                <input
                  className="cf-form-input"
                  value={form.designation}
                  onChange={set("designation")}
                  placeholder="e.g. Associate Professor"
                />
              </div>
            </div>

            <div className="cf-form-group">
              <label>Phone</label>
              <input
                className="cf-form-input"
                value={form.phone}
                onChange={set("phone")}
                placeholder="e.g. 9876543210"
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
                onChange={set("password")}
                placeholder="Min 8 characters"
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

/* ── Faculty Page ── */
function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getFaculty();
      setFaculty(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to load faculty"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this faculty member?")) return;
    try {
      await deleteFaculty(id);
      setFaculty((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const departments = useMemo(() => {
    return [...new Set(faculty.map((m) => m.department).filter(Boolean))];
  }, [faculty]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return faculty.filter((m) => {
      const name = `${m.first_name || ""} ${m.last_name || ""}`.trim();
      const matchesSearch =
        name.toLowerCase().includes(q) ||
        (m.faculty_id || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q);
      const matchesDept =
        department === "all" || m.department === department;
      return matchesSearch && matchesDept;
    });
  }, [faculty, search, department]);

  return (
    <div className="cf-page">

      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">Campus Management</div>
          <h1 className="cf-page-title">Faculty</h1>
          <p className="cf-page-subtitle">
            Manage faculty records and department assignments
          </p>
        </div>

        <button
          className="cf-primary-btn"
          onClick={() => setShowModal(true)}
        >
          <UserPlus size={17} />
          Add Faculty
        </button>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="cf-stat-grid cf-student-stats">
          <div className="cf-stat">
            <div className="cf-stat-top">
              <div className="cf-stat-icon">
                <Users size={19} />
              </div>
              <span className="cf-stat-trend">Active</span>
            </div>
            <div className="cf-stat-label">Total Faculty</div>
            <div className="cf-stat-value">{faculty.length}</div>
            <div className="cf-stat-description">Faculty members enrolled</div>
          </div>

          <div className="cf-stat">
            <div className="cf-stat-top">
              <div className="cf-stat-icon">
                <Building2 size={19} />
              </div>
            </div>
            <div className="cf-stat-label">Departments</div>
            <div className="cf-stat-value">{departments.length}</div>
            <div className="cf-stat-description">Academic departments</div>
          </div>

          <div className="cf-stat">
            <div className="cf-stat-top">
              <div className="cf-stat-icon">
                <Search size={19} />
              </div>
            </div>
            <div className="cf-stat-label">Filtered Results</div>
            <div className="cf-stat-value">{filtered.length}</div>
            <div className="cf-stat-description">Matching current filters</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="cf-toolbar">
        <div className="cf-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search by name, ID or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="cf-select"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="cf-table-card">
        {loading && (
          <div className="cf-loading">
            <div className="cf-spinner" />
            Loading faculty...
          </div>
        )}

        {error && !loading && (
          <div className="cf-error">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="cf-table-header">
              <h3>Faculty Directory</h3>
              <p>{filtered.length} faculty found</p>
            </div>

            <div className="cf-table-wrapper">
              <table className="cf-table">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Faculty ID</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Phone</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="cf-empty">
                          <Users size={34} />
                          <p>No faculty found</p>
                          <span>Try changing your search or filter.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((member) => {
                      const name =
                        `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
                        "Unknown";
                      return (
                        <tr key={member.id}>
                          <td>
                            <div className="cf-student">
                              <div className="cf-avatar">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="cf-student-name">{name}</div>
                                <div className="cf-student-email">
                                  {member.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="cf-roll">
                              {member.faculty_id || "—"}
                            </span>
                          </td>

                          <td>
                            <span className="cf-department">
                              {member.department || "—"}
                            </span>
                          </td>

                          <td>
                            <span className="cf-badge cf-badge-blue">
                              {member.designation || "—"}
                            </span>
                          </td>

                          <td>{member.phone || "—"}</td>

                          <td>
                            <button
                              className="cf-icon-btn"
                              title="Delete faculty"
                              onClick={() => handleDelete(member.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="cf-table-footer">
              <span>
                Showing {filtered.length} of {faculty.length} faculty
              </span>

              <div className="cf-pagination">
                <button className="cf-page-btn">
                  <ChevronLeft size={15} />
                </button>
                <button className="cf-page-btn active">1</button>
                <button className="cf-page-btn">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <AddFacultyModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            loadFaculty();
          }}
        />
      )}
    </div>
  );
}

export default FacultyPage;