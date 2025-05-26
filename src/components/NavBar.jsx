"use client"

import { useState, useEffect, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X, User, LogOut, Minus } from "lucide-react"
import NavItem from "./NavItem"
import axios from "axios"
import { PermissionsContext } from "../app/context/PermissionsContext"

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [user, setUser] = useState(null)
    const [error, setError] = useState("")
    const navigate = useNavigate()
    const API_URL = import.meta.env.VITE_APP_API_URL
    const { hasPermission } = useContext(PermissionsContext)

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                setError("No hay sesión activa.")
                return
            }

            const response = await axios.get(`${API_URL}/users/profile`, {
                headers: { Authorization: `Token ${token}` },
            })

            setUser(response.data)
        } catch (err) {
            setError(err.response?.data?.error || "Error al obtener el perfil")
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const handleLogout = async () => {
        setError("")
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                setError("No hay sesión activa.")
                return
            }

            await axios.post(`${API_URL}/users/logout`, {}, { headers: { Authorization: `Token ${token}` } })

            localStorage.removeItem("token")
            setUser(null)
            navigate("/login")
        } catch (err) {
            setError(err.response?.data?.error || "Error en el servidor")
        }
    }

    // Definir los subitems para cada sección y filtrar los que no deberían mostrarse
    const controlIoTSubItems = [
        { direction: "/control-IoT/bocatoma", text: "Bocatoma" },
        { direction: "/control-IoT/valvulas", text: "Valvulas" },
    ]

    const gestionDatosSubItems = [
        hasPermission("ver_pre_registros") &&
        hasPermission("aceptar_pre_registros") &&
        hasPermission("rechazar_pre_registros") && { direction: "/gestionDatos/pre-registros", text: "Pre Registros" },
        hasPermission("visualizar_usuarios_distrito") &&
        hasPermission("ver_info_usuarios_distrito") &&
        hasPermission("actualizar_info_usuarios_distrito") &&
        hasPermission("agregar_info_usuarios_distrito") &&
        hasPermission("eliminar_info_usuarios_distrito") && { direction: "/gestionDatos/users", text: "Usuarios" },
        hasPermission("ver_predios") &&
        hasPermission("inhabilitar_predios") &&
        hasPermission("actualizar_info_predios") &&
        hasPermission("eliminar_info_predios") && { direction: "/gestionDatos/predios", text: "Predios" },
        hasPermission("ver_lotes") &&
        hasPermission("actualizar_info_lotes") &&
        hasPermission("inhabilitar_lotes") && { direction: "/gestionDatos/lotes", text: "Lotes" },
        hasPermission("habilitar_disp_iot") &&
        hasPermission("ver_disp_iot") &&
        hasPermission("change_iotdevice") &&
        hasPermission("inhabilitar_disp_iot") && { direction: "/gestionDatos/dispositivosIoT", text: "Dispositivos" },
    ].filter(Boolean)

    const gestionRegistrosSubItems = [
        hasPermission("registrar_info_predios") && {
            direction: "/gestionRegistros/predios",
            text: "Registro de Predios",
        },
        hasPermission("registrar_info_lotes") && {
            direction: "/gestionRegistros/lotes",
            text: "Registro de Lotes",
        },
        hasPermission("registrar_disp_iot") && {
            direction: "/gestionRegistros/dispositivosIoT",
            text: "Registro Dispositivos",
        },
    ].filter(Boolean)

    const facturacionSubItems = [
        hasPermission("ver_tarifas_cobro") &&
        hasPermission("ingresar_tarifas_cobro") &&
        hasPermission("modificar_tarifas_cobro") && {
            direction: "/facturacion/GestionFacturas",
            text: "Gestión de facturas",
        },
        hasPermission("ver_mi_historial_facturas") && { direction: "/mis-facturas", text: "Mis facturas" },
        hasPermission("ver_historial_facturas_usuarios") && {
            direction: "/facturacion/historial-facturas-lote",
            text: "Historial de factura",
        },
    ].filter(Boolean)

    const historialConsumoSubItems = [
        hasPermission("ver_historial_consumo_predios_individuales") &&
        hasPermission("ver_historial_consumo_lotes_individuales") && {
            direction: "/mispredios/historial-consumoList/:document",
            text: "Historial de mis predios y lotes",
        },
        hasPermission("ver_historial_consumo_predios") &&
        hasPermission("ver_historial_consumo_lotes") && {
            direction: "/historial-consumo/predio",
            text: "Historial del predio",
        },
        hasPermission("ver_historial_consumo_general_distrito") &&
        hasPermission("descargar_facturas_distrito_pdf") && {
            direction: "/historial-consumo/distrito",
            text: "Historial del distrito",
        },
    ].filter(Boolean)

    const reportesNovedadesSubItems = [
        {
            direction: "/reportes-y-novedades/mis-reportes-solicitudes",
            text: "Ver mis reportes/solicitudes",
        },
        { direction: "/reportes-y-novedades/solicitud_caudal", text: "Solicitudes de caudal" },
        { direction: "/reportes-y-novedades/reportar_fallos", text: "Reportar fallos" },
        hasPermission("Can_view_assignment") && hasPermission("can_be_assigned") && { direction: "/reportes-y-novedades/informe-mantenimiento", text: "Informe de solicitud/reporte asignada" },
        hasPermission("view_all_assignments") && hasPermission("can_assign_user") && hasPermission("change_assignment") && hasPermission("add_assignment") && {
            direction: "/reportes-y-novedades/atencion_solicitudes-reportes",
            text: "Atención de solicitudes y reportes",
        },
    ].filter(Boolean)

    // Verificar si el usuario tiene los permisos para la sección de permisos
    const showPermisosSection =
        hasPermission("asignar_permisos") &&
        hasPermission("quitar_permisos_asignados") &&
        hasPermission("ver_permisos_asignados") &&
        hasPermission("ver_roles_asignados") &&
        hasPermission("asignar_roles_asignados")

    return (
        <header className="w-full fixed top-0 bg-[#DCF2F1] z-50">
            <nav className="px-5 py-2 flex items-center">
                {/* Logo con espacio fijo */}
                <div className="flex items-center">
                    <Link to="/home">
                        <img src="/img/logo.png" alt="Logo" className="w-[200px]" />
                    </Link>
                </div>

                {/* Navegación principal - Desktop con espaciado mejorado */}
                <ul className="hidden lg:flex items-end font-semibold ml-auto space-x-1">
                    <NavItem direction="/perfil" text="Perfil" />

                    {hasPermission("solicitar_cambio_caudal") && (
                        <NavItem direction="/control-IoT" text="Control IoT" subItems={controlIoTSubItems} />
                    )}

                    {gestionDatosSubItems.length > 0 && (
                        <NavItem direction="/gestionDatos" text="Gestión de datos" subItems={gestionDatosSubItems} />
                    )}

                    {gestionRegistrosSubItems.length > 0 && (
                        <NavItem direction="/gestionRegistros" text="Gestión de registros" subItems={gestionRegistrosSubItems} />
                    )}

                    {facturacionSubItems.length > 0 && (
                        <NavItem direction="/facturacion" text="Facturación" subItems={facturacionSubItems} />
                    )}

                    {historialConsumoSubItems.length > 0 && (
                        <NavItem direction="/historialConsumo" text="Historial de consumo" subItems={historialConsumoSubItems} />
                    )}

                    <NavItem direction="/seguridad/actualizar-contrasena" text="Seguridad" />

                    <NavItem
                        direction="/reportes-y-novedades"
                        text="Reportes y novedades"
                        subItems={[
                            {
                                direction: "/reportes-y-novedades/mis-reportes-solicitudes",
                                text: "Ver mis reportes/solicitudes",
                            },
                            { direction: "/reportes-y-novedades/solicitud_caudal", text: "Solicitudes de caudal" },
                            { direction: "/reportes-y-novedades/reportar_fallos", text: "Reportar fallos" },
                            { direction: "/reportes-y-novedades/informe-mantenimiento", text: "Informe de solicitud/reporte asignada" },
                            {
                                direction: "/reportes-y-novedades/atencion_solicitudes-reportes",
                                text: "Atención de solicitudes y reportes",
                            },
                        ]}
                    />

                    <NavItem direction="/historial-incidencias" text="Historial de Incidencias" />
                    <NavItem 
                        direction="/predicciones"
                        text="Predicciones"
                        subItems={[
                            { direction: "/predicciones-distrito", text: "Distrito" },
                            { direction: "/predicciones", text: "Lotes del Distrito" },
                            { direction: "/mis-predicciones", text: "Mis lotes" },
                        ]}
                    />

                    {showPermisosSection && (
                        <NavItem direction="/permisos" text="Permisos" />
                    )}
                </ul>

                {/* Botón menú móvil */}
                <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden ml-auto">
                    <Menu size={28} />
                </button>

                {/* Menú lateral móvil */}
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

                    <div className="flex flex-col space-y-4 font-medium overflow-y-auto h-[calc(100vh-230px)]">
                        <NavItem direction="/perfil" text="Perfil" />

                        {hasPermission("solicitar_cambio_caudal") && (
                            <NavItem direction="/control-IoT" text="Control IoT" subItems={controlIoTSubItems} />
                        )}

                        {gestionDatosSubItems.length > 0 && (
                            <NavItem direction="/gestionDatos" text="Gestión de datos" subItems={gestionDatosSubItems} />
                        )}

                        {gestionRegistrosSubItems.length > 0 && (
                            <NavItem direction="/gestionRegistros" text="Gestión de registros" subItems={gestionRegistrosSubItems} />
                        )}

                        {facturacionSubItems.length > 0 && (
                            <NavItem direction="/facturacion" text="Facturación" subItems={facturacionSubItems} />
                        )}

                        {historialConsumoSubItems.length > 0 && (
                            <NavItem direction="/historialConsumo" text="Historial de consumo" subItems={historialConsumoSubItems} />
                        )}

                        <NavItem direction="/seguridad/actualizar-contrasena" text="Seguridad" />

                        <NavItem
                            direction="/reportes-y-novedades"
                            text="Reportes y novedades"
                            subItems={[
                                {
                                    direction: "/reportes-y-novedades/mis-reportes-solicitudes",
                                    text: "Ver mis reportes/solicitudes",
                                },
                                { direction: "/reportes-y-novedades/solicitud_caudal", text: "Solicitudes de caudal" },
                                { direction: "/reportes-y-novedades/reportar_fallos", text: "Reportar fallos" },
                                { direction: "/reportes-y-novedades/informe-mantenimiento", text: "Informe de solicitud/reporte asignada" },
                                {
                                    direction: "/reportes-y-novedades/atencion_solicitudes-reportes",
                                    text: "Atención de solicitudes y reportes",
                                },
                            ]}
                        />

                        <NavItem direction="/historial-incidencias" text="Historial de Incidencias" />

                        <NavItem 
                            direction="/predicciones"
                            text="Predicciones"
                            subItems={[
                                { direction: "/predicciones-distrito", text: "Distrito" },
                                { direction: "/predicciones", text: "Lotes del Distrito" },
                                { direction: "/mis-predicciones", text: "Mis lotes" },
                            ]}
                        />

                        {showPermisosSection && <NavItem direction="/permisos" text="Permisos" />}
                    </div>

                    {/* Botones Fijos */}
                    <div className="flex flex-col gap-3 absolute bottom-5 w-full px-5 pt-5 bg-[#DCF2F1]">
                        <button
                            type="submit"
                            onClick={handleLogout}
                            className="px-2 flex items-center space-x-2 text-gray-600 w-[70%]"
                        >
                            <LogOut size={20} />
                            <span>Cerrar sesión</span>
                        </button>
                        <Minus className="w-full h-[2px] bg-gray-400" />
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default NavBar
