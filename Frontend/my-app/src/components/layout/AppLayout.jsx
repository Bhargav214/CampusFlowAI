import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import {
    LayoutDashboard,
    Building2,
    Users,
    UserRound,
    BookOpen,
    CalendarCheck,
    GraduationCap,
    FileText,
    Upload,
    LogOut,
    Menu,
    X,
    Search,
    Bell,
    ShieldAlert,
    ChevronRight,
    BarChart2,
    UserCheck,
} from "lucide-react";

import "./AppLayout.css";



export default function AppLayout() {

    const { user, logout: ctxLogout } = useAuth();
    const role = user?.role ?? "student";
    const userEmail = user?.email ?? "";
    const displayName = userEmail
        ? userEmail.split("@")[0]
        : role.charAt(0).toUpperCase() + role.slice(1);

    const [sidebarOpen, setSidebarOpen] =
        useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);

    const navigate = useNavigate();

    // Fetch notification data (admin/faculty only)
    useEffect(() => {
        if (role === "student") return;
        api.get("/analytics/risk").then((r) => {
                const high = r.data?.high_risk ?? 0;
                const avgAtt = r.data?.average_attendance;
                const msgs = [];
                if (high > 0)
                    msgs.push({ id: 1, text: `${high} student${high > 1 ? "s are" : " is"} at HIGH academic risk`, path: "/ai-risk", color: "#ef4444" });
                if (avgAtt !== undefined && Number(avgAtt) < 75)
                    msgs.push({ id: 2, text: `Average attendance is ${Number(avgAtt).toFixed(1)}% — below the 75% threshold`, path: "/attendance", color: "#f59e0b" });
                if (msgs.length === 0)
                    msgs.push({ id: 3, text: "All students are performing well — no alerts.", path: "/dashboard", color: "#10b981" });
                setNotifs(msgs);
            }).catch(() => {});
    }, [role]);

    const alertCount = notifs.filter(n => n.color === "#ef4444" || n.color === "#f59e0b").length;


    const navigation = [

        {
            section: "MAIN",
            items: [
                {
                    name: "Overview",
                    path: "/dashboard",
                    icon: LayoutDashboard,
                    roles: [
                        "admin",
                        "faculty",
                        "student"
                    ]
                }
            ]
        },

        {
            section: "ACADEMICS",
            items: [

                {
                    name: "Departments",
                    path: "/departments",
                    icon: Building2,
                    roles: ["admin", "faculty"]
                },

                {
                    name: "Students",
                    path: "/students",
                    icon: Users,
                    roles: [
                        "admin",
                        "faculty"
                    ]
                },

                {
                    name: "Faculty",
                    path: "/faculty",
                    icon: UserRound,
                    roles: ["admin"]
                },

                {
                    name: "Subjects",
                    path: "/subjects",
                    icon: BookOpen,
                    roles: [
                        "admin",
                        "faculty"
                    ]
                },

                {
                    name: "Attendance",
                    path: "/attendance",
                    icon: CalendarCheck,
                    roles: [
                        "admin",
                        "faculty",
                        "student"
                    ]
                },

                {
                    name: "Marks",
                    path: "/marks",
                    icon: GraduationCap,
                    roles: [
                        "admin",
                        "faculty",
                        "student"
                    ]
                }

            ]
        },

        {
            section: "INTELLIGENCE",
            items: [

                {
                    name: "AI Risk",
                    path: "/ai-risk",
                    icon: ShieldAlert,
                    roles: [
                        "admin",
                        "faculty",
                    ]
                },

                {
                    name: "My Analytics",
                    path: "/my-analytics",
                    icon: BarChart2,
                    roles: ["student"]
                }

            ]
        },

        {
            section: "REPORTING",
            items: [

                {
                    name: "Reports",
                    path: "/reports",
                    icon: FileText,
                    roles: [
                        "admin",
                        "faculty"
                    ]
                },

                {
                    name: "Data Import",
                    path: "/etl",
                    icon: Upload,
                    roles: [
                        "admin",
                        "faculty"
                    ]
                }

            ]
        },

        {
            section: "PARENT SUPERVISION",
            items: [
                {
                    name: "Parent Portal",
                    path: "/parent-dashboard",
                    icon: UserCheck,
                    roles: ["parent"]
                }
            ]
        }

    ];


    const logout = () => {
        ctxLogout();
        navigate("/login");
    };


    return (

        <div className="campus-shell">


            {/* Mobile overlay */}

            {sidebarOpen && (

                <div
                    className="sidebar-overlay"
                    onClick={() =>
                        setSidebarOpen(false)
                    }
                />

            )}


            {/* Sidebar */}

            <aside
                className={`
                    campus-sidebar
                    ${sidebarOpen
                        ? "sidebar-open"
                        : ""}
                `}
            >


                {/* Brand */}

                <div className="brand">

                    <div className="brand-logo">
                        CF
                    </div>

                    <div className="brand-text">

                        <h1>
                            CampusFlow
                        </h1>

                        <span>
                            AI Academic Intelligence
                        </span>

                    </div>


                    <button
                        className="mobile-close"
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* Navigation */}

                <nav className="sidebar-nav">

                    {navigation.map(
                        (group) => {

                            const visibleItems =
                                group.items.filter(
                                    item =>
                                        item.roles.includes(
                                            role
                                        )
                                );

                            if (
                                visibleItems.length === 0
                            ) {
                                return null;
                            }


                            return (

                                <div
                                    className="nav-group"
                                    key={group.section}
                                >

                                    <div className="nav-section-title">
                                        {group.section}
                                    </div>


                                    {visibleItems.map(
                                        (item) => {

                                            const Icon =
                                                item.icon;

                                            return (

                                                <NavLink
                                                    key={
                                                        item.name
                                                    }
                                                    to={
                                                        item.path
                                                    }
                                                    onClick={() =>
                                                        setSidebarOpen(
                                                            false
                                                        )
                                                    }
                                                    className={({
                                                        isActive
                                                    }) =>
                                                        `sidebar-link ${
                                                            isActive
                                                                ? "active"
                                                                : ""
                                                        }`
                                                    }
                                                >

                                                    <Icon
                                                        size={19}
                                                        strokeWidth={
                                                            1.8
                                                        }
                                                    />

                                                    <span>
                                                        {
                                                            item.name
                                                        }
                                                    </span>


                                                    <ChevronRight
                                                        size={15}
                                                        className="link-arrow"
                                                    />

                                                </NavLink>

                                            );

                                        }
                                    )}

                                </div>

                            );

                        }
                    )}

                </nav>


                {/* Bottom user area */}

                <div className="sidebar-bottom">

                    <div className="user-card">

                        <div className="user-avatar">
                            {displayName
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="user-info">

                            <strong title={userEmail}>
                                {displayName}
                            </strong>

                            <span>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </span>

                        </div>

                    </div>


                    <button
                        className="logout-button"
                        onClick={logout}
                    >

                        <LogOut size={18} />

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* Main area */}

            <main className="campus-main">


                {/* Topbar */}

                <header className="topbar">

                    <div className="topbar-left">

                        <button
                            className="menu-button"
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                        >
                            <Menu size={21} />
                        </button>


                        <div className="search-box">

                            <Search size={18} />

                            <input
                                type="text"
                                placeholder="Search campus data..."
                            />

                            <kbd>
                                /
                            </kbd>

                        </div>

                    </div>


                    <div className="topbar-right">

                        {/* Notification Bell */}
                        <div style={{ position: "relative" }}>
                            <button
                                className="icon-button"
                                title="Notifications"
                                onClick={() => setNotifOpen(o => !o)}
                            >
                                <Bell size={19} />
                                {alertCount > 0 && (
                                    <span className="notification-dot" style={{ background: "#ef4444" }}>
                                        {alertCount > 9 ? "9+" : alertCount}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <>
                                    <div className="notif-backdrop" onClick={() => setNotifOpen(false)} />
                                    <div className="notif-dropdown">
                                        <div className="notif-header">
                                            <Bell size={15} />
                                            Notifications
                                        </div>
                                        {notifs.map(n => (
                                            <div
                                                key={n.id}
                                                className="notif-item"
                                                onClick={() => { setNotifOpen(false); navigate(n.path); }}
                                            >
                                                <span className="notif-dot" style={{ background: n.color }} />
                                                <span>{n.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>


                        <div className="topbar-divider" />


                        <div className="topbar-user">

                            <div className="topbar-avatar">
                                {displayName
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div>

                                <strong title={userEmail}>
                                    {displayName}
                                </strong>

                                <span>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </span>

                            </div>

                        </div>

                    </div>

                </header>


                {/* Page */}

                <section className="page-container">

                    <Outlet />

                </section>

            </main>

        </div>

    );
}