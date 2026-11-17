import React, { useState } from "react";
import {
  Sparkles,
  Search,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  Database,
  TrendingDown,
  Award,
  BookOpen,
} from "lucide-react";
import api from "../../services/api";

const QUICK_PROMPTS = [
  {
    label: "Attendance shortage (< 75%)",
    icon: TrendingDown,
    query: "Show students with attendance below 75%",
  },
  {
    label: "High risk students needing intervention",
    icon: AlertCircle,
    query: "List high risk students",
  },
  {
    label: "Top 5 academic performers",
    icon: Award,
    query: "Top 5 students by average marks",
  },
  {
    label: "Subject-wise average performance",
    icon: BookOpen,
    query: "Subject wise average marks",
  },
];

export default function AskCampusFlowAI() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (textToSearch) => {
    const q = textToSearch || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/analytics/ask", { query: q.trim() });
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to query CampusFlow AI. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chipQuery) => {
    setQuery(chipQuery);
    handleSearch(chipQuery);
  };

  const handleClear = () => {
    setQuery("");
    setResult(null);
    setError(null);
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "18px 20px",
        marginBottom: "24px",
        boxShadow: "var(--shadow-sm)",
        transition: "border-color 0.15s ease",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.2px",
              }}
            >
              Ask CampusFlow AI
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginLeft: "8px",
              }}
            >
              Natural Language Data Query Engine
            </span>
          </div>
        </div>

        {result && (
          <button
            onClick={handleClear}
            className="cf-secondary-btn"
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <X size={13} />
            <span>Clear Results</span>
          </button>
        )}
      </div>

      {/* Query Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask CampusFlow AI about students, attendance, marks, or risk (e.g. 'Students failing in marks below 40')..."
            className="cf-form-input"
            style={{
              paddingLeft: "36px",
              height: "40px",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="cf-submit-btn"
          style={{
            height: "40px",
            padding: "0 18px",
            fontSize: "13px",
            borderRadius: "8px",
          }}
        >
          {loading ? (
            <Loader2 size={15} className="cf-spin" />
          ) : (
            <>
              <span>Ask AI</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Quick Prompt Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            marginRight: "4px",
          }}
        >
          Try asking:
        </span>
        {QUICK_PROMPTS.map((chip, idx) => {
          const ChipIcon = chip.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip.query)}
              className="cf-secondary-btn"
              style={{
                padding: "4px 10px",
                fontSize: "11px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
              }}
            >
              <ChipIcon size={12} style={{ color: "var(--accent)" }} />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            marginTop: "14px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.12)",
            color: "var(--danger)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Query Result Presentation */}
      {result && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "8px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={14} style={{ color: "var(--accent)" }} />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {result.answer_summary}
              </span>
            </div>
            <span
              className="status-badge variant-info size-sm"
              style={{ fontSize: "10px", textTransform: "uppercase" }}
            >
              {result.matched_intent?.replace(/_/g, " ") || "SQL TELEMETRY"}
            </span>
          </div>

          {result.rows && result.rows.length > 0 ? (
            <div
              style={{
                overflowX: "auto",
                maxHeight: "260px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--bg-secondary)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {result.columns.map((col, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          padding: "8px 12px",
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom:
                          rIdx === result.rows.length - 1
                            ? "none"
                            : "1px solid var(--border)",
                        background:
                          rIdx % 2 === 0 ? "transparent" : "var(--bg-secondary)",
                      }}
                    >
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          style={{
                            padding: "8px 12px",
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {String(cell).includes("Critical") ||
                          String(cell).includes("HIGH") ? (
                            <span style={{ color: "var(--danger)", fontWeight: 700 }}>
                              {cell}
                            </span>
                          ) : String(cell).includes("MEDIUM") ||
                            String(cell).includes("Warning") ? (
                            <span style={{ color: "var(--warning)", fontWeight: 600 }}>
                              {cell}
                            </span>
                          ) : String(cell).includes("Distinction") ||
                            String(cell).includes("LOW") ? (
                            <span style={{ color: "var(--success)", fontWeight: 600 }}>
                              {cell}
                            </span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "12px",
              }}
            >
              No matching institutional records found for this query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
