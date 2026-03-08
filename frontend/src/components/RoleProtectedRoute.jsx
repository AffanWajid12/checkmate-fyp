import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "./AuthContext.jsx";

const RoleProtectedRoute = ({ allowedRoles, children }) => {
    const { user, meLoading } = useAuthContext();
    const location = useLocation();

    if (meLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const defaultRoute = "/login";
        return <Navigate to={defaultRoute} replace />;
    }

    return children;
};

export default RoleProtectedRoute;