import React from "react";
import "./ui.css";

export default function StatusBadge({ status = "", size = "sm" }) {
  const normalized = String(status || "").trim().toLowerCase();

  let variant = "neutral";
  if (["low", "present", "active", "success", "good", "passed"].includes(normalized)) {
    variant = "success";
  } else if (["moderate", "medium", "warning", "needs attention", "average"].includes(normalized)) {
    variant = "warning";
  } else if (["high", "absent", "danger", "critical", "failed", "risk"].includes(normalized)) {
    variant = "danger";
  } else if (["info", "scheduled", "primary"].includes(normalized)) {
    variant = "default";
  }

  const sizeClass = size === "md" ? "size-md" : "size-sm";

  return (
    <span className={`status-badge ${sizeClass} variant-${variant}`}>
      <span className="status-badge-dot" />
      {status}
    </span>
  );
}
