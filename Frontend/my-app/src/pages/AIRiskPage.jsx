/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Info,
} from "lucide-react";
import api from "../services/api";
import "./Pages.css";

function AIRiskPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [error, setError] = useState("");

  const loadRiskData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/analytics/risk");

      setStudents(response.data?.students || []);
    } catch (err) {
      console.error("Failed to load AI risk data:", err);
      setError("Unable to load academic risk data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const name = String(student.name || "").toLowerCase();
      const roll = String(student.roll_no || "").toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        roll.includes(query);

      const matchesRisk =
        riskFilter === "ALL" ||
        student.risk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [students, search, riskFilter]);

  const highRisk = students.filter(
    (student) => student.risk === "HIGH"
  ).length;

  const mediumRisk = students.filter(
    (student) => student.risk === "MEDIUM"
  ).length;

  const lowRisk = students.filter(
    (student) => student.risk === "LOW"
  ).length;

  if (loading) {
    return (
      <div className="cf-page">
        <div className="cf-loading">
          Analyzing student performance...
        </div>
      </div>
    );
  }

  return (
    <div className="cf-page">

      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">
            ACADEMIC INTELLIGENCE
          </div>

          <h1 className="cf-page-title">
            AI Risk Analysis
          </h1>

          <p className="cf-page-subtitle">
            Identify students who may require academic
            attention using attendance and performance data.
          </p>
        </div>

        <button
          className="cf-primary-btn"
          onClick={() => loadRiskData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "cf-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh Analysis"}
        </button>
      </div>

      {error && (
        <div className="cf-error">
          {error}
        </div>
      )}

      {/* Risk Summary */}
      <div className="risk-summary-grid">

        <div className="risk-summary-card high">
          <div className="risk-card-icon">
            <ShieldAlert size={22} />
          </div>

          <div>
            <div className="risk-card-label">
              HIGH RISK
            </div>

            <div className="risk-card-number">
              {highRisk}
            </div>

            <div className="risk-card-description">
              Immediate attention
            </div>
          </div>
        </div>

        <div className="risk-summary-card medium">
          <div className="risk-card-icon">
            <AlertTriangle size={22} />
          </div>

          <div>
            <div className="risk-card-label">
              MEDIUM RISK
            </div>

            <div className="risk-card-number">
              {mediumRisk}
            </div>

            <div className="risk-card-description">
              Needs monitoring
            </div>
          </div>
        </div>

        <div className="risk-summary-card low">
          <div className="risk-card-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <div className="risk-card-label">
              LOW RISK
            </div>

            <div className="risk-card-number">
              {lowRisk}
            </div>

            <div className="risk-card-description">
              Performing normally
            </div>
          </div>
        </div>

      </div>

      {/* Toolbar */}
      <div className="cf-toolbar">

        <div className="cf-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="cf-select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>

      </div>

      {/* Table */}
      <div className="cf-table-card">

        <div className="cf-table-wrapper">

          <table className="cf-table">

            <thead>
              <tr>
                <th>Student</th>
                <th>Attendance</th>
                <th>Marks</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Reason</th>
              </tr>
            </thead>

            <tbody>

              {filteredStudents.length === 0 ? (

                <tr>
                  <td colSpan="6">

                    <div className="cf-empty">
                      <Info size={30} />

                      <p>
                        No students found
                      </p>
                    </div>

                  </td>
                </tr>

              ) : (

                filteredStudents.map((student) => (

                  <tr key={student.student_id}>

                    <td>
                      <div className="cf-student">

                        <div className="cf-avatar">
                          {String(
                            student.name || "S"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div className="cf-student-name">
                            {student.name}
                          </div>

                          <div className="cf-student-email">
                            {student.roll_no}
                          </div>
                        </div>

                      </div>
                    </td>

                    <td>
                      <strong>
                        {Number(
                          student.attendance || 0
                        ).toFixed(1)}
                        %
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {Number(
                          student.average_marks || 0
                        ).toFixed(1)}
                        %
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {student.risk_score}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`risk-badge ${String(
                          student.risk || ""
                        ).toLowerCase()}`}
                      >
                        {student.risk}
                      </span>
                    </td>

                    <td>
                      <div className="risk-reason">
                        {student.reasons?.length
                          ? student.reasons.join(", ")
                          : "No major concerns"}
                      </div>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        <div className="cf-table-footer">
          Showing {filteredStudents.length} of{" "}
          {students.length} students
        </div>

      </div>

    </div>
  );
}

export default AIRiskPage;