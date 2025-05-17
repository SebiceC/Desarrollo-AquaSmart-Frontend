"use client"

import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import axios from "axios"
import { Search } from "lucide-react"
import DataTable from "../../../components/DataTable"

const InformeMantenimiento = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [filteredAsignaciones, setFilteredAsignaciones] = useState(null) // Inicialmente null para indicar que no se ha aplicado filtro
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("Error")
  const [asignacionesCompletas, setAsignacionesCompletas] = useState([]) // Para almacenar asignaciones con detalles completos
  const [informesMantenimiento, setInformesMantenimiento] = useState([]) // Para almacenar los informes de mantenimiento

  // Estados para los filtros
  const [filters, setFilters] = useState({
    id: "",
    startDate: "",
    endDate: "",
    requestType: "", // Cambiado de reportType a requestType para mayor claridad
    assignedBy: "",
    status: "", // Nuevo filtro para estado de solución
  })

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Tipos de solicitudes para el filtro - Ordenados alfabéticamente
  const requestTypes = [
    { value: "", label: "TIPO" },
    { value: "app_failure", label: "Fallo en el aplicativo" },
    { value: "water_supply", label: "Fallo en el suministro del agua" },
    { value: "flow_definitive_cancel", label: "Cancelación Definitiva de Caudal" },
  ]

  // Estados de solución para el filtro
  const solutionStates = [
    { value: "", label: "ESTADO" },
    { value: "pending", label: "Pendiente de solución" },
    { value: "solved", label: "Solucionado" },
  ]

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  // Función para obtener los informes de mantenimiento
  const fetchInformesMantenimiento = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return []

      const response = await axios.get(`${API_URL}/communication/maintenance-reports/list`, {
        headers: { Authorization: `Token ${token}` },
      })

      console.log("Informes de mantenimiento obtenidos:", response.data)
      setInformesMantenimiento(response.data)
      return response.data
    } catch (error) {
      console.error("Error al obtener los informes de mantenimiento:", error)
      return []
    }
  }, [API_URL])

  // Cargar informes de mantenimiento al iniciar
  useEffect(() => {
    fetchInformesMantenimiento()
  }, [fetchInformesMantenimiento])

  // Función para verificar si una asignación ya tiene informe de mantenimiento
  const tieneInformeMantenimiento = (asignacionId) => {
    return informesMantenimiento.some((informe) => informe.assignment === asignacionId)
  }

  // Función para obtener el estado de solución de una asignación
  const obtenerEstadoSolucion = (asignacionId) => {
    const informe = informesMantenimiento.find((informe) => informe.assignment === asignacionId)
    if (!informe) return "pending"

    if (informe.is_approved) return "approved"
    return "solved"
  }

  // Función para obtener los detalles completos de una asignación
  const obtenerDetallesCompletos = async (asignacion, token) => {
    const asignacionCompleta = { ...asignacion }

    try {
      // Si hay una solicitud de caudal, obtener sus detalles completos
      if (asignacionCompleta.flow_request && typeof asignacionCompleta.flow_request !== "object") {
        try {
          const flowResponse = await axios.get(
            `${API_URL}/communication/assignments/flow-request/${asignacionCompleta.flow_request}`,
            { headers: { Authorization: `Token ${token}` } },
          )
          asignacionCompleta.flow_request = flowResponse.data
          console.log("Detalles de solicitud de caudal:", flowResponse.data)
        } catch (error) {
          console.error("Error al obtener detalles de la solicitud de caudal:", error)
        }
      }

      // Si hay un reporte de fallo, obtener sus detalles completos
      if (asignacionCompleta.failure_report && typeof asignacionCompleta.failure_report !== "object") {
        try {
          const failureResponse = await axios.get(
            `${API_URL}/communication/assignments/failure-report/${asignacionCompleta.failure_report}`,
            { headers: { Authorization: `Token ${token}` } },
          )
          asignacionCompleta.failure_report = failureResponse.data
          console.log("Detalles de reporte de fallo:", failureResponse.data)
        } catch (error) {
          console.error("Error al obtener detalles del reporte de fallo:", error)
        }
      }
    } catch (error) {
      console.error("Error general al obtener detalles:", error)
    }

    return asignacionCompleta
  }

  const fetchAsignaciones = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        setModalTitle("Error")
        setModalMessage("No hay una sesión activa. Por favor, inicie sesión.")
        setShowModal(true)
        setLoading(false)
        return []
      }

      // Usar el endpoint que muestra solo las asignaciones del técnico actual
      const response = await axios.get(`${API_URL}/communication/technician/assignments`, {
        headers: { Authorization: `Token ${token}` },
      })

      console.log("Asignaciones obtenidas:", response.data)

      // Obtener detalles completos para cada asignación
      const asignacionesConDetalles = await Promise.all(
        response.data.map(async (asignacion) => {
          return await obtenerDetallesCompletos(asignacion, token)
        }),
      )

      console.log("Asignaciones con detalles completos:", asignacionesConDetalles)
      setAsignacionesCompletas(asignacionesConDetalles)
      setLoading(false)
      return asignacionesConDetalles
    } catch (error) {
      console.error("Error al obtener las asignaciones:", error)
      setModalTitle("Error")
      setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
      setShowModal(true)
      setLoading(false)
      return []
    }
  }, [API_URL])

  // Función para determinar el tipo de fallo o solicitud
  const determinarTipoSolicitud = (asignacion) => {
    // Para solicitudes de caudal
    if (asignacion.flow_request && typeof asignacion.flow_request === "object") {
      return asignacion.flow_request.flow_request_type || "Solicitud de caudal"
    }

    // Para reportes de fallo
    if (asignacion.failure_report && typeof asignacion.failure_report === "object") {
      return asignacion.failure_report.failure_type || "Reporte de fallo"
    }

    // Si solo tenemos IDs
    if (asignacion.flow_request) return "Solicitud de caudal"
    if (asignacion.failure_report) return "Reporte de fallo"

    return "No especificado"
  }

  const applyFilters = useCallback(async () => {
    // Validación de ID (solo números y máximo 8 caracteres)
    if (filters.id && (!/^\d+$/.test(filters.id) || filters.id.length > 8)) {
      setModalTitle("Error")
      setModalMessage("El ID de asignación debe contener solo números y máximo 8 caracteres.")
      setShowModal(true)
      return
    }

    // Validación de fechas
    if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
      setModalTitle("Error")
      setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.")
      setShowModal(true)
      return
    }

    // Obtener las asignaciones del usuario actual con detalles completos
    let asignaciones = []
    if (asignacionesCompletas.length === 0) {
      asignaciones = await fetchAsignaciones()
    } else {
      asignaciones = asignacionesCompletas
    }

    // Si no hay datos, mostramos un mensaje
    if (!asignaciones || asignaciones.length === 0) {
      setModalTitle("Información")
      setModalMessage("No se encontraron asignaciones asignadas a tu usuario.")
      setShowModal(true)
      setFilteredAsignaciones([])
      return
    }

    // Verificar si hay filtros específicos aplicados
    const hasSpecificFilters =
      filters.id.trim() !== "" ||
      filters.startDate !== "" ||
      filters.endDate !== "" ||
      filters.requestType !== "" ||
      filters.assignedBy.trim() !== "" ||
      filters.status !== ""

    // Si no hay filtros específicos, mostramos todas las asignaciones del usuario
    if (!hasSpecificFilters) {
      setFilteredAsignaciones(asignaciones)
      return
    }

    // Aplicar filtros específicos
    let filtered = asignaciones

    // Filtro por ID
    if (filters.id) {
      filtered = filtered.filter((asignacion) => asignacion.id.toString().includes(filters.id))
    }

    // Filtro por tipo de solicitud (mejorado con los detalles completos)
    if (filters.requestType) {
      filtered = filtered.filter((asignacion) => {
        const tipoSolicitud = determinarTipoSolicitud(asignacion)
        console.log(`Asignación ${asignacion.id}, tipo: ${tipoSolicitud}`)

        if (filters.requestType === "water_supply") {
          return (
            tipoSolicitud.includes("Fallo en el suministro del agua") ||
            tipoSolicitud.includes("Fallo en el Suministro del Agua")
          )
        } else if (filters.requestType === "app_failure") {
          return tipoSolicitud.includes("Fallo en el aplicativo") || tipoSolicitud.includes("Fallo en el Aplicativo")
        } else if (filters.requestType === "flow_definitive_cancel") {
          return tipoSolicitud.includes("Cancelación Definitiva de Caudal")
        }

        return false
      })
    }

    // Filtro por estado de solución
    if (filters.status) {
      filtered = filtered.filter((asignacion) => {
        const tieneSolucion = tieneInformeMantenimiento(asignacion.id)
        if (filters.status === "pending") return !tieneSolucion
        if (filters.status === "solved") return tieneSolucion
        return true
      })
    }

    // Filtro por usuario que asigna (documento o nombre)
    if (filters.assignedBy.trim()) {
      const searchTerm = filters.assignedBy.trim().toLowerCase()
      filtered = filtered.filter((asignacion) => {
        // Buscar en el documento
        if (asignacion.assigned_by && asignacion.assigned_by.toString().toLowerCase().includes(searchTerm)) {
          return true
        }
        // Buscar en el nombre si está disponible
        if (asignacion.assigned_by_name && asignacion.assigned_by_name.toString().toLowerCase().includes(searchTerm)) {
          return true
        }
        return false
      })
    }

    // Filtro por fecha de asignación
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((asignacion) => {
        const asignacionDate = new Date(asignacion.assignment_date)

        if (filters.startDate) {
          const startDate = new Date(filters.startDate)
          startDate.setHours(0, 0, 0, 0)
          if (asignacionDate < startDate) {
            return false
          }
        }

        if (filters.endDate) {
          const endDate = new Date(filters.endDate)
          endDate.setHours(23, 59, 59, 999)
          if (asignacionDate > endDate) {
            return false
          }
        }

        return true
      })
    }

    if (filtered.length === 0) {
      setModalTitle("Información")
      setModalMessage("No se encontraron asignaciones con los filtros aplicados.")
      setShowModal(true)
    }

    setFilteredAsignaciones(filtered)
  }, [filters, fetchAsignaciones, asignacionesCompletas])

  const handleSolucionar = (asignacion) => {
    // Navegar a la página de crear informe con el ID de la asignación
    navigate(`/reportes-y-novedades/crear-informe/${asignacion.id}`)
  }

  // Configuración de columnas para DataTable
  const columns = [
    { key: "id", label: "ID Asignación" },
    {
      key: "assignment_date",
      label: "Fecha Asignación",
      render: (asignacion) => new Date(asignacion.assignment_date).toLocaleDateString(),
    },
    {
      key: "assigned_by",
      label: "Asignado Por",
      render: (asignacion) => asignacion.assigned_by_name || asignacion.assigned_by || "No disponible",
    },
    {
      key: "assigned_to",
      label: "Asignado a",
      render: (asignacion) =>
        asignacion.assigned_to_name || asignacion.technician || asignacion.assigned_to || "No disponible",
    },
    {
      key: "request_type",
      label: "Tipo de Solicitud",
      render: (asignacion) => determinarTipoSolicitud(asignacion),
    },
    {
      key: "action",
      label: "Acción",
      render: (asignacion) => {
        const tieneSolucion = tieneInformeMantenimiento(asignacion.id)

        if (tieneSolucion) {
          return (
            <button
              disabled
              className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg w-full cursor-not-allowed"
              title="Esta asignación ya ha sido solucionada"
            >
              Solucionado
            </button>
          )
        }

        return (
          <button
            onClick={() => handleSolucionar(asignacion)}
            className="bg-[#365486] hover:bg-[#344663] text-white px-4 py-2 rounded-lg w-full"
          >
            Solucionar
          </button>
        )
      },
    },
  ]

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-15 text-lg md:text-xl font-semibold mb-6">Asignación de mantenimientos</h1>

        {/* Sección de filtros */}
        <div className="mb-6">
          <div className="p-4 rounded-lg">
            {/* Primera fila de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Filtro por ID de asignación */}
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="ID de asignación"
                  className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "")
                  }}
                  value={filters.id}
                  onChange={(e) => handleFilterChange("id", e.target.value)}
                  maxLength={8}
                />
              </div>

              {/* Filtro por usuario que asigna */}
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Asignador (documento o nombre)"
                  className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                  value={filters.assignedBy}
                  onChange={(e) => handleFilterChange("assignedBy", e.target.value)}
                />
              </div>

              {/* Filtro por tipo de solicitud */}
              <div className="relative">
                <select
                  className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
                  value={filters.requestType}
                  onChange={(e) => handleFilterChange("requestType", e.target.value)}
                >
                  {requestTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <span className="absolute top-3 right-4 text-gray-400">
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>

              {/* Filtro por estado de solución */}
              <div className="relative">
                <select
                  className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  {solutionStates.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
                <span className="absolute top-3 right-4 text-gray-400">
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Segunda fila con filtro de fecha y botón */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              {/* Filtro por fecha - Ocupa 4 columnas en md */}
              <div className="md:col-span-4">
                <p className="text-gray-500 text-sm mb-1 text-center">Filtrar por fecha de asignación</p>
                <div className="flex items-center bg-gray-100 rounded-full px-1 w-full border border-gray-300">
                  <span className="text-gray-400 px-2 flex-shrink-0">
                    <Search size={18} />
                  </span>

                  <input
                    type="date"
                    name="startDate"
                    className="w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
                    value={filters.startDate || ""}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />

                  <span className="text-gray-400 px-2 flex-shrink-0">|</span>

                  <input
                    type="date"
                    name="endDate"
                    className="w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
                    value={filters.endDate || ""}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  />
                </div>
                <div className="flex justify-between text-gray-400 text-xs px-2 mt-1">
                  <span>Inicio</span>
                  <span>Fin</span>
                </div>
              </div>

              {/* Botón de filtrar - Ocupa 2 columnas en md */}
              <div className="md:col-span-2 flex justify-center md:justify-start">
                <button
                  onClick={applyFilters}
                  disabled={loading}
                  className={`${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#365486] hover:bg-[#344663] hover:scale-105"
                  } text-white px-6 py-2 rounded-full text-sm font-semibold w-full md:w-auto`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin inline-block mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Cargando...
                    </>
                  ) : (
                    "Filtrar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contador de resultados - Solo mostrar cuando hay resultados */}
        {filteredAsignaciones && (
          <div className="mb-4 text-sm text-gray-600">
            Total de asignaciones encontradas: {filteredAsignaciones.length}
          </div>
        )}

        {/* Modal para mensajes */}
        {showModal && (
          <Modal showModal={showModal} onClose={() => setShowModal(false)} title={modalTitle} btnMessage="Aceptar">
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Usar DataTable para mostrar los resultados */}
        {filteredAsignaciones !== null ? (
          <DataTable
            columns={columns}
            data={filteredAsignaciones}
            emptyMessage="No hay asignaciones para mostrar con los filtros aplicados."
            actions={false}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Aplica filtros para ver las asignaciones.
          </div>
        )}
      </div>
    </div>
  )
}

export default InformeMantenimiento
