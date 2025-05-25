import PropTypes from "prop-types";
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { PermissionsContext } from "../app/context/PermissionsContext";

const ProtectedRoute = ({ element, permissions }) => {
    const token = localStorage.getItem("token");
    const { hasPermission, loading } = useContext(PermissionsContext);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (permissions && permissions.length > 0) {
        const hasAllPermissions = permissions.every((perm) => hasPermission(perm));
        if (!hasAllPermissions) {
            return <Navigate to="/no-autorizado" replace />;
        }
    }

    return element;
};

ProtectedRoute.propTypes = {
    element: PropTypes.node.isRequired,
    permissions: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
