import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  ShieldAlert,
  Upload,
  FileText,
  BarChart2,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./AppLayout.css";

const routeTitles = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/faculty": "Faculty",
  "/departments": "Departments",
  "/subjects": "Subjects",
  "/attendance": "Attendance",
  "/marks": "Marks",
  "/ai-risk": "AI Risk Radar",
  "/etl": "Data Pipeline (ETL)",
  "/reports": "Reports",
  "/my-analytics": "My Analytics",
  "/faculty-dashboard": "Faculty Dashboard",
  "/parent-dashboard": "Parent Portal",
};

export default function AppLayout() {
  const { user, logout: ctxLogout } = useAuth();
  const role = user?.role ?? "student";
  const userEmail = user?.email ?? "";
  const displayName = userEmail
    ? userEmail.split("@")[0]
    : role.charAt(0).toUpperCase() + role.slice(1);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  // Theme Management (Light / Dark SaaS System)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Compute dynamic breadcrumb title
  const currentTitle =
    routeTitles[location.pathname] ||
    location.pathname
      .replace("/", "")
      .replace("-", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Overview";

  // Fetch notifications for Admin / Faculty
  useEffect(() => {
    if (role !== "admin" && role !== "faculty") return;
    api
      .get("/analytics/risk")
      .then((r) => {
        const high = r.data?.high_risk ?? 0;
        const avgAtt = r.data?.average_attendance;
        const msgs = [];
        if (high > 0) {
          msgs.push({
            id: 1,
            text: `${high} student${high > 1 ? "s are" : " is"} at HIGH academic risk`,
            path: "/ai-risk",
            color: "var(--danger)",
          });
        }
        if (avgAtt !== undefined && Number(avgAtt) < 75) {
          msgs.push({
            id: 2,
            text: `Average attendance is ${Number(avgAtt).toFixed(1)}% (below 75% threshold)`,
            path: "/attendance",
            color: "var(--warning)",
          });
        }
        if (msgs.length === 0) {
          msgs.push({
            id: 3,
            text: "All students are performing well. No critical alerts.",
            path: "/dashboard",
            color: "var(--success)",
          });
        }
        setNotifs(msgs);
      })
      .catch(() => {});
  }, [role]);

  const alertCount = notifs.filter(
    (n) => n.color === "var(--danger)" || n.color === "var(--warning)"
  ).length;

  const navigationGroups = [
    {
      section: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          roles: ["admin", "faculty", "student", "parent"],
        },
      ],
    },
    {
      section: "ACADEMICS",
      items: [
        {
          name: "Students",
          path: "/students",
          icon: Users,
          roles: ["admin", "faculty"],
        },
        {
          name: "Faculty",
          path: "/faculty",
          icon: UserRound,
          roles: ["admin"],
        },
        {
          name: "Departments",
          path: "/departments",
          icon: Building2,
          roles: ["admin", "faculty"],
        },
        {
          name: "Subjects",
          path: "/subjects",
          icon: BookOpen,
          roles: ["admin", "faculty"],
        },
        {
          name: "Attendance",
          path: "/attendance",
          icon: CalendarCheck,
          roles: ["admin", "faculty", "student"],
        },
        {
          name: "Marks",
          path: "/marks",
          icon: GraduationCap,
          roles: ["admin", "faculty", "student"],
        },
      ],
    },
    {
      section: "INTELLIGENCE & DATA",
      items: [
        {
          name: "AI Risk Radar",
          path: "/ai-risk",
          icon: ShieldAlert,
          roles: ["admin", "faculty"],
        },
        {
          name: "Data Pipeline (ETL)",
          path: "/etl",
          icon: Upload,
          roles: ["admin", "faculty"],
        },
        {
          name: "Reports",
          path: "/reports",
          icon: FileText,
          roles: ["admin", "faculty"],
        },
        {
          name: "My Analytics",
          path: "/my-analytics",
          icon: BarChart2,
          roles: ["student"],
        },
      ],
    },
  ];

  const handleLogout = () => {
    ctxLogout();
    navigate("/login");
  };

  return (
    <div className="campus-shell">
      {/* Mobile Slide-Over Backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (248px Fixed) */}
      <aside className={`campus-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <NavLink
            to="/dashboard"
            className="brand-wrapper"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="brand-logo-mark">CF</div>
            <div className="brand-title-wrap">
              <span className="brand-name">CampusFlow</span>
              <span className="brand-ai-badge">AI</span>
            </div>
          </NavLink>

          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Navigation */}
        <nav className="sidebar-nav">
          {navigationGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.roles.includes(role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div className="sidebar-group" key={group.section}>
                <div className="sidebar-group-title">{group.section}</div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `sidebar-nav-item ${isActive ? "active" : ""}`
                      }
                    >
                      <Icon size={16} className="sidebar-nav-icon" />
                      <span className="sidebar-nav-label">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-meta-left">
              <div className="user-avatar-initials">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name" title={userEmail}>
                  {displayName}
                </span>
                <span className="user-role-badge">{role}</span>
              </div>
            </div>

            <button
              className="user-logout-btn"
              onClick={handleLogout}
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="campus-main">
        {/* Sticky Top Header (56px) */}
        <header className="campus-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            {/* Dynamic Breadcrumb */}
            <div className="topbar-breadcrumbs">
              <span className="breadcrumb-root">Workspace</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{currentTitle}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Academic Session Pill */}
            <div className="session-pill">
              <span className="session-indicator" />
              <span>AY 2026-27</span>
            </div>

            {/* Theme Toggle Button (Sun / Moon) */}
            <button
              className="header-action-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notification Bell */}
            <div className="notif-dropdown-container">
              <button
                className="header-action-btn"
                title="Notifications"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notifications"
              >
                <Bell size={16} />
                {alertCount > 0 && (
                  <span className="notification-count-badge">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="notif-backdrop"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="notif-dropdown-card">
                    <div className="notif-dropdown-header">
                      <Bell size={14} />
                      <span>Notifications & Alerts</span>
                    </div>
                    {notifs.map((n) => (
                      <div
                        key={n.id}
                        className="notif-dropdown-item"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate(n.path);
                        }}
                      >
                        <span
                          className="notif-status-dot"
                          style={{ background: n.color }}
                        />
                        <span>{n.text}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Page Container */}
        <section className="page-container">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
