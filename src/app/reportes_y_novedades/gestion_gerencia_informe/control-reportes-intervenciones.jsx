"use client"

import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import axios from "axios"
import { Search, Filter, User, Calendar } from "lucide-react"
import DataTable from "../../../components/DataTable"

const ControlReportesIntervenciones = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [informes, setInformes] = useState([])
  const [filteredInformes, setFilteredInformes] = useState(null) // Inicialmente null para indicar que no se ha aplicado filtro
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("Error")

  // Estados para los filtros
  const [filters, setFilters] = useState({
    id: "",
    startDate: "",
    endDate: "",
    reportType: "",
    technicianId: "",
    reporterId: "",
  })

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Tipos de reportes para el filtro
  const reportTypes = [
    { value: "", label: "Todos los tipos" },
    { value: "water_supply", label: "Fallo en el suministro del agua" },
    { value: "flow_definitive_cancel", label: "Cancelación definitiva de caudal" },
    { value: "app_failure", label: "Fallo en el aplicativo" },
  ]

  // Modificar la función fetchInformes para usar el endpoint correcto
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

      // Usar el endpoint que muestra los informes de mantenimiento en estado "A espera de aprobación"
      const response = await axios.get(`${API_URL}/communication/maintenance-reports/list`, {
        headers: { Authorization: `Token ${token}` },
      })

      // Filtrar solo los informes que no están aprobados
      const pendingReports = response.data.filter((report) => report.is_approved === false)

      console.log("Informes obtenidos:", pendingReports)
      setInformes(pendingReports)
      setLoading(false)
      return pendingReports
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
    const dataToFilter = await fetchInformes()

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
      filters.reporterId.trim() !== ""

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

    // Filtro por tipo de reporte
    if (filters.reportType) {
      if (filters.reportType === "water_supply") {
        filtered = filtered.filter(
          (informe) =>
            informe.assignment_details &&
            informe.assignment_details.failure_report &&
            informe.assignment_details.failure_report.failure_type === "Fallo en el suministro del agua",
        )
      } else if (filters.reportType === "flow_definitive_cancel") {
        filtered = filtered.filter(
          (informe) =>
            informe.assignment_details &&
            informe.assignment_details.flow_request &&
            informe.assignment_details.flow_request.flow_request_type === "Cancelación Definitiva de Caudal",
        )
      } else if (filters.reportType === "app_failure") {
        filtered = filtered.filter(
          (informe) =>
            informe.assignment_details &&
            informe.assignment_details.failure_report &&
            informe.assignment_details.failure_report.failure_type === "Fallo en el aplicativo",
        )
      }
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
        if (informe.assignment_details) {
          if (informe.assignment_details.flow_request && informe.assignment_details.flow_request.created_by) {
            return informe.assignment_details.flow_request.created_by.toString().includes(filters.reporterId.trim())
          }
          if (informe.assignment_details.failure_report && informe.assignment_details.failure_report.created_by) {
            return informe.assignment_details.failure_report.created_by.toString().includes(filters.reporterId.trim())
          }
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
  }, [filters, fetchInformes])

  const handleGestionar = (informe) => {
    // Navegar a la página de gestionar informe con el ID del informe
    navigate(`/reportes-y-novedades/gestionar-informe/${informe.id}`)
  }

  // Actualizar las columnas para adaptarse a la estructura de datos del backend
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
      render: (informe) =>
        informe.assignment_details?.assigned_to_name || informe.assignment_details?.assigned_to || "No disponible",
    },
    {
      key: "report_type",
      label: "Tipo de Reporte",
      render: (informe) => {
        if (informe.assignment_details) {
          if (informe.assignment_details.failure_report) {
            return informe.assignment_details.failure_report.failure_type || "Reporte de fallo"
          } else if (informe.assignment_details.flow_request) {
            return informe.assignment_details.flow_request.flow_request_type || "Solicitud de caudal"
          }
        }
        return "No especificado"
      },
    },
    {
      key: "action",
      label: "Acción",
      render: (informe) => (
        <button
          onClick={() => handleGestionar(informe)}
          className="bg-[#365486] hover:bg-[#344663] text-white px-4 py-2 rounded-lg w-full"
        >
          Gestionar
        </button>
      ),
    },
  ]

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20 mt-[70px] md:mt-[80px]">
        <h1 className="text-center my-6 text-xl font-semibold text-[#365486]">Control de reportes de intervenciones</h1>
        <div className="w-16 h-1 bg-[#365486] mx-auto mb-8 rounded-full"></div>

        {/* Sección de filtros */}
        <div className="mb-8 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col gap-4">
            {/* Primera fila de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Filtro por ID */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="ID asignación"
                  className="w-full pl-9 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486] text-sm"
                  value={filters.id}
                  onChange={(e) => handleFilterChange("id", e.target.value)}
                  maxLength={8}
                />
              </div>

              {/* Filtro por tipo de reporte */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Filter size={16} />
                </span>
                <select
                  className="w-full pl-9 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486] appearance-none text-sm"
                  value={filters.reportType}
                  onChange={(e) => handleFilterChange("reportType", e.target.value)}
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <span className="absolute top-3 right-3 text-gray-400 pointer-events-none">
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>

              {/* Filtro por ID del usuario que realizó la intervención */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="ID usuario intervención"
                  className="w-full pl-9 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486] text-sm"
                  value={filters.technicianId}
                  onChange={(e) => handleFilterChange("technicianId", e.target.value)}
                  maxLength={12}
                />
              </div>
            </div>

            {/* Segunda fila de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Filtro por ID del usuario que reportó */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="ID usuario que reportó"
                  className="w-full pl-9 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486] text-sm"
                  value={filters.reporterId}
                  onChange={(e) => handleFilterChange("reporterId", e.target.value)}
                  maxLength={12}
                />
              </div>

              {/* Filtros de fecha */}
              <div className="col-span-1 md:col-span-2">
                <p className="text-gray-500 text-xs font-medium mb-1.5 flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Filtrar por fecha de intervención
                </p>
                <div className="flex gap-3">
                  <div className="w-1/2 relative">
                    <input
                      type="date"
                      name="startDate"
                      className="w-full py-2 px-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486] text-sm"
                      value={filters.startDate || ""}
                      onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    />
                    <span className="text-gray-400 text-xs absolute -bottom-4 left-1">Inicio</span>
                  </div>

                  <div className="w-1/2 relative">
                    <input
                      type="date"
                      name="endDate"
                      className="w-full py-2 px-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486] text-sm"
                      value={filters.endDate || ""}
                      onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    />
                    <span className="text-gray-400 text-xs absolute -bottom-4 left-1">Fin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de filtrar */}
            <div className="flex justify-end mt-6">
              <button
                onClick={applyFilters}
                className={`${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#365486] hover:bg-[#2A4374]"
                } text-white px-6 py-2 rounded-md text-sm font-medium transition-colors w-full md:w-auto flex items-center justify-center`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  <>
                    <Filter size={16} className="mr-1.5" />
                    Filtrar
                  </>
                )}
              </button>
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
