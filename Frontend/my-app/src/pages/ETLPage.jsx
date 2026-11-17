/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Database,
  Users,
  CalendarCheck,
  GraduationCap,
  Download,
  Eye,
  X,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";

import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import "./Pages.css";

const DATASET_SCHEMAS = {
  students: {
    label: "Students Roster",
    icon: Users,
    description: "Enrollment records including roll number, name, department and semester",
    headers: ["first_name", "last_name", "email", "roll_number", "department", "semester"],
    sampleRows: [
      ["John", "Doe", "john.doe@campus.edu", "CS2026001", "Computer Science", "1"],
      ["Sarah", "Connor", "sarah.c@campus.edu", "CS2026002", "Computer Science", "1"],
    ],
  },
  attendance: {
    label: "Attendance Records",
    icon: CalendarCheck,
    description: "Daily session presence records referencing student and subject IDs",
    headers: ["student_id", "subject_id", "date", "status"],
    sampleRows: [
      ["1", "1", "2026-11-17", "Present"],
      ["2", "1", "2026-11-17", "Absent"],
    ],
  },
  marks: {
    label: "Marks & Grades Dataset",
    icon: GraduationCap,
    description: "Exam performance records with marks obtained, max marks, and exam type",
    headers: ["student_id", "subject_id", "marks_obtained", "max_marks", "exam_type"],
    sampleRows: [
      ["1", "1", "88.5", "100", "Midterm Examination"],
      ["2", "1", "72.0", "100", "Midterm Examination"],
    ],
  },
};

export default function ETLPage() {
  const [selectedType, setSelectedType] = useState("attendance");
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [totalRowsCount, setTotalRowsCount] = useState(0);
  const [matchedHeaders, setMatchedHeaders] = useState([]);
  const [missingHeaders, setMissingHeaders] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pipelineResult, setPipelineResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef();

  const currentSchema = DATASET_SCHEMAS[selectedType];

  // Parse CSV client-side
  const parseClientCSV = (uploadedFile, schemaKey) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) return;

      const parsedRows = lines.slice(0, 11).map((line) =>
        line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
      );

      const headerRow = parsedRows[0].map((h) => h.toLowerCase());
      const expected = DATASET_SCHEMAS[schemaKey].headers;

      const matched = expected.filter((exp) => headerRow.includes(exp.toLowerCase()));
      const missing = expected.filter((exp) => !headerRow.includes(exp.toLowerCase()));

      setPreviewRows(parsedRows);
      setTotalRowsCount(Math.max(0, lines.length - 1));
      setMatchedHeaders(matched);
      setMissingHeaders(missing);
    };
    reader.readAsText(uploadedFile);
  };

  const handleSelectFile = useCallback((selected) => {
    if (!selected) return;
    setFile(selected);
    setPipelineResult(null);
    setErrorMsg("");

    if (
      selected.name.toLowerCase().endsWith(".csv") ||
      selected.name.toLowerCase().endsWith(".txt")
    ) {
      parseClientCSV(selected, selectedType);
    }
  }, [selectedType]);

  const clearSelection = () => {
    setFile(null);
    setPreviewRows([]);
    setTotalRowsCount(0);
    setMatchedHeaders([]);
    setMissingHeaders([]);
    setPipelineResult(null);
    setErrorMsg("");
  };

  // Switch dataset type
  const handleTypeChange = (typeKey) => {
    setSelectedType(typeKey);
    clearSelection();
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const schema = DATASET_SCHEMAS[selectedType];
    const headerLine = schema.headers.join(",");
    const sampleLines = schema.sampleRows.map((r) => r.join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(`${headerLine}\n${sampleLines}\n`);

    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `campusflow_template_${selectedType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute Backend ETL
  const handleRunETL = async () => {
    if (!file) {
      setErrorMsg("Please select or drop a valid CSV file before running the ETL pipeline.");
      return;
    }

    setUploading(true);
    setPipelineResult(null);
    setErrorMsg("");
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append("file", file);
      setUploadProgress(45);

      const res = await api.post(`/etl/${selectedType}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded / progressEvent.total) * 45) + 45;
            setUploadProgress(pct);
          }
        },
      });

      setUploadProgress(100);
      setPipelineResult(res.data);
    } catch (err) {
      const rawErrors = err.response?.data?.detail?.errors;
      let detailMsg = err.response?.data?.detail?.message;
      if (Array.isArray(rawErrors) && rawErrors.length > 0) {
        const errorList = rawErrors
          .map((e) =>
            typeof e === "object"
              ? `Row ${e.row_number || "?"} [${e.column || "Field"}]: ${e.error_message || JSON.stringify(e)}`
              : e
          )
          .join("; ");
        detailMsg = detailMsg ? `${detailMsg} — ${errorList}` : errorList;
      } else if (!detailMsg && err.response?.data?.detail) {
        detailMsg =
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail);
      }
      setErrorMsg(detailMsg || "Data ingestion pipeline encountered an error.");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Stepper Stage Calculation
  let currentStep = 1;
  if (file && previewRows.length > 0) currentStep = 2;
  if (uploading) currentStep = 3;
  if (pipelineResult) currentStep = 4;

  return (
    <div className="cf-page">
      <PageHeader
        title="ETL Data Pipeline Center"
        subtitle="Automated extraction, schema validation, transformation, and database ingestion for academic records."
        badge="PostgreSQL Engine Connected"
        actions={
          <button
            className="cf-secondary-btn"
            onClick={handleDownloadTemplate}
            title="Download CSV Starter Template"
          >
            <Download size={14} />
            <span>Download Sample CSV Template</span>
          </button>
        }
      />

      {/* ── 1. VISUAL 4-STAGE PIPELINE STEPPER ── */}
      <div
        className="surface-card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          background: "var(--bg-secondary)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {[
            { step: 1, label: "1. Upload Source CSV", sub: "Select or drop file" },
            { step: 2, label: "2. Schema Pre-Flight", sub: "Validate headers & rows" },
            { step: 3, label: "3. Transform & Clean", sub: "Type coercion & sanity" },
            { step: 4, label: "4. Load to PostgreSQL", sub: "Atomic database commit" },
          ].map((st) => {
            const isActive = currentStep === st.step;
            const isCompleted = currentStep > st.step;

            return (
              <div
                key={st.step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  border: `1px solid ${
                    isActive
                      ? "var(--accent)"
                      : isCompleted
                      ? "var(--success)"
                      : "transparent"
                  }`,
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: isCompleted
                      ? "var(--success)"
                      : isActive
                      ? "var(--accent)"
                      : "var(--bg-elevated)",
                    color: isCompleted || isActive ? "#FFFFFF" : "var(--text-muted)",
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={13} /> : st.step}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: isActive
                        ? "var(--text-primary)"
                        : isCompleted
                        ? "var(--success)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {st.label}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {st.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. DATASET TYPE SELECTOR ── */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--text-muted)",
            marginBottom: "8px",
          }}
        >
          Select Destination Dataset Schema
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          {Object.entries(DATASET_SCHEMAS).map(([key, item]) => {
            const isSelected = selectedType === key;
            const Icon = item.icon;

            return (
              <div
                key={key}
                onClick={() => handleTypeChange(key)}
                className="surface-card"
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  borderColor: isSelected ? "var(--accent)" : "var(--border)",
                  background: isSelected ? "var(--accent-soft)" : "var(--bg-card)",
                  transition: "all var(--transition-fast)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: isSelected ? "var(--accent)" : "var(--bg-elevated)",
                    color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {item.label}
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. DROPZONE & CLIENT PRE-FLIGHT ── */}
      <div className="surface-card" style={{ padding: "24px", marginBottom: "20px" }}>
        {/* Dropzone */}
        {!file && (
          <div
            className={`etl-dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleSelectFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt"
              style={{ display: "none" }}
              onChange={(e) => handleSelectFile(e.target.files[0])}
            />
            <Upload size={32} style={{ color: "var(--accent)", opacity: 0.8 }} />
            <h3>Drop your {currentSchema.label} CSV file here</h3>
            <p>Or click to browse from local computer (.csv format supported)</p>
            <span className="etl-formats">Expected headers: {currentSchema.headers.join(", ")}</span>
          </div>
        )}

        {/* Selected File Card & Pre-Flight Validation */}
        {file && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <FileSpreadsheet size={24} color="var(--accent)" />
                <div>
                  <strong style={{ color: "var(--text-primary)", fontSize: "13px" }}>
                    {file.name}
                  </strong>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>
                    {(file.size / 1024).toFixed(1)} KB · {totalRowsCount} data rows detected
                  </span>
                </div>
              </div>

              <button
                className="cf-icon-btn"
                onClick={clearSelection}
                title="Remove File"
              >
                <X size={14} />
              </button>
            </div>

            {/* Validation Checklist Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "10px 14px",
                background: missingHeaders.length === 0 ? "var(--success-soft)" : "var(--warning-soft)",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "12px",
                color: missingHeaders.length === 0 ? "var(--success)" : "var(--warning)",
              }}
            >
              {missingHeaders.length === 0 ? (
                <>
                  <ShieldCheck size={16} />
                  <span>
                    <strong>Schema Validated:</strong> All {matchedHeaders.length} required columns matched correctly.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>
                    <strong>Schema Warning:</strong> Missing columns: {missingHeaders.join(", ")}. Please review before uploading.
                  </span>
                </>
              )}
            </div>

            {/* Table Preview */}
            {previewRows.length > 1 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                  <Eye size={13} />
                  <span>Pre-Flight Data Preview (First {previewRows.length - 1} rows)</span>
                </div>
                <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "6px" }}>
                  <table className="cf-table">
                    <thead>
                      <tr>
                        {previewRows[0].map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(1).map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ fontSize: "12px", padding: "8px 14px" }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {uploading && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  <span>Executing Pipeline...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="etl-progress-wrap">
                  <div className="etl-progress-bar" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="cf-form-alert error" style={{ marginBottom: "16px" }}>
                {errorMsg}
              </div>
            )}

            {/* Action Button */}
            <button
              className="cf-submit-btn"
              disabled={uploading}
              onClick={handleRunETL}
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
            >
              {uploading ? <Loader2 size={16} className="cf-spin" /> : <Database size={16} />}
              <span>{uploading ? "Ingesting Data into PostgreSQL..." : "Run ETL Pipeline & Commit to DB"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 4. EXECUTION SUMMARY CARD ── */}
      {pipelineResult && (
        <div
          className="surface-card"
          style={{
            padding: "20px",
            borderColor: "rgba(16, 185, 129, 0.4)",
            background: "var(--success-soft)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", color: "var(--success)" }}>
            <CheckCircle2 size={20} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
              {pipelineResult.message || "ETL Execution Succeeded"}
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <div style={{ padding: "12px", background: "var(--bg-card)", borderRadius: "6px", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Records Received
              </span>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                {pipelineResult.records_received ?? totalRowsCount}
              </div>
            </div>

            <div style={{ padding: "12px", background: "var(--bg-card)", borderRadius: "6px", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "11px", color: "var(--success)", textTransform: "uppercase" }}>
                Inserted / Committed
              </span>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--success)", marginTop: "2px" }}>
                {pipelineResult.inserted ?? pipelineResult.records_inserted ?? pipelineResult.records_received ?? 0}
              </div>
            </div>

            <div style={{ padding: "12px", background: "var(--bg-card)", borderRadius: "6px", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Skipped / Duplicates
              </span>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-secondary)", marginTop: "2px" }}>
                {pipelineResult.skipped ?? 0}
              </div>
            </div>

            <div style={{ padding: "12px", background: "var(--bg-card)", borderRadius: "6px", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Validation Status
              </span>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--success)", marginTop: "6px" }}>
                Verified & Loaded
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
