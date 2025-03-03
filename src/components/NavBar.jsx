import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User, LogOut, HelpCircle, Minus, Bell } from "lucide-react";
import NavItem from "./NavItem";

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="w-full fixed top-0 bg-[#DCF2F1] z-50">
            <nav className="px-5 py-2 flex justify-between items-center">
                <div className="flex items-center gap-5">
                    <Bell size={24} />
                    <Link to="/home">
                        <img src="/img/logo.png" alt="Logo" className="w-[250px]" />
                    </Link>
                </div>

                {/* NAV LINKS - DESKTOP */}
                <ul className="hidden lg:flex space-x-4 font-semibold">
                    <NavItem direction="/perfil" text="Perfil" />
                    <NavItem direction="/control-IoT" text="Control IoT" />
                    <NavItem direction="/gestionDatos" text="Gestión de datos" />
                    <NavItem direction="/facturacion" text="Facturación" />
                    <NavItem direction="/historialConsumo" text="Historial de consumo" />
                    <NavItem direction="/predicciones" text="Predicciones" />
                    <NavItem direction="/permisos" text="Permisos" />
                </ul>

                <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden">
                    <Menu size={28} />
                </button>

                <div className={`fixed right-0 top-0 h-full w-64 bg-[#DCF2F1] shadow-lg p-5 transform ${menuOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out lg:hidden`}>
                    <button onClick={() => setMenuOpen(false)} className="absolute top-3 right-3">
                        <X size={24} />
                    </button>
                    <div className="flex items-center space-x-2 mb-6">
                        <User size={24} />
                        <span className="font-semibold text-lg">Mi perfil</span>
                    </div>

                    {/* ENLACES */}
                    <ul className="flex flex-col space-y-4 font-medium gap-3">
                        <NavItem direction="/perfil" text="Perfil" />
                        <NavItem direction="/control-IoT" text="Control IoT" />
                        <NavItem direction="/gestionDatos" text="Gestión de datos" />
                        <NavItem direction="/facturacion" text="Facturación" />
                        <NavItem direction="/historialConsumo" text="Historial de consumo" />
                        <NavItem direction="/predicciones" text="Predicciones" />
                        <NavItem direction="/permisos" text="Permisos" />
                    </ul>

                    {/* OPCIONES EXTRA */}
                    <div className="flex flex-col absolute bottom-5 w-full px-5 gap-3 ">
                        <button className="px-2 mt-4 flex items-center space-x-2 text-gray-600 w-[70%]">
                            <LogOut size={20} />
                            <span>Cerrar sesión</span>
                        </button>
                        <Minus className="w-full h-[2px] bg-gray-400" />
                        <Link to="/" className="flex items-center space-x-2 text-sm text-gray-600 pb-5 px-2">
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
