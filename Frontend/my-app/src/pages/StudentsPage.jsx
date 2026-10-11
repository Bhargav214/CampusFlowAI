/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Users,
  GraduationCap,
  Building2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Loader2,
} from "lucide-react";

import api from "../services/api";
import "./Pages.css";

/* ── Add Student Modal ── */
const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  roll_number: "",
  department: "",
  semester: "",
  phone: "",
  address: "",
  password: "",
};

function AddStudentModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', msg }

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);

    try {
      const payload = {
        ...form,
        semester: form.semester ? parseInt(form.semester, 10) : null,
      };
      await api.post("/students/", payload);
      setAlert({ type: "success", msg: "Student added successfully!" });
      setForm(EMPTY_FORM);
      onCreated();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data)
          ? err.response.data.map((e) => e.msg).join(", ")
          : "Failed to add student.");
      setAlert({ type: "error", msg: detail });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cf-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cf-modal">
        <div className="cf-modal-header">
          <h2 className="cf-modal-title">Add New Student</h2>
          <button className="cf-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cf-modal-body">
            {alert && (
              <div className={`cf-form-alert ${alert.type}`}>{alert.msg}</div>
            )}

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>First Name *</label>
                <input className="cf-form-input" required value={form.first_name} onChange={set("first_name")} placeholder="e.g. John" />
              </div>
              <div className="cf-form-group">
                <label>Last Name *</label>
                <input className="cf-form-input" required value={form.last_name} onChange={set("last_name")} placeholder="e.g. Doe" />
              </div>
            </div>

            <div className="cf-form-group">
              <label>Email *</label>
              <input className="cf-form-input" type="email" required value={form.email} onChange={set("email")} placeholder="student@example.com" />
            </div>

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>Roll Number *</label>
                <input className="cf-form-input" required value={form.roll_number} onChange={set("roll_number")} placeholder="e.g. CS2024001" />
              </div>
              <div className="cf-form-group">
                <label>Semester</label>
                <input className="cf-form-input" type="number" min="1" max="12" value={form.semester} onChange={set("semester")} placeholder="1–12" />
              </div>
            </div>

            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>Department</label>
                <input className="cf-form-input" value={form.department} onChange={set("department")} placeholder="e.g. Computer Science" />
              </div>
              <div className="cf-form-group">
                <label>Phone</label>
                <input className="cf-form-input" value={form.phone} onChange={set("phone")} placeholder="e.g. 9876543210" />
              </div>
            </div>

            <div className="cf-form-group">
              <label>Address</label>
              <input className="cf-form-input" value={form.address} onChange={set("address")} placeholder="Optional" />
            </div>

            <div className="cf-form-group">
              <label>Password *</label>
              <input className="cf-form-input" type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
            </div>
          </div>

          <div className="cf-modal-footer">
            <button type="button" className="cf-secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="cf-submit-btn" disabled={submitting}>
              {submitting ? <Loader2 size={15} className="cf-spin" /> : <UserPlus size={15} />}
              {submitting ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

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
      setError("Unable to load student data.");
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
          .map((student) => student.department)
          .filter(Boolean)
      ),
    ];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    return students.filter((student) => {
      const name =
        `${student.first_name || ""} ${
          student.last_name || ""
        }`.trim();

      const roll = student.roll_number || "";
      const dept = student.department || "";

      const matchesSearch =
        name.toLowerCase().includes(query) ||
        roll.toLowerCase().includes(query) ||
        (student.email || "").toLowerCase().includes(query);

      const matchesDepartment =
        department === "all" || dept === department;

      return matchesSearch && matchesDepartment;
    });
  }, [students, search, department]);

  const activeStudents = students.length;

  return (
    <>
    <div className="cf-page">

      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">
            Campus Management
          </div>

          <h1 className="cf-page-title">
            Students
          </h1>

          <p className="cf-page-subtitle">
            Manage student records and academic information
          </p>
        </div>

        <button className="cf-primary-btn" onClick={() => setShowModal(true)}>
          <UserPlus size={17} />
          Add Student
        </button>
      </div>

      {/* Overview cards */}
      {!loading && !error && (
        <div className="cf-stat-grid cf-student-stats">

          <div className="cf-stat">
            <div className="cf-stat-top">
              <div className="cf-stat-icon">
                <Users size={19} />
              </div>

              <span className="cf-stat-trend">
                Active
              </span>
            </div>

            <div className="cf-stat-label">
              Total Students
            </div>

            <div className="cf-stat-value">
              {activeStudents}
            </div>

            <div className="cf-stat-description">
              Students enrolled
            </div>
          </div>

          <div className="cf-stat">
            <div className="cf-stat-top">
              <div className="cf-stat-icon">
                <Building2 size={19} />
              </div>
            </div>

            <div className="cf-stat-label">
              Departments
            </div>

            <div className="cf-stat-value">
              {departments.length}
            </div>

            <div className="cf-stat-description">
              Academic departments
            </div>
          </div>

          <div className="cf-stat">
            <div className="cf-stat-top">
              <div className="cf-stat-icon">
                <GraduationCap size={19} />
              </div>
            </div>

            <div className="cf-stat-label">
              Current Semester
            </div>

            <div className="cf-stat-value">
              {students.length
                ? `Sem ${students[0]?.semester || "—"}`
                : "—"}
            </div>

            <div className="cf-stat-description">
              Current student records
            </div>
          </div>

        </div>
      )}

      {/* Toolbar */}
      <div className="cf-toolbar">

        <div className="cf-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search by name, roll number or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="cf-select"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="all">
            All Departments
          </option>

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
            Loading students...
          </div>
        )}

        {error && !loading && (
          <div className="cf-error">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="cf-table-header">
              <div>
                <h3>Student Directory</h3>
                <p>
                  {filteredStudents.length} students found
                </p>
              </div>
            </div>

            <div className="cf-table-wrapper">
              <table className="cf-table">

                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="cf-empty">
                          <Users size={34} />
                          <p>No students found</p>
                          <span>
                            Try changing your search or filter.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {

                      const name =
                        `${student.first_name || ""} ${
                          student.last_name || ""
                        }`.trim() || "Unknown Student";

                      return (
                        <tr key={student.id}>

                          <td>
                            <div className="cf-student">

                              <div className="cf-avatar">
                                {name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <div className="cf-student-name">
                                  {name}
                                </div>

                                <div className="cf-student-email">
                                  {student.email || "No email"}
                                </div>
                              </div>

                            </div>
                          </td>

                          <td>
                            <span className="cf-roll">
                              {student.roll_number || "—"}
                            </span>
                          </td>

                          <td>
                            <span className="cf-department">
                              {student.department || "—"}
                            </span>
                          </td>

                          <td>
                            Semester {student.semester || "—"}
                          </td>

                          <td>
                            <span className="cf-badge cf-badge-green">
                              Active
                            </span>
                          </td>

                          <td>
                            <button className="cf-icon-btn">
                              <MoreHorizontal size={18} />
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
                Showing {filteredStudents.length} of{" "}
                {students.length} students
              </span>

              <div className="cf-pagination">

                <button className="cf-page-btn">
                  <ChevronLeft size={15} />
                </button>

                <button className="cf-page-btn active">
                  1
                </button>

                <button className="cf-page-btn">
                  2
                </button>

                <button className="cf-page-btn">
                  3
                </button>

                <button className="cf-page-btn">
                  <ChevronRight size={15} />
                </button>

              </div>

            </div>
          </>
        )}

      </div>

    </div>

    {showModal && (
      <AddStudentModal
        onClose={() => setShowModal(false)}
        onCreated={() => {
          setShowModal(false);
          loadStudents();
        }}
      />
    )}
    </>
  );
}

export default StudentsPage;
