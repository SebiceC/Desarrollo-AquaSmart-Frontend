import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../app/auth/Login";
import PreRegister from "../app/auth/PreRegister";
import Home from "../Home";
import ForgotPassword from "../app/forgotPassword/ForgotPassword";
import RecoverPassword from "../app/forgotPassword/RecoverPassword";
import Perfil from "../app/Perfil";
import IoTControll from "../app/IoTControll";
import ProtectedRoute from "./ProtectedRoute"; // Importamos el componente de protección
import UsersList from "../app/gestionDatos/Users/UsersList";
import RegistroPredios from "../app/gestionRegistros/RegistroPredios";
import PreRegistrosList from "../app/gestionDatos/Users/PreRegistrosList";
import PreRegistroDetail from "../app/gestionDatos/Users/PreRegistroDetail";
import UserUpdateInformation from "../app/gestionDatos/Users/id/UserUpdateInformation";
const AppRouter = () => {
    return (
        <Routes>
            {/* Redirección a login si no está autenticado */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<Navigate to="/perfil" replace />} />

            {/* Rutas públicas */}
            <Route path="/preRegister" element={<PreRegister />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
            <Route path="/recoverPassword" element={<RecoverPassword />} />

            {/* Rutas protegidas */}
            <Route path="/perfil" element={<ProtectedRoute element={<Perfil />} />} />
            <Route path="/control-IoT" element={<ProtectedRoute element={<IoTControll />} />} />
            <Route path= '/gestionDatos/registro-predios' element={<ProtectedRoute element={<RegistroPredios />} />} />
            <Route path="/gestionDatos/users" element={<ProtectedRoute element={<UsersList />} />} />
            <Route path="/gestionDatos/pre-registros" element={<ProtectedRoute element={<PreRegistrosList />} />} />
            <Route path="/gestionDatos/pre-registros/:document" element={<ProtectedRoute element={<PreRegistroDetail />} />} />
            <Route path="/perfil/actualizar-informacion" element={<ProtectedRoute element={<UserUpdateInformation />} />} />           
        </Routes>
    );
};

export default AppRouter;
