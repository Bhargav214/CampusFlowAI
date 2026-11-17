import React from "react";
import "./ui.css";

export default function PageHeader({ title, subtitle, badge, actions }) {
  return (
    <header className="page-header-container">
      <div className="page-header-left">
        <div className="page-header-title-row">
          <h1 className="page-header-title">{title}</h1>
          {badge && <span className="page-header-badge">{badge}</span>}
        </div>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
