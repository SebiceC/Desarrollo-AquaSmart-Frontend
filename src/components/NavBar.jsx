"use client"

import { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X, User, LogOut, Minus } from 'lucide-react'
import NavItem from "./NavItem"
import axios from "axios"
import { PermissionsContext } from "../app/context/PermissionsContext"

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [overflowMenuOpen, setOverflowMenuOpen] = useState(false)
    const [user, setUser] = useState(null)
    const [error, setError] = useState("")
    const [visibleItems, setVisibleItems] = useState([])
    const [hiddenItems, setHiddenItems] = useState([])
    const navigate = useNavigate()
    const API_URL = import.meta.env.VITE_APP_API_URL
    const { hasPermission } = useContext(PermissionsContext)

    const navRef = useRef(null)
    const logoRef = useRef(null)
    const itemsRef = useRef(null)
    const overflowRef = useRef(null)

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

    // Memoizar los subitems para evitar recreaciones innecesarias
    const memoizedControlIoTSubItems = useMemo(
        () =>
            [
                hasPermission("change_bocatoma_flow") && { direction: "/control-IoT/bocatoma", text: "Bocatoma" },
                hasPermission("change_all_lots_flow") && { direction: "/control-IoT/valvulas", text: "Valvulas" },
            ].filter(Boolean),
        [hasPermission],
    )

    const memoizedGestionDatosSubItems = useMemo(
        () =>
            [
                hasPermission("ver_pre_registros") &&
                hasPermission("aceptar_pre_registros") &&
                hasPermission("rechazar_pre_registros") && {
                    direction: "/gestionDatos/pre-registros",
                    text: "Pre Registros",
                },
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
            ].filter(Boolean),
        [hasPermission],
    )

    const memoizedGestionRegistrosSubItems = useMemo(
        () =>
            [
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
            ].filter(Boolean),
        [hasPermission],
    )

    const memoizedFacturacionSubItems = useMemo(
        () =>
            [
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
            ].filter(Boolean),
        [hasPermission],
    )

    const memoizedHistorialConsumoSubItems = useMemo(
        () =>
            [
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
            ].filter(Boolean),
        [hasPermission],
    )

    const memoizedReportesNovedadesSubItems = useMemo(
        () =>
            [
                {
                    direction: "/reportes-y-novedades/mis-reportes-solicitudes",
                    text: "Ver mis reportes/solicitudes",
                },
                { direction: "/reportes-y-novedades/solicitud_caudal", text: "Solicitudes de caudal" },
                { direction: "/reportes-y-novedades/reportar_fallos", text: "Reportar fallos" },
                hasPermission("Can_view_assignment") &&
                hasPermission("can_be_assigned") && {
                    direction: "/reportes-y-novedades/informe-mantenimiento",
                    text: "Informe de solicitud/reporte asignada",
                },
                hasPermission("view_all_assignments") &&
                hasPermission("can_assign_user") &&
                hasPermission("change_assignment") &&
                hasPermission("add_assignment") && {
                    direction: "/reportes-y-novedades/atencion_solicitudes-reportes",
                    text: "Atención de solicitudes y reportes",
                },
            ].filter(Boolean),
        [hasPermission],
    )

    const memoizedPrediccionesSubItems = useMemo(
        () =>
            [
                { direction: "/predicciones-distrito", text: "Distrito" },
                hasPermission("ver_predicciones_lotes") &&
                hasPermission("generar_predicciones_lotes") && { direction: "/predicciones", text: "Lotes del Distrito" },
                hasPermission("generar_prediccion_consumo_mi_lote") &&
                hasPermission("ver_prediccion_consumo_mi_lote") && { direction: "/mis-predicciones", text: "Mis lotes" },
            ].filter(Boolean),
        [hasPermission],
    )

    // Verificar si el usuario tiene los permisos para la sección de permisos
    const showPermisosSection = useMemo(
        () =>
            hasPermission("asignar_permisos") &&
            hasPermission("quitar_permisos_asignados") &&
            hasPermission("ver_permisos_asignados") &&
            hasPermission("ver_roles_asignados") &&
            hasPermission("asignar_roles_asignados"),
        [hasPermission],
    )

    // Memoizar el array de elementos de navegación para evitar recreaciones
    const allNavItems = useMemo(
        () => [
            { key: "perfil", direction: "/perfil", text: "Perfil", subItems: [] },
            ...(memoizedControlIoTSubItems.length > 0
                ? [
                    {
                        key: "control-iot",
                        direction: "/control-IoT",
                        text: "Control IoT",
                        subItems: memoizedControlIoTSubItems,
                    },
                ]
                : []),
            ...(memoizedGestionDatosSubItems.length > 0
                ? [
                    {
                        key: "gestion-datos",
                        direction: "/gestionDatos",
                        text: "Gestión de datos",
                        subItems: memoizedGestionDatosSubItems,
                    },
                ]
                : []),
            ...(memoizedGestionRegistrosSubItems.length > 0
                ? [
                    {
                        key: "gestion-registros",
                        direction: "/gestionRegistros",
                        text: "Gestión de registros",
                        subItems: memoizedGestionRegistrosSubItems,
                    },
                ]
                : []),
            ...(memoizedFacturacionSubItems.length > 0
                ? [
                    {
                        key: "facturacion",
                        direction: "/facturacion",
                        text: "Facturación",
                        subItems: memoizedFacturacionSubItems,
                    },
                ]
                : []),
            ...(memoizedHistorialConsumoSubItems.length > 0
                ? [
                    {
                        key: "historial-consumo",
                        direction: "/historialConsumo",
                        text: "Historial de consumo",
                        subItems: memoizedHistorialConsumoSubItems,
                    },
                ]
                : []),
            ...(memoizedReportesNovedadesSubItems.length > 0
                ? [
                    {
                        key: "reportes-novedades",
                        direction: "/reportes-y-novedades",
                        text: "Reportes y novedades",
                        subItems: memoizedReportesNovedadesSubItems,
                    },
                ]
                : []),
            {
                key: "historial-incidencias",
                direction: "/historial-incidencias",
                text: "Historial de Incidencias",
                subItems: [],
            },
            ...(memoizedPrediccionesSubItems.length > 0
                ? [
                    {
                        key: "predicciones",
                        direction: "/predicciones",
                        text: "Predicciones",
                        subItems: memoizedPrediccionesSubItems,
                    },
                ]
                : []),
            ...(showPermisosSection ? [{ key: "permisos", direction: "/permisos", text: "Permisos", subItems: [] }] : []),
        ],
        [
            hasPermission,
            memoizedControlIoTSubItems,
            memoizedGestionDatosSubItems,
            memoizedGestionRegistrosSubItems,
            memoizedFacturacionSubItems,
            memoizedHistorialConsumoSubItems,
            memoizedReportesNovedadesSubItems,
            memoizedPrediccionesSubItems,
            showPermisosSection,
        ],
    )

    // Función para calcular si los elementos caben - versión corregida
    const calculateVisibleItems = useCallback(() => {
        if (!navRef.current || !logoRef.current || allNavItems.length === 0) return

        const navWidth = navRef.current.offsetWidth
        const logoWidth = logoRef.current.offsetWidth
        const mobileButtonWidth = 60 // Espacio para el botón móvil
        const overflowButtonWidth = 60 // Espacio para el botón de overflow
        const padding = 80 // Padding general aumentado
        const logoMargin = 40 // Margen entre logo y navegación

        // Espacio disponible para los elementos de navegación
        const availableWidth = navWidth - logoWidth - mobileButtonWidth - padding - logoMargin

        // Si el espacio disponible es muy pequeño, mover todos los elementos al overflow
        if (availableWidth < 300) {
            setVisibleItems([])
            setHiddenItems(allNavItems)
            return
        }

        // Crear elementos temporales para medir
        const tempContainer = document.createElement("div")
        tempContainer.style.position = "absolute"
        tempContainer.style.visibility = "hidden"
        tempContainer.style.whiteSpace = "nowrap"
        tempContainer.style.display = "flex"
        tempContainer.style.gap = "8px"
        tempContainer.style.fontSize = "14px"
        tempContainer.style.fontWeight = "600"
        tempContainer.style.fontFamily = "system-ui, -apple-system, sans-serif"
        document.body.appendChild(tempContainer)

        let currentWidth = 0
        const visible = []
        const hidden = []

        try {
            for (let i = 0; i < allNavItems.length; i++) {
                const item = allNavItems[i]

                // Crear elemento temporal para medir
                const tempElement = document.createElement("div")
                tempElement.style.padding = "8px"
                tempElement.style.whiteSpace = "nowrap"
                tempElement.style.borderRadius = "6px"
                tempElement.textContent = item.text
                tempContainer.appendChild(tempElement)

                const itemWidth = tempElement.offsetWidth + 8 // +8 para el gap entre elementos

                // Verificar si necesitamos reservar espacio para el botón de overflow
                const remainingItems = allNavItems.length - i
                const wouldNeedOverflow = currentWidth + itemWidth > availableWidth - overflowButtonWidth

                if (wouldNeedOverflow && remainingItems > 1) {
                    // Si este elemento no cabe y hay más elementos, mover todo lo restante al overflow
                    hidden.push(...allNavItems.slice(i))
                    break
                } else if (currentWidth + itemWidth <= availableWidth) {
                    // Si cabe sin problemas, añadirlo a visible
                    visible.push(item)
                    currentWidth += itemWidth
                } else {
                    // Si es el último elemento y no cabe, moverlo al overflow
                    hidden.push(...allNavItems.slice(i))
                    break
                }
            }

            // Si tenemos elementos ocultos pero muchos visibles, optimizar
            if (hidden.length > 0 && visible.length > 6) {
                // Mover algunos elementos visibles al overflow para dar más espacio
                const itemsToMove = visible.splice(-2) // Mover los últimos 2 elementos
                hidden.unshift(...itemsToMove)
            }

            setVisibleItems(visible)
            setHiddenItems(hidden)
        } catch (error) {
            console.error("Error calculating visible items:", error)
            // En caso de error, mostrar solo los primeros elementos
            setVisibleItems(allNavItems.slice(0, 3))
            setHiddenItems(allNavItems.slice(3))
        } finally {
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer)
            }
        }
    }, [allNavItems])

    // Efecto para recalcular cuando cambie el tamaño de la ventana o los elementos
    useEffect(() => {
        let timeoutId

        const handleResize = () => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
            timeoutId = setTimeout(calculateVisibleItems, 150)
        }

        // Calcular inicialmente después de un pequeño delay para asegurar que el DOM esté listo
        const initialTimeout = setTimeout(calculateVisibleItems, 100)

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
            if (initialTimeout) {
                clearTimeout(initialTimeout)
            }
        }
    }, [calculateVisibleItems])

    // Cerrar menús al hacer clic fuera (sin overlay negro)
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Cerrar menú móvil si se hace clic fuera
            if (menuOpen && !event.target.closest('[data-mobile-menu]') && !event.target.closest('[data-mobile-button]')) {
                setMenuOpen(false)
            }

            // Cerrar menú overflow si se hace clic fuera
            if (overflowMenuOpen && !event.target.closest('[data-overflow-menu]') && !event.target.closest('[data-overflow-button]')) {
                setOverflowMenuOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [menuOpen, overflowMenuOpen])

    return (
        <header className="w-full fixed top-0 bg-[#DCF2F1] z-50">
            <nav ref={navRef} className="px-5 py-2 flex items-center min-h-[60px]">
                {/* Logo con espacio fijo protegido */}
                <div ref={logoRef} className="flex items-center flex-shrink-0 min-w-[200px]">
                    <Link to="/home">
                        <img src="/img/logo.png" alt="Logo" className="w-[200px] h-auto" />
                    </Link>
                </div>

                {/* Navegación principal - Desktop con overflow inteligente */}
                <div className="flex-1 flex justify-end items-center ml-8">
                    <div ref={itemsRef} className="hidden lg:flex items-center">
                        <ul className="flex items-center font-semibold space-x-2">
                            {visibleItems.map((item) => (
                                <li key={item.key}>
                                    <NavItem direction={item.direction} text={item.text} subItems={item.subItems} />
                                </li>
                            ))}
                        </ul>

                        {/* Botón de menú lateral para elementos ocultos */}
                        {hiddenItems.length > 0 && (
                            <button
                                data-overflow-button
                                onClick={() => setOverflowMenuOpen(!overflowMenuOpen)}
                                className="ml-3 p-2 rounded-md hover:bg-[#003F88] hover:text-white transition-all duration-300 flex-shrink-0"
                                title={`${hiddenItems.length} opciones más`}
                            >
                                <Menu size={24} />
                            </button>
                        )}
                    </div>

                    {/* Botón menú móvil */}
                    <button
                        data-mobile-button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="lg:hidden ml-auto flex-shrink-0"
                    >
                        <Menu size={28} />
                    </button>
                </div>

                {/* Menú lateral para elementos de overflow (Desktop) */}
                {hiddenItems.length > 0 && (
                    <div
                        data-overflow-menu
                        className={`fixed right-0 top-0 h-full w-[80%] sm:w-[50%] md:w-[40%] lg:w-[22%] bg-[#DCF2F1] rounded-l-3xl p-5 border-l-[#365486] border-1 transform 
                      ${overflowMenuOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out hidden lg:block z-50`}
                    >
                        <button
                            onClick={() => setOverflowMenuOpen(false)}
                            className="absolute top-3 right-3 p-1 hover:bg-gray-200 rounded"
                        >
                            <X size={24} />
                        </button>

                        {/* Información del usuario */}
                        {user ? (
                            <div className="flex items-center space-x-2 mb-8 mt-2">
                                <span className="font-semibold text-lg">{user.first_name + " " + user.last_name}</span>
                                <User size={32} />
                            </div>
                        ) : (
                            <p className="text-gray-600 mt-4 mb-8">Cargando perfil...</p>
                        )}

                        {/* Opciones de navegación que no cupieron */}
                        <div className="flex flex-col space-y-4 font-medium overflow-y-auto h-[calc(100vh-200px)]">
                            {hiddenItems.map((item) => (
                                <NavItem key={item.key} direction={item.direction} text={item.text} subItems={item.subItems} />
                            ))}
                        </div>

                        {/* Botón de cerrar sesión */}
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
                )}

                {/* Menú lateral móvil */}
                <div
                    data-mobile-menu
                    className={`fixed right-0 top-0 h-full w-[80%] sm:w-[50%] bg-[#DCF2F1] rounded-l-3xl p-5 border-l-[#365486] border-1 transform 
                    ${menuOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out lg:hidden z-50`}
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
                        {allNavItems.map((item) => (
                            <NavItem key={item.key} direction={item.direction} text={item.text} subItems={item.subItems} />
                        ))}
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
