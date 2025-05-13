"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import axios from "axios"
import BackButton from "../../../components/BackButton"
import { CheckCircle, RefreshCw } from "lucide-react"

const GestionarInforme = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [informe, setInforme] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para mostrar el modal de reasignación
  const [showReasignModal, setShowReasignModal] = useState(false)

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Update the fetchInforme function to get the assignment_status field
  const fetchInforme = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        setModalTitle("Error")
        setModalMessage("No hay una sesión activa. Por favor, inicie sesión.")
        setShowModal(true)
        setLoading(false)
        return
      }

      // Obtener los detalles del informe usando el endpoint correcto
      const response = await axios.get(`${API_URL}/communication/maintenance-reports/${id}`, {
        headers: { Authorization: `Token ${token}` },
      })

      console.log("Detalles del informe:", response.data)

      // Obtener detalles adicionales si es necesario
      const informeData = response.data

      // Si hay una asignación, obtener sus detalles completos
      if (informeData.assignment_details) {
        const assignmentDetails = informeData.assignment_details

        // Si hay una solicitud de caudal, obtener sus detalles completos
        if (assignmentDetails.flow_request && typeof assignmentDetails.flow_request !== "object") {
          try {
            const flowResponse = await axios.get(
              `${API_URL}/communication/assignments/flow-request/${assignmentDetails.flow_request}`,
              { headers: { Authorization: `Token ${token}` } },
            )
            assignmentDetails.flow_request = flowResponse.data
            console.log("Detalles de solicitud de caudal:", flowResponse.data)
          } catch (error) {
            console.error("Error al obtener detalles de la solicitud de caudal:", error)
          }
        }

        // Si hay un reporte de fallo, obtener sus detalles completos
        if (assignmentDetails.failure_report && typeof assignmentDetails.failure_report !== "object") {
          try {
            const failureResponse = await axios.get(
              `${API_URL}/communication/assignments/failure-report/${assignmentDetails.failure_report}`,
              { headers: { Authorization: `Token ${token}` } },
            )
            assignmentDetails.failure_report = failureResponse.data
            console.log("Detalles de reporte de fallo:", failureResponse.data)
          } catch (error) {
            console.error("Error al obtener detalles del reporte de fallo:", error)
          }
        }
      }

      setInforme(informeData)
      setLoading(false)
    } catch (error) {
      console.error("Error al obtener los detalles del informe:", error)
      setModalTitle("Error")
      setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
      setShowModal(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInforme()
  }, [API_URL, id])

  // Update the handleAceptar function to fix the 500 error
  const handleAceptar = async () => {
    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")

      // Intentar con método PUT primero
      try {
        await axios.put(
          `${API_URL}/communication/maintenance-reports/${id}`,
          { is_approved: true },
          { headers: { Authorization: `Token ${token}` } },
        )

        // Mostrar mensaje de éxito
        setModalTitle("Éxito")
        setModalMessage("La aceptación del informe fue exitosa")
        setShowModal(true)

        // Redirigir después de cerrar el modal
        setTimeout(() => {
          navigate("/reportes-y-novedades/control-reportes-intervenciones")
        }, 2000)

        return
      } catch (putError) {
        console.error("Error with PUT method:", putError)

        // Si falla PUT, intentar con POST sin cuerpo
        try {
          await axios({
            method: "post",
            url: `${API_URL}/communication/maintenance-reports/${id}/approve`,
            headers: { Authorization: `Token ${token}` },
            // No enviar ningún cuerpo en la solicitud
            data: null,
          })

          // Mostrar mensaje de éxito
          setModalTitle("Éxito")
          setModalMessage("La aceptación del informe fue exitosa")
          setShowModal(true)

          // Redirigir después de cerrar el modal
          setTimeout(() => {
            navigate("/reportes-y-novedades/control-reportes-intervenciones")
          }, 2000)

          return
        } catch (postError) {
          console.error("Error with POST method (no body):", postError)
          throw postError
        }
      }
    } catch (error) {
      console.error("Error al aceptar el informe:", error)
      let errorMessage = "Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico."

      // Check for specific error messages from the backend
      if (error.response) {
        if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data && error.response.data.error && error.response.data.error.message) {
          errorMessage = error.response.data.error.message
        } else if (error.response.status === 404) {
          errorMessage =
            "No se encontró el endpoint para aprobar el informe. Por favor contacte al equipo de desarrollo."
        } else if (error.response.status === 500) {
          errorMessage =
            "Error interno del servidor. Por favor contacte al equipo de desarrollo con el ID del informe: " + id
        } else if (error.response.status === 405) {
          errorMessage = "Método no permitido. Por favor contacte al equipo de desarrollo."
        }
      }

      setModalTitle("Error")
      setModalMessage(errorMessage)
      setShowModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modificar la función handleReasignar para usar el endpoint correcto
  const handleReasignar = () => {
    // Mostrar el modal de reasignación
    setShowReasignModal(true)
  }

  // Modificar la función renderReportInfo para adaptarse a la estructura de datos del backend
  const renderReportInfo = () => {
    if (!informe || !informe.assignment_details) return null

    const details = informe.assignment_details
    const isFlowRequest = details.flow_request
    const isFailureReport = details.failure_report

    // Extraer información común
    const reporterId = isFlowRequest
      ? details.flow_request?.created_by
      : isFailureReport
        ? details.failure_report?.created_by
        : "No disponible"
    const reportDate = isFlowRequest
      ? details.flow_request?.created_at
      : isFailureReport
        ? details.failure_report?.created_at
        : null
    const reportType = isFlowRequest
      ? details.flow_request?.flow_request_type
      : isFailureReport
        ? details.failure_report?.failure_type
        : "No especificado"
    const reportId = isFlowRequest
      ? details.flow_request?.id
      : isFailureReport
        ? details.failure_report?.id
        : "No disponible"

    // Extraer información específica
    let plotId = "No disponible"
    let lotId = "No disponible"
    let observations = "Sin observaciones"

    if (isFlowRequest) {
      if (details.flow_request?.lot) {
        const lotParts = details.flow_request.lot.split("-")
        if (lotParts.length === 2) {
          plotId = lotParts[0]
          lotId = lotParts[1]
        } else {
          lotId = details.flow_request.lot
        }
      }
      observations = details.flow_request?.observations || "Sin observaciones"
    } else if (isFailureReport) {
      if (details.failure_report?.lot) {
        const lotParts = details.failure_report.lot.split("-")
        if (lotParts.length === 2) {
          plotId = lotParts[0]
          lotId = lotParts[1]
        } else {
          lotId = details.failure_report.lot
        }
      }
      if (details.failure_report?.plot) {
        plotId = details.failure_report.plot
      }
      observations = details.failure_report?.observations || "Sin observaciones"
    }

    return (
      <div className="space-y-6">
        <h3 className="text-md font-semibold text-[#365486] mb-2">Información enviada por el usuario</h3>

        {/* Información del usuario y fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Usuario que envía la solicitud</p>
            <p className="font-medium">{reporterId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de solicitud</p>
            <p className="font-medium">{reportDate ? new Date(reportDate).toLocaleDateString() : "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tipo de solicitud</p>
            <p className="font-medium">{reportType}</p>
          </div>
        </div>

        {/* ID de solicitud y datos del lote/predio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">ID de la solicitud</p>
            <p className="font-medium">{reportId}</p>
          </div>
          {(isFlowRequest || isFailureReport) && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">ID del predio</p>
                <p className="font-medium">{plotId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ID del lote</p>
                <p className="font-medium">{lotId}</p>
              </div>
            </>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <h3 className="text-md font-semibold text-[#365486] mb-2">Observaciones</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#365486] mt-0.5 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10" />
              </svg>
              <p className="font-medium text-gray-700 break-words">{observations}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Update the renderInterventionInfo function to display assignment_status
  const renderInterventionInfo = () => {
    if (!informe) return null

    return (
      <div className="space-y-6">
        <h3 className="text-md font-semibold text-[#365486] mb-2">Información enviada por el usuario encargado</h3>

        {/* Fechas de asignación e intervención */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de asignación</p>
            <p className="font-medium">
              {informe.assignment_details?.assignment_date
                ? new Date(informe.assignment_details.assignment_date).toLocaleDateString()
                : "No disponible"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de intervención</p>
            <p className="font-medium">
              {informe.intervention_date ? new Date(informe.intervention_date).toLocaleDateString() : "No disponible"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Estado de la intervención</p>
            <p className="font-medium">{informe.status || "No disponible"}</p>
          </div>
        </div>

        {/* Estado de la solicitud */}
        <div>
          <p className="text-sm font-medium text-gray-500">Estado de la solicitud/reporte</p>
          <p className="font-medium">
            {informe.assignment_status ||
              informe.assignment_details?.flow_request?.status ||
              informe.assignment_details?.failure_report?.status ||
              "A espera de aprobación"}
          </p>
        </div>

        {/* Descripción de la intervención */}
        <div>
          <h3 className="text-md font-semibold text-[#365486] mb-2">Descripción detallada de la intervención</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 break-words">{informe.description || "Sin descripción"}</p>
          </div>
        </div>

        {/* Fotografías de la intervención */}
        {informe.images && (
          <div>
            <h3 className="text-md font-semibold text-[#365486] mb-2">Fotografías de la intervención</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(informe.images) ? (
                // Si es un array de imágenes
                informe.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Imagen de intervención ${index + 1}`}
                      className="h-48 w-full object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                ))
              ) : (
                // Si es una sola imagen en formato string
                <div className="relative">
                  <img
                    src={informe.images || "/placeholder.svg"}
                    alt="Imagen de intervención"
                    className="h-48 w-full object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const [reasignInforme, setReasignInforme] = useState(null)

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20 mt-[70px] md:mt-[80px]">
        <h1 className="text-center text-xl font-semibold text-[#365486]">Gestionar Informe de Mantenimiento</h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#365486]"></div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Información del reporte/solicitud */}
            <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">{renderReportInfo()}</div>

            {/* Información de la intervención */}
            <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">{renderInterventionInfo()}</div>

            {/* Botones de acción */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mt-8">
              <BackButton to="/reportes-y-novedades/control-reportes-intervenciones" text="Volver" />

              <div className="flex flex-col md:flex-row gap-4">
                

                <button
                  onClick={handleAceptar}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#365486] hover:bg-[#2A4374] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#365486] disabled:bg-gray-400 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? (
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
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} className="mr-2" />
                      Aceptar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para mensajes */}
        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false)
              if (modalTitle === "Éxito") {
                navigate("/reportes-y-novedades/control-reportes-intervenciones")
              }
            }}
            title={modalTitle}
            btnMessage="Aceptar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Modal de reasignación */}
        {showReasignModal && (
          <ReasignarModal
            showModal={showReasignModal}
            onClose={() => setShowReasignModal(false)}
            informeId={id}
            API_URL={API_URL}
            onSuccess={() => {
              setModalTitle("Éxito")
              setModalMessage("La reasignación fue exitosa")
              setShowReasignModal(false)
              setShowModal(true)
            }}
          />
        )}
      </div>
    </div>
  )
}

// Componente para el modal de reasignación
const ReasignarModal = ({ showModal, onClose, informeId, API_URL, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState("")
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({
    userId: "",
    role: "",
  })
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedStatus] = useState("En proceso") // Estado fijo según requerimiento
  const [reasignInforme, setReasignInforme] = useState(null)

  // Lista de roles disponibles
  const roles = [
    { value: "", label: "Seleccione un rol" },
    { value: "technician", label: "Técnico" },
    { value: "manager", label: "Gerente" },
    { value: "admin", label: "Administrador" },
  ]

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  // Modificar la clase ReasignarModal para usar el endpoint correcto
  const searchUsers = async () => {
    try {
      setSearchLoading(true)
      setError("")

      // Validar que al menos un filtro esté completo
      if (!filters.userId && !filters.role) {
        setError("Debe completar al menos un filtro")
        setSearchLoading(false)
        return
      }

      // Validar formato de ID si se proporciona
      if (filters.userId && (!/^\d+$/.test(filters.userId) || filters.userId.length > 12)) {
        setError("El ID del usuario debe contener solo números y máximo 12 caracteres")
        setSearchLoading(false)
        return
      }

      const token = localStorage.getItem("token")

      // Construir los parámetros de búsqueda
      const params = {}
      if (filters.userId) params.user_id = filters.userId
      if (filters.role) params.role = filters.role

      // Realizar la búsqueda de usuarios - Adaptado para usar el endpoint correcto
      // Nota: Este endpoint puede necesitar ajustes según la API real
      const response = await axios.get(`${API_URL}/users/search`, {
        headers: { Authorization: `Token ${token}` },
        params,
      })

      // Verificar si hay resultados
      if (response.data.length === 0) {
        if (filters.userId && filters.role) {
          setError("No se encontraron usuarios con el ID y rol especificados")
        } else if (filters.userId) {
          setError("No se encontró ningún usuario con el ID especificado")
        } else {
          setError("No se encontraron usuarios con el rol especificado")
        }
        setUsers([])
      } else {
        setUsers(response.data)
        setError("")
      }
    } catch (error) {
      console.error("Error al buscar usuarios:", error)
      setError("Error al buscar usuarios. Intente nuevamente.")
      setUsers([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAssign = async (userId) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      // Obtener el ID de la asignación del informe
      const assignmentId = reasignInforme?.assignment

      // Enviar la solicitud para reasignar la asignación
      await axios.post(
        `${API_URL}/communication/assignments/${assignmentId}/reassign`,
        {
          assigned_to: userId,
          status: selectedStatus,
        },
        { headers: { Authorization: `Token ${token}` } },
      )

      // Notificar éxito
      onSuccess()
    } catch (error) {
      console.error("Error al reasignar el informe:", error)
      setErrorMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchReasignInforme = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/communication/maintenance-reports/${informeId}`, {
          headers: { Authorization: `Token ${token}` },
        })

        // Obtener detalles adicionales si es necesario
        const informeData = response.data

        // Si hay una asignación, obtener sus detalles completos
        if (informeData.assignment_details) {
          const assignmentDetails = informeData.assignment_details

          // Si hay una solicitud de caudal, obtener sus detalles completos
          if (assignmentDetails.flow_request && typeof assignmentDetails.flow_request !== "object") {
            try {
              const flowResponse = await axios.get(
                `${API_URL}/communication/assignments/flow-request/${assignmentDetails.flow_request}`,
                { headers: { Authorization: `Token ${token}` } },
              )
              assignmentDetails.flow_request = flowResponse.data
            } catch (error) {
              console.error("Error al obtener detalles de la solicitud de caudal:", error)
            }
          }

          // Si hay un reporte de fallo, obtener sus detalles completos
          if (assignmentDetails.failure_report && typeof assignmentDetails.failure_report !== "object") {
            try {
              const failureResponse = await axios.get(
                `${API_URL}/communication/assignments/failure-report/${assignmentDetails.failure_report}`,
                { headers: { Authorization: `Token ${token}` } },
              )
              assignmentDetails.failure_report = failureResponse.data
            } catch (error) {
              console.error("Error al obtener detalles del reporte de fallo:", error)
            }
          }
        }

        setReasignInforme(informeData)
      } catch (error) {
        console.error("Error al obtener los detalles del informe:", error)
        setErrorMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
        setShowErrorModal(true)
      }
    }

    fetchReasignInforme()
  }, [API_URL, informeId])

  if (!showModal) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[#365486] mb-4">Reasignar Informe</h2>

          {/* Filtros de búsqueda */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Filtro por ID de usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID del usuario</label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]"
                  placeholder="Ingrese el ID del usuario"
                  maxLength={12}
                />
              </div>

              {/* Filtro por rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol del usuario</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486] appearance-none"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estado de la asignación (fijo en "En proceso") */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de la solicitud/reporte <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStatus}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              >
                <option value="En proceso">En proceso</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Este campo es obligatorio y no se puede modificar</p>
            </div>

            {/* Botón de búsqueda */}
            <div className="flex justify-end">
              <button
                onClick={searchUsers}
                disabled={searchLoading}
                className="px-4 py-2 bg-[#365486] text-white rounded-md hover:bg-[#2A4374] focus:outline-none focus:ring-2 focus:ring-[#365486] disabled:bg-gray-400 flex items-center"
              >
                {searchLoading ? (
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
                    Buscando...
                  </>
                ) : (
                  "Buscar"
                )}
              </button>
            </div>

            {/* Mensaje de error */}
            {error && <div className="mt-3 text-red-500 text-sm">{error}</div>}
          </div>

          {/* Tabla de resultados */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apellido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.document}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.first_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.last_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleAssign(user.document)}
                          disabled={loading}
                          className="text-[#365486] hover:text-[#2A4374] font-medium"
                        >
                          Enviar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      {error ? error : "Realice una búsqueda para ver resultados"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 mr-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de error */}
      {showErrorModal && (
        <Modal showModal={showErrorModal} onClose={() => setShowErrorModal(false)} title="Error" btnMessage="Aceptar">
          <p>{errorMessage}</p>
        </Modal>
      )}
    </div>
  )
}

export default GestionarInforme
