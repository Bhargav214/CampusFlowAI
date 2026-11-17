import React from "react";
import "./ui.css";

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
}) {
  const normalizedVariant = ["default", "success", "warning", "danger"].includes(variant)
    ? variant
    : "default";

  return (
    <div className="stat-card-saas">
      <div>
        <div className="stat-card-top">
          <span className="stat-card-label">{label}</span>
          {Icon && (
            <div className={`stat-card-icon-container ${normalizedVariant}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
          )}
        </div>
        <div className="stat-card-value">{value}</div>
      </div>

      {trend && (
        <div className="stat-card-footer">
          <span className={`stat-card-trend-pill ${normalizedVariant}`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
