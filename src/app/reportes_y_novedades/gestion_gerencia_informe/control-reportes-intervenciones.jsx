"use client"

import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import axios from "axios"
import { Search } from "lucide-react"
import DataTable from "../../../components/DataTable"

const ControlReportesIntervenciones = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [informes, setInformes] = useState([])
  const [filteredInformes, setFilteredInformes] = useState(null) // Inicialmente null para indicar que no se ha aplicado filtro
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("Error")
  const [informesCompletos, setInformesCompletos] = useState([]) // Para almacenar informes con detalles completos

  // Estados para los filtros
  const [filters, setFilters] = useState({
    id: "",
    startDate: "",
    endDate: "",
    reportType: "",
    technicianId: "",
    reporterId: "",
    status: "", // Nuevo filtro para estado de gestión
  })

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Tipos de reportes para el filtro
  const reportTypes = [
    { value: "", label: "TIPO" },
    { value: "water_supply", label: "Fallo en el suministro del agua" },
    { value: "flow_definitive_cancel", label: "Cancelación definitiva de caudal" },
    { value: "app_failure", label: "Fallo en el aplicativo" },
  ]

  // Estados de gestión para el filtro
  const managementStates = [
    { value: "", label: "ESTADO" },
    { value: "pending", label: "Pendiente de gestión" },
    { value: "managed", label: "Gestionado" },
    { value: "approved", label: "Aprobado" },
  ]

  // Función para obtener los detalles completos de un informe
  const obtenerDetallesCompletos = async (informe, token) => {
    const informeCompleto = { ...informe }

    try {
      // Si hay un reporte de fallo, obtener sus detalles completos
      if (
        informeCompleto.assignment_details &&
        informeCompleto.assignment_details.failure_report &&
        typeof informeCompleto.assignment_details.failure_report !== "object"
      ) {
        try {
          const failureResponse = await axios.get(
            `${API_URL}/communication/assignments/failure-report/${informeCompleto.assignment_details.failure_report}`,
            { headers: { Authorization: `Token ${token}` } },
          )
          informeCompleto.assignment_details.failure_report = failureResponse.data
          console.log("Detalles de reporte de fallo:", failureResponse.data)
        } catch (error) {
          console.error("Error al obtener detalles del reporte de fallo:", error)
        }
      }

      // Si hay una solicitud de caudal, obtener sus detalles completos
      if (
        informeCompleto.assignment_details &&
        informeCompleto.assignment_details.flow_request &&
        typeof informeCompleto.assignment_details.flow_request !== "object"
      ) {
        try {
          const flowResponse = await axios.get(
            `${API_URL}/communication/assignments/flow-request/${informeCompleto.assignment_details.flow_request}`,
            { headers: { Authorization: `Token ${token}` } },
          )
          informeCompleto.assignment_details.flow_request = flowResponse.data
          console.log("Detalles de solicitud de caudal:", flowResponse.data)
        } catch (error) {
          console.error("Error al obtener detalles de la solicitud de caudal:", error)
        }
      }
    } catch (error) {
      console.error("Error general al obtener detalles:", error)
    }

    return informeCompleto
  }

  // Modificar la función fetchInformes para obtener detalles completos
  const fetchInformes = useCallback(async () => {
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

      // Usar el endpoint que muestra los informes de mantenimiento
      const response = await axios.get(`${API_URL}/communication/maintenance-reports/list`, {
        headers: { Authorization: `Token ${token}` },
      })

      console.log("Informes obtenidos:", response.data)

      // Obtener detalles completos para cada informe
      const informesConDetalles = await Promise.all(
        response.data.map(async (informe) => {
          return await obtenerDetallesCompletos(informe, token)
        }),
      )

      console.log("Informes con detalles completos:", informesConDetalles)
      setInformes(response.data)
      setInformesCompletos(informesConDetalles)
      setLoading(false)
      return informesConDetalles
    } catch (error) {
      console.error("Error al obtener los informes:", error)
      setModalTitle("Error")
      setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
      setShowModal(true)
      setLoading(false)
      return []
    }
  }, [API_URL])

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchInformes()
  }, [fetchInformes])

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  // Función para determinar el tipo de solicitud o reporte
  const determinarTipoSolicitud = (informe) => {
    if (!informe.assignment_details) return "No especificado"

    // Para solicitudes de caudal
    if (informe.assignment_details.flow_request) {
      if (typeof informe.assignment_details.flow_request === "object") {
        return informe.assignment_details.flow_request.flow_request_type || "Solicitud de caudal"
      }
      return "Solicitud de caudal"
    }

    // Para reportes de fallo
    if (informe.assignment_details.failure_report) {
      if (typeof informe.assignment_details.failure_report === "object") {
        return informe.assignment_details.failure_report.failure_type || "Reporte de fallo"
      }
      return "Reporte de fallo"
    }

    return "No especificado"
  }

  // Función para determinar el estado de gestión de un informe
  const determinarEstadoGestion = (informe) => {
    // Si el informe está aprobado
    if (informe.is_approved === true) {
      return "approved"
    }

    // Si el informe tiene un estado específico
    if (informe.status) {
      // Si el estado indica que está finalizado o gestionado
      if (informe.status === "Finalizado" || informe.status === "Gestionado") {
        return "managed"
      }
    }

    // Por defecto, consideramos que está pendiente
    return "pending"
  }

  // Modificar la función applyFilters para adaptarse a la estructura de datos del backend
  const applyFilters = useCallback(async () => {
    // Validación de ID (solo números y máximo 8 caracteres)
    if (filters.id && (!/^\d+$/.test(filters.id) || filters.id.length > 8)) {
      setModalTitle("Error")
      setModalMessage("El ID de asignación debe contener solo números y máximo 8 caracteres.")
      setShowModal(true)
      return
    }

    // Validación de ID del técnico (solo números y máximo 12 caracteres)
    if (filters.technicianId && (!/^\d+$/.test(filters.technicianId) || filters.technicianId.length > 12)) {
      setModalTitle("Error")
      setModalMessage("El ID del usuario encargado debe contener solo números y máximo 12 caracteres.")
      setShowModal(true)
      return
    }

    // Validación de ID del reportador (solo números y máximo 12 caracteres)
    if (filters.reporterId && (!/^\d+$/.test(filters.reporterId) || filters.reporterId.length > 12)) {
      setModalTitle("Error")
      setModalMessage("El ID del usuario que reportó debe contener solo números y máximo 12 caracteres.")
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

    // Obtener los datos - siempre traemos todos los registros
    let dataToFilter = []
    if (informesCompletos.length === 0) {
      dataToFilter = await fetchInformes()
    } else {
      dataToFilter = informesCompletos
    }

    // Si no hay datos, mostramos un mensaje
    if (!dataToFilter || dataToFilter.length === 0) {
      setModalTitle("Información")
      setModalMessage("No se encontraron informes pendientes de aprobación en el sistema.")
      setShowModal(true)
      setFilteredInformes([])
      return
    }

    // Verificar si hay filtros específicos aplicados
    const hasSpecificFilters =
      filters.id.trim() !== "" ||
      filters.startDate !== "" ||
      filters.endDate !== "" ||
      filters.reportType !== "" ||
      filters.technicianId.trim() !== "" ||
      filters.reporterId.trim() !== "" ||
      filters.status !== ""

    // Si no hay filtros específicos, mostramos todos los registros
    if (!hasSpecificFilters) {
      setFilteredInformes(dataToFilter)
      return
    }

    // Aplicar filtros específicos
    let filtered = dataToFilter

    // Filtro por ID
    if (filters.id) {
      filtered = filtered.filter((informe) => informe.assignment && informe.assignment.toString().includes(filters.id))
    }

    // Filtro por tipo de reporte (mejorado con los detalles completos)
    if (filters.reportType) {
      filtered = filtered.filter((informe) => {
        const tipoSolicitud = determinarTipoSolicitud(informe)
        console.log(`Informe ${informe.id}, tipo: ${tipoSolicitud}`)

        if (filters.reportType === "water_supply") {
          return (
            tipoSolicitud.includes("Fallo en el suministro del agua") ||
            tipoSolicitud.includes("Fallo en el Suministro del Agua")
          )
        } else if (filters.reportType === "app_failure") {
          return tipoSolicitud.includes("Fallo en el aplicativo") || tipoSolicitud.includes("Fallo en el Aplicativo")
        } else if (filters.reportType === "flow_definitive_cancel") {
          return tipoSolicitud.includes("Cancelación Definitiva de Caudal")
        }

        return false
      })
    }

    // Filtro por estado de gestión
    if (filters.status) {
      filtered = filtered.filter((informe) => {
        const estadoGestion = determinarEstadoGestion(informe)
        return estadoGestion === filters.status
      })
    }

    // Filtro por ID del técnico
    if (filters.technicianId.trim()) {
      filtered = filtered.filter(
        (informe) =>
          informe.assignment_details &&
          informe.assignment_details.assigned_to &&
          informe.assignment_details.assigned_to.toString().includes(filters.technicianId.trim()),
      )
    }

    // Filtro por ID del reportador
    if (filters.reporterId.trim()) {
      filtered = filtered.filter((informe) => {
        if (informe.assignment_details && informe.assignment_details.assigned_by) {
          return informe.assignment_details.assigned_by.toString().includes(filters.reporterId.trim())
        }
        return false
      })
    }

    // Filtro por fecha de intervención
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((informe) => {
        const interventionDate = new Date(informe.intervention_date)

        if (filters.startDate) {
          const startDate = new Date(filters.startDate)
          startDate.setHours(0, 0, 0, 0)
          if (interventionDate < startDate) {
            return false
          }
        }

        if (filters.endDate) {
          const endDate = new Date(filters.endDate)
          endDate.setHours(23, 59, 59, 999)
          if (interventionDate > endDate) {
            return false
          }
        }

        return true
      })
    }

    if (filtered.length === 0) {
      setModalTitle("Información")
      setModalMessage("No se encontraron informes con los filtros aplicados.")
      setShowModal(true)
    }

    setFilteredInformes(filtered)
  }, [filters, fetchInformes, informesCompletos])

  // Actualizar la función handleGestionar para mantener la consistencia
  const handleGestionar = (informe) => {
    // Navegar a la página de gestionar informe con el ID del informe
    navigate(`/reportes-y-novedades/gestionar-informe/${informe.id}`)
  }

  // Actualizar las columnas para adaptarse a la estructura de datos del backend y usar el nuevo estilo de botón
  const columns = [
    {
      key: "assignment",
      label: "ID Asignación",
      render: (informe) => informe.assignment || "No disponible",
    },
    {
      key: "intervention_date",
      label: "Fecha Intervención",
      render: (informe) => new Date(informe.intervention_date).toLocaleDateString(),
    },
    {
      key: "technician_id",
      label: "ID Usuario Intervención",
      render: (informe) => informe.assignment_details?.assigned_to || "No disponible",
    },
    {
      key: "reporter_id",
      label: "ID Usuario que Reportó",
      render: (informe) => {
        // Verificar si hay un campo assigned_by (quien asignó podría ser quien reportó)
        if (informe.assignment_details?.assigned_by) {
          return informe.assignment_details.assigned_by
        }
        return "No disponible"
      },
    },
    {
      key: "report_type",
      label: "Tipo de Solicitud",
      render: (informe) => determinarTipoSolicitud(informe),
    },
    {
      key: "action",
      label: "Acción",
      render: (informe) => {
        const estadoGestion = determinarEstadoGestion(informe)

        return (
          <button
            onClick={() => handleGestionar(informe)}
            className="bg-[#365486] hover:bg-[#42A5F5] text-white text-xs px-4 py-1 h-8 rounded-lg w-24"
          >
            {estadoGestion === "approved" ? "Ver" : "Gestionar"}
          </button>
        )
      },
    },
  ]

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        {/* Título con el nuevo estilo */}
        <h1 className="text-center my-15 text-lg md:text-xl font-semibold mb-6">
          Control de reportes de intervenciones
        </h1>

        {/* Sección de filtros con el nuevo diseño */}
        <div className="mb-6">
          <div className="p-4 rounded-lg">
            {/* Primera fila de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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

              {/* Filtro por ID del usuario que realizó la intervención */}
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="ID usuario intervención"
                  className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "")
                  }}
                  value={filters.technicianId}
                  onChange={(e) => handleFilterChange("technicianId", e.target.value)}
                  maxLength={12}
                />
              </div>

              {/* Filtro por ID del usuario que reportó */}
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="ID usuario que reportó"
                  className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "")
                  }}
                  value={filters.reporterId}
                  onChange={(e) => handleFilterChange("reporterId", e.target.value)}
                  maxLength={12}
                />
              </div>

              {/* Filtro por tipo de reporte */}
              <div className="relative">
                <select
                  className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
                  value={filters.reportType}
                  onChange={(e) => handleFilterChange("reportType", e.target.value)}
                >
                  {reportTypes.map((type) => (
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

              {/* Filtro por estado de gestión */}
              <div className="relative">
                <select
                  className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  {managementStates.map((state) => (
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
                <p className="text-gray-500 text-sm mb-1 text-center">Filtrar por fecha de intervención</p>
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
                  Filtrar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contador de resultados - Solo mostrar cuando hay resultados */}
        {filteredInformes && (
          <div className="mb-4 text-sm text-gray-600">Total de informes encontrados: {filteredInformes.length}</div>
        )}

        {/* Modal para mensajes */}
        {showModal && (
          <Modal showModal={showModal} onClose={() => setShowModal(false)} title={modalTitle} btnMessage="Aceptar">
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Usar DataTable para mostrar los resultados */}
        {filteredInformes !== null ? (
          <DataTable
            columns={columns}
            data={filteredInformes}
            emptyMessage="No hay informes para mostrar con los filtros aplicados."
            actions={false}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Aplica filtros para ver los informes de intervenciones.
          </div>
        )}
      </div>
    </div>
  )
}

export default ControlReportesIntervenciones
