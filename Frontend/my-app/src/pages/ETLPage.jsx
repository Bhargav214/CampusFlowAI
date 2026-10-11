import { useState, useRef, useCallback } from "react";
import api from "../services/api";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Database,
  X,
  Eye,
  CloudUpload,
} from "lucide-react";
import "../pages/Pages.css";

/* ─── CSV preview helper ─────────────────────────────────────── */
function parseCSVPreview(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const lines = e.target.result.split("\n").filter(Boolean).slice(0, 6);
    const rows = lines.map((l) =>
      l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
    );
    callback(rows);
  };
  reader.readAsText(file);
}

function CSVPreviewTable({ rows }) {
  if (!rows || rows.length < 2) return null;
  const [header, ...body] = rows;
  return (
    <div className="etl-preview">
      <div className="etl-preview-title">
        <Eye size={14} />
        File Preview (first {body.length} rows)
      </div>
      <div className="etl-preview-scroll">
        <table className="etl-preview-table">
          <thead>
            <tr>
              {header.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ETLPage() {
  const [type, setType] = useState("attendance");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleFile = useCallback((selected) => {
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError("");
    setPreview(null);
    if (
      selected.name.toLowerCase().endsWith(".csv") ||
      selected.name.toLowerCase().endsWith(".txt")
    ) {
      parseCSVPreview(selected, setPreview);
    }
  }, []);

  /* Drag-drop handlers */
  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please select or drop a CSV / Excel file.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError("");
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append("file", file);
      setProgress(40);
      const res = await api.post(`/etl/${type}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 60) + 40);
        },
      });
      setProgress(100);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Data import failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="cf-page">
      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div className="cf-eyebrow">DATA ENGINEERING</div>
          <h1 className="cf-page-title">ETL Data Center</h1>
          <p className="cf-page-subtitle">
            Import attendance and marks data into CampusFlow using CSV or Excel
            files. Drag and drop supported.
          </p>
        </div>
      </div>

      <div className="etl-layout">
        {/* Left: type select + drop zone */}
        <div className="etl-left">
          {/* Type selector */}
          <div className="etl-type-row">
            <button
              className={`etl-type-btn ${type === "attendance" ? "active-blue" : ""}`}
              onClick={() => {
                setType("attendance");
                clearFile();
              }}
            >
              <Database size={20} />
              <div>
                <p>Attendance</p>
                <span>student_id, subject_id, date, status</span>
              </div>
            </button>
            <button
              className={`etl-type-btn ${type === "marks" ? "active-purple" : ""}`}
              onClick={() => {
                setType("marks");
                clearFile();
              }}
            >
              <FileSpreadsheet size={20} />
              <div>
                <p>Marks</p>
                <span>student_id, subject_id, exam_type, marks…</span>
              </div>
            </button>
          </div>

          {/* Drop zone */}
          <div
            className={`etl-dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !file && inputRef.current?.click()}
          >
            {file ? (
              <div className="etl-file-info">
                <FileSpreadsheet size={36} className="etl-file-icon" />
                <div>
                  <strong>{file.name}</strong>
                  <span>
                    {(file.size / 1024).toFixed(1)} KB ·{" "}
                    {type === "attendance" ? "Attendance" : "Marks"} import
                  </span>
                </div>
                <button className="etl-clear-btn" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <CloudUpload size={44} className="etl-drop-icon" />
                <h3>Drop your file here</h3>
                <p>or click to browse</p>
                <span className="etl-formats">CSV · XLSX · XLS</span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {/* Progress bar */}
          {loading && (
            <div className="etl-progress-wrap">
              <div
                className="etl-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Import button */}
          <button
            className="cf-primary-btn etl-submit"
            onClick={uploadFile}
            disabled={loading || !file}
          >
            <Upload size={17} />
            {loading ? "Processing…" : "Validate & Import"}
          </button>

          {/* Error */}
          {error && (
            <div className="cf-error">
              <AlertTriangle size={17} />
              {typeof error === "string"
                ? error
                : JSON.stringify(error, null, 2)}
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="etl-success">
              <div className="etl-success-header">
                <CheckCircle size={22} />
                <strong>Import Successful</strong>
              </div>
              <div className="etl-success-stats">
                <div>
                  <span>Records received</span>
                  <strong>
                    {result.records_received ?? result.records_processed ?? "—"}
                  </strong>
                </div>
                <div>
                  <span>Inserted</span>
                  <strong>
                    {result.inserted ?? result.records_inserted ?? "—"}
                  </strong>
                </div>
                <div>
                  <span>Skipped</span>
                  <strong>{result.skipped ?? result.duplicates ?? 0}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: CSV preview */}
        <div className="etl-right">
          {preview ? (
            <CSVPreviewTable rows={preview} />
          ) : (
            <div className="etl-preview-placeholder">
              <Eye size={36} />
              <p>File preview will appear here once you select a CSV file.</p>
            </div>
          )}

          {/* Format guide */}
          <div className="etl-guide">
            <div className="etl-guide-title">
              Expected Columns — {type === "attendance" ? "Attendance" : "Marks"}
            </div>
            {type === "attendance" ? (
              <ul>
                <li><code>student_id</code> — numeric ID</li>
                <li><code>subject_id</code> — numeric ID</li>
                <li><code>date</code> — YYYY-MM-DD</li>
                <li><code>status</code> — present / absent</li>
              </ul>
            ) : (
              <ul>
                <li><code>student_id</code> — numeric ID</li>
                <li><code>subject_id</code> — numeric ID</li>
                <li><code>exam_type</code> — midterm / final / quiz</li>
                <li><code>marks_obtained</code> — number</li>
                <li><code>max_marks</code> — number</li>
                <li><code>grade</code> — A / B / C…</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}