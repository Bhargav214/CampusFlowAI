/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Search, Book, X, Loader2 } from "lucide-react";
import api from "../services/api";
import "./Pages.css";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newSubject, setNewSubject] = useState({ name: "", subject_code: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subjects");
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    try {
      setSaving(true);
      const response = await api.post("/subjects", {
        name: newSubject.name.trim(),
        subject_code: newSubject.subject_code.trim(),
      });
      setSubjects(prev => [...prev, response.data]);
      setNewSubject({ name: "", subject_code: "" });
      setIsAdding(false);
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to add subject. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to delete subject.");
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const q = searchTerm.toLowerCase();
    return (s.name?.toLowerCase() || "").includes(q) || (s.subject_code?.toLowerCase() || "").includes(q);
  });

  return (
    <div className="cf-page">
      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">Academic Management</div>
          <h1 className="cf-page-title">Subjects</h1>
          <p className="cf-page-subtitle">Manage academic subjects and curriculum details</p>
        </div>
        <button className="cf-primary-btn" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Add Subject"}
        </button>
      </div>

      {/* Add Subject Form */}
      {isAdding && (
        <div className="cf-table-card" style={{ marginBottom: "16px", padding: "20px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
            Add New Subject
          </h2>
          <form onSubmit={handleAddSubject}>
            <div className="cf-form-row">
              <div className="cf-form-group">
                <label>Subject Name *</label>
                <input
                  className="cf-form-input"
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence"
                  value={newSubject.name}
                  onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                />
              </div>
              <div className="cf-form-group">
                <label>Subject Code</label>
                <input
                  className="cf-form-input"
                  type="text"
                  placeholder="e.g. BCA501"
                  value={newSubject.subject_code}
                  onChange={e => setNewSubject({ ...newSubject, subject_code: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <button type="button" className="cf-secondary-btn" onClick={() => setIsAdding(false)}>Cancel</button>
              <button type="submit" className="cf-submit-btn" disabled={saving}>
                {saving ? <Loader2 size={14} className="cf-spin" /> : <Plus size={14} />}
                {saving ? "Saving..." : "Save Subject"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="cf-toolbar">
        <div className="cf-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search subjects by name or code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="cf-loading"><Loader2 size={24} className="cf-spin" /><p>Loading subjects...</p></div>
      ) : filteredSubjects.length === 0 ? (
        <div className="cf-empty">
          <Book size={32} />
          <p>No subjects found</p>
          <span>{searchTerm ? "Try a different search." : "Add a subject to get started."}</span>
        </div>
      ) : (
        <div className="subject-cards-grid">
          {filteredSubjects.map(subject => (
            <div key={subject.id} className="subject-card">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "var(--radius-sm)", background: "var(--accent-dim)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "14px" }}>{subject.name}</div>
                  {subject.subject_code && (
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
                      Code: {subject.subject_code}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSubject(subject.id)}
                  style={{ width: "28px", height: "28px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "var(--danger)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                  title="Delete Subject"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
