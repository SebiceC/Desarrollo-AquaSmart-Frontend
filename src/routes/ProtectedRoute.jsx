import PropTypes, { element } from "prop-types";
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element }) => {
    const token = localStorage.getItem("token"); // Verificar si hay token de sesión

    return token ? element : <Navigate to="/login" replace />;
};

// Validación de `children` con PropTypes
ProtectedRoute.propTypes = {
    element: PropTypes.node.isRequired,
};

export default ProtectedRoute;