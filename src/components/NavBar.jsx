import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, HelpCircle, Minus, Bell } from "lucide-react";
import NavItem from "./NavItem";
import axios from "axios";

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_APP_API_URL;

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No hay sesión activa.");
                return;
            }

            const response = await axios.get(`${API_URL}/users/profile`, {
                headers: { Authorization: `Token ${token}` },
            });

            setUser(response.data); // Guardar los datos del usuario en el estado
        } catch (err) {
            setError(err.response?.data?.error || "Error al obtener el perfil");
        }
    };

    // Llamar a la función al montar el componente
    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        setError("");
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No hay sesión activa.");
                return;
            }

            await axios.post(
                `${API_URL}/users/logout`,
                {}, // <-- Enviar body vacío si la API lo requiere
                { headers: { Authorization: `Token ${token}` } }
            );

            localStorage.removeItem("token");
            setUser(null); // <-- Limpia el usuario
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.error || "Error en el servidor");
        }
    };
    return (
        <header className="w-full fixed top-0 bg-[#DCF2F1] z-50">
            <nav className="px-5 py-2 flex justify-between items-center">
                <div className="flex items-center gap-5">
                    <Bell size={24} />
                    <Link to="/home">
                        <img src="/img/logo.png" alt="Logo" className="w-[250px]" />
                    </Link>
                </div>

                <ul className="hidden lg:flex space-x-1 font-semibold">
                    <NavItem direction="/perfil" text="Perfil" />
                    <NavItem
                        direction="/control-IoT"
                        text="Control IoT"
                        subItems={[
                            { direction: "/control-IoT/sensores", text: "Sensores" },
                        ]}
                    />
                    <NavItem
                        direction="/gestionDatos"
                        text="Gestión de datos"
                        subItems={[
                            { direction: "/gestionDatos/pre-registros", text: "Pre Registros" },
                            { direction: "/gestionDatos/users", text: "Usuarios" },
                            { direction: "/gestionDatos/predios", text: "Predios" },
                            { direction: "/gestionDatos/lotes", text: "Lotes" },
                            { direction: "/gestionDatos/dispositivosIoT", text: "Dispositvos IoT" },
                        ]}
                    />
                    <NavItem
                        direction="/gestionDatos"
                        text="Gestión de registros"
                        subItems={[
                            { direction: "/gestionRegistros/pre-registros", text: "Registro de Usuarios" },
                            { direction: "/gestionRegistros/users", text: "Registro de Predios" },
                            { direction: "/gestionRegistros/lotes", text: "Registro de Lotes" },
                            { direction: "/gestionRegistros/dispositivosIoT", text: "Registro de Dispositivos IoT" },
                        ]}
                    />
                    <NavItem
                        direction="/facturacion"
                        text="Facturación"
                        subItems={[
                            { direction: "/facturacion/historial", text: "Historial" },
                            { direction: "/facturacion/reportes", text: "Reportes" },
                        ]}
                    />
                    <NavItem
                        direction="/historialConsumo"
                        text="Historial de consumo"
                        subItems={[
                            { direction: "/historialConsumo/diario", text: "Consumo Diario" },
                            {
                                direction: "/historialConsumo/mensual",
                                text: "Consumo Mensual",
                            },
                        ]}
                    />
                    <NavItem direction="/predicciones" text="Predicciones" />
                    <NavItem direction="/permisos" text="Permisos" />
                </ul>

                <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden">
                    <Menu size={28} />
                </button>

                <div
                    className={`fixed right-0 top-0 h-full w-[80%] sm:w-[50%] bg-[#DCF2F1] rounded-l-3xl p-5 border-l-[#365486] border-1 transform 
                    ${menuOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out lg:hidden`}
                >
                    <button onClick={() => setMenuOpen(false)} className="absolute top-3 right-3">
                        <X size={24} />
                    </button>

                    {user ? (
                        <div className="flex items-center space-x-2 mb-10">
                            <span className="font-semibold text-lg">{user.first_name + " " + user.last_name}</span>
                            <User size={32} />
                        </div>
                    ) : (
                        <p className="text-gray-600 mt-4 mb-10">Cargando perfil...</p>
                    )}

                    {/* Contenedor de enlaces, SOLO ESTE será desplazable */}
                    <div className="flex flex-col space-y-4 font-medium overflow-y-auto h-[calc(100vh-180px)]">
                        <NavItem direction="/perfil" text="Perfil" />
                        <NavItem
                            direction="/control-IoT"
                            text="Control IoT"
                            subItems={[
                                { direction: "/control-IoT/sensores", text: "Sensores" },
                            ]}
                        />
                        <NavItem
                            direction="/gestionDatos"
                            text="Gestión de datos"
                            subItems={[
                                { direction: "/gestionDatos/users", text: "Usuarios" },
                                { direction: "/gestionDatos/predios", text: "Predios" },
                                { direction: "/gestionDatos/lotes", text: "Lotes" },
                                { direction: "/gestionDatos/dispositivosIoT", text: "Dispositvos IoT" },
                            ]}
                        />
                        <NavItem
                            direction="/gestionDatos"
                            text="Gestión de registros"
                            subItems={[
                                { direction: "/gestionRegistros/pre-registros", text: "Registro de Usuarios" },
                                { direction: "/gestionRegistros/users", text: "Registro de Predios" },
                                { direction: "/gestionRegistros/lotes", text: "Registro de Lotes" },
                                { direction: "/gestionRegistros/dispositivosIoT", text: "Registro de Dispositivos IoT" },
                            ]}
                        />
                        <NavItem
                            direction="/facturacion"
                            text="Facturación"
                            subItems={[
                                { direction: "/facturacion/historial", text: "Historial" },
                                { direction: "/facturacion/reportes", text: "Reportes" },
                            ]}
                        />
                        <NavItem
                            direction="/historialConsumo"
                            text="Historial de consumo"
                            subItems={[
                                { direction: "/historialConsumo/diario", text: "Consumo Diario" },
                                { direction: "/historialConsumo/mensual", text: "Consumo Mensual" },
                            ]}
                        />
                        <NavItem direction="/predicciones" text="Predicciones" />
                        <NavItem direction="/permisos" text="Permisos" />
                    </div>

                    {/* Botones Fijos */}
                    <div className="flex  flex-col  gap-3 absolute bottom-5 w-full px-5 pt-5 bg-[#DCF2F1]">
                        <button
                            type="submit"
                            onClick={handleLogout}
                            className="px-2 flex items-center space-x-2 text-gray-600 w-[70%]"
                        >
                            <LogOut size={20} />
                            <span>Cerrar sesión</span>
                        </button>
                        <Minus className="w-full h-[2px] bg-gray-400" />
                        <Link
                            to="/"
                            className="flex items-center space-x-2 text-sm text-gray-600 pb-5 px-2"
                        >
                            <HelpCircle size={20} />
                            <span>Manual de usuario y soporte</span>
                        </Link>
                    </div>
                </div>


            </nav>
        </header>
    );
}

export default NavBar;
