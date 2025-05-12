"use client"

import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import axios from "axios"
import { Search, Filter, User, Calendar } from "lucide-react"
import DataTable from "../../../components/DataTable"

const InformeMantenimiento = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [asignaciones, setAsignaciones] = useState([])
  const [filteredAsignaciones, setFilteredAsignaciones] = useState(null) // Inicialmente null para indicar que no se ha aplicado filtro
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("Error")

  // Estados para los filtros
  const [filters, setFilters] = useState({
    id: "",
    startDate: "",
    endDate: "",
    reportType: "",
    assignedBy: "",
    assignedTo: "",
  })

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Tipos de reportes para el filtro
  const reportTypes = [
    { value: "", label: "Todos los tipos" },
    { value: "water_supply", label: "Fallo en el suministro del agua" },
    { value: "flow_definitive_cancel", label: "Cancelación definitiva de caudal" },
    { value: "app_failure", label: "Fallo en el aplicativo" },
  ]

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

      // Usar el endpoint que muestra todas las asignaciones
      const response = await axios.get(`${API_URL}/communication/assignments/list`, {
        headers: { Authorization: `Token ${token}` },
      })

      console.log("Asignaciones obtenidas:", response.data)
      setAsignaciones(response.data)
      setLoading(false)
      return response.data
    } catch (error) {
      console.error("Error al obtener las asignaciones:", error)
      setModalTitle("Error")
      setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
      setShowModal(true)
      setLoading(false)
      return []
    }
  }, [API_URL])

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAsignaciones()
  }, [fetchAsignaciones])

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
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

    // Obtener los datos - siempre traemos todos los registros
    const dataToFilter = await fetchAsignaciones()

    // Si no hay datos, mostramos un mensaje
    if (!dataToFilter || dataToFilter.length === 0) {
      setModalTitle("Información")
      setModalMessage("No se encontraron asignaciones en el sistema.")
      setShowModal(true)
      setFilteredAsignaciones([])
      return
    }

    // Verificar si hay filtros específicos aplicados
    const hasSpecificFilters =
      filters.id.trim() !== "" ||
      filters.startDate !== "" ||
      filters.endDate !== "" ||
      filters.reportType !== "" ||
      filters.assignedBy.trim() !== "" ||
      filters.assignedTo.trim() !== ""

    // Si no hay filtros específicos, mostramos todos los registros
    if (!hasSpecificFilters) {
      setFilteredAsignaciones(dataToFilter)
      return
    }

    // Aplicar filtros específicos
    let filtered = dataToFilter

    // Filtro por ID
    if (filters.id) {
      filtered = filtered.filter((asignacion) => asignacion.id.toString().includes(filters.id))
    }

    // Filtro por tipo de reporte
    if (filters.reportType) {
      if (filters.reportType === "water_supply") {
        filtered = filtered.filter(
          (asignacion) =>
            asignacion.failure_report &&
            (typeof asignacion.failure_report === "object"
              ? asignacion.failure_report.failure_type === "Fallo en el suministro del agua"
              : true),
        )
      } else if (filters.reportType === "flow_definitive_cancel") {
        filtered = filtered.filter(
          (asignacion) =>
            asignacion.flow_request &&
            (typeof asignacion.flow_request === "object"
              ? asignacion.flow_request.flow_request_type === "Cancelación Definitiva de Caudal"
              : true),
        )
      } else if (filters.reportType === "app_failure") {
        filtered = filtered.filter(
          (asignacion) =>
            asignacion.failure_report &&
            (typeof asignacion.failure_report === "object"
              ? asignacion.failure_report.failure_type === "Fallo en el aplicativo"
              : true),
        )
      }
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

    // Filtro por usuario asignado (documento o nombre)
    if (filters.assignedTo.trim()) {
      const searchTerm = filters.assignedTo.trim().toLowerCase()
      filtered = filtered.filter((asignacion) => {
        // Buscar en el documento
        if (asignacion.assigned_to && asignacion.assigned_to.toString().toLowerCase().includes(searchTerm)) {
          return true
        }
        // Buscar en el nombre si está disponible
        if (asignacion.assigned_to_name && asignacion.assigned_to_name.toString().toLowerCase().includes(searchTerm)) {
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
  }, [filters, fetchAsignaciones])

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
      label: "Asignado A",
      render: (asignacion) => asignacion.assigned_to_name || asignacion.assigned_to || "No disponible",
    },
    {
      key: "report_type",
      label: "Tipo de Reporte",
      render: (asignacion) => {
        return typeof asignacion.flow_request === "object" && asignacion.flow_request?.flow_request_type
          ? asignacion.flow_request.flow_request_type
          : typeof asignacion.failure_report === "object" && asignacion.failure_report?.failure_type
            ? asignacion.failure_report.failure_type
            : asignacion.flow_request
              ? "Solicitud de caudal"
              : asignacion.failure_report
                ? "Reporte de fallo"
                : "No especificado"
      },
    },
    {
      key: "action",
      label: "Acción",
      render: (asignacion) => (
        <button
          onClick={() => handleSolucionar(asignacion)}
          className="bg-[#365486] hover:bg-[#344663] text-white px-4 py-2 rounded-lg w-full"
        >
          Solucionar
        </button>
      ),
    },
  ]

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-15 text-lg md:text-xl font-semibold mb-6">
          Asignación de mantenimientos
        </h1>

        {/* Sección de filtros */}
        <div className="mb-8 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col gap-4">
            {/* Primera fila de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

              {/* Filtro por usuario que asigna */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Asignador"
                  className="w-full pl-9 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486] text-sm"
                  value={filters.assignedBy}
                  onChange={(e) => handleFilterChange("assignedBy", e.target.value)}
                />
              </div>

              {/* Filtro por usuario asignado */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Asignado a"
                  className="w-full pl-9 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486] text-sm"
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange("assignedTo", e.target.value)}
                />
              </div>
            </div>

            {/* Segunda fila de filtros */}
            <div className="flex flex-col md:flex-row gap-3 items-end">
              {/* Filtros de fecha */}
              <div className="w-full md:w-3/4">
                <p className="text-gray-500 text-xs font-medium mb-1.5 flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Filtrar por fecha de asignación
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

              {/* Botón de filtrar */}
              <div className="w-full md:w-1/4 mt-6 md:mt-0">
                <button
                  onClick={applyFilters}
                  className={`${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#365486] hover:bg-[#2A4374]"
                  } text-white px-6 py-2 rounded-md text-sm font-medium transition-colors w-full flex items-center justify-center`}
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
