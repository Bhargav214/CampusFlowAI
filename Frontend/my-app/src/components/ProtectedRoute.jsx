import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 font-medium text-slate-600">
                Loading CampusFlow AI...
            </div>
        );
    }

    // 1. Redirect unauthenticated users to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Check Role-Based Access Control (RBAC)
    const userRole = user.role || localStorage.getItem("role");
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;