import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, AlertCircle, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import "./Pages.css";

const DEMO_ACCOUNTS = [
  { role: "Admin Demo", icon: "👑", email: "admin@campusflow.com", pass: "admin123" },
  { role: "Faculty Demo", icon: "👨‍🏫", email: "faculty@campusflow.com", pass: "faculty123" },
  { role: "Student Demo", icon: "👨‍🎓", email: "student@campusflow.com", pass: "student123" },
  { role: "Parent Demo", icon: "👨‍👩‍👧", email: "parent@campusflow.com", pass: "parent123" },
];

function Feature({ icon, title, desc }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "24px" }}>
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "8px",
          background: "var(--accent-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>
          {title}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: "1.5" }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.access_token || res.data.token;
      const role = res.data.role;
      if (token) {
        login({ email, role }, token);
        navigate(role === "parent" ? "/parent-dashboard" : "/dashboard");
      } else {
        setError("No access token returned from server.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Left Form Panel */}
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "var(--bg)",
        }}
      >
        <div style={{ width: "100%", maxWidth: "380px" }}>
          {/* Brand Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--accent)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "14px",
              }}
            >
              CF
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
                CampusFlow AI
              </h1>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                Academic SaaS Intelligence
              </span>
            </div>
          </div>

          <h2 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
            Sign in to CampusFlow
          </h2>
          <p style={{ margin: "0 0 24px", color: "var(--text-secondary)", fontSize: "13px" }}>
            Enter your institutional credentials to access your portal.
          </p>

          {error && (
            <div className="cf-form-alert error" style={{ marginBottom: "16px" }}>
              <AlertCircle size={15} style={{ flexShrink: 0, display: "inline-block", marginRight: "6px" }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="cf-form-group">
              <label>Email Address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                  <Mail size={15} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="cf-form-input"
                  style={{ paddingLeft: "34px" }}
                />
              </div>
            </div>

            <div className="cf-form-group">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                  <Lock size={15} />
                </span>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cf-form-input"
                  style={{ paddingLeft: "34px" }}
                />
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="cf-submit-btn"
              style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "10px" }}
            >
              {loading && <Loader2 size={16} className="cf-spin" />}
              <span>{loading ? "Signing in..." : "Sign In to Workspace"}</span>
            </button>
          </form>

          {/* Quick Viva Demo Login Switcher */}
          <div
            style={{
              marginTop: "24px",
              padding: "14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ⚡ Quick Viva Demo Login
              </span>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 600 }}>
                1-Click Switcher
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
              }}
            >
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoFill(acc)}
                  className="cf-secondary-btn"
                  style={{
                    padding: "6px 8px",
                    fontSize: "11px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--bg-secondary)",
                    justifyContent: "flex-start",
                  }}
                  title={`Fill ${acc.email}`}
                >
                  <span>{acc.icon}</span>
                  <span style={{ fontWeight: 600 }}>{acc.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "10px 12px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "var(--text-muted)",
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            Institutional RBAC: Administration, Faculty Advisory, Student Self-Analytics, and Guardian Portal.
          </div>
        </div>
      </div>

      {/* Right Feature Showcase Panel (Hidden on mobile) */}
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          background: "var(--bg-secondary)",
          borderLeft: "1px solid var(--border)",
        }}
        className="login-right-panel"
      >
        <div style={{ maxWidth: "420px", width: "100%" }}>
          <div style={{ marginBottom: "32px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "var(--accent)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <Sparkles size={12} /> Autonomous Academic Telemetry
            </span>
            <h2 style={{ margin: "0 0 10px", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>
              Next-Generation Campus Intelligence
            </h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>
              Production-grade platform connecting attendance telemetry, grade examination centers, and explainable ML risk intervention.
            </p>
          </div>

          <Feature icon="📊" title="Real-Time Analytics" desc="Live academic KPI tracking across students, subjects, and departmental cohorts." />
          <Feature icon="🎯" title="AI Risk Radar" desc="Explainable ML model identifying attendance and marks anomalies with one-click faculty intervention." />
          <Feature icon="⚡" title="Fast Class Roster UX" desc="Classroom roll-call and marksheet entry designed for rapid single-click faculty workflows." />
          <Feature icon="🔄" title="ETL Data Pipeline" desc="Automated CSV schema validation, transformation, and PostgreSQL database ingestion." />
        </div>
      </div>
    </div>
  );
}
