"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import axios from "axios"
import BackButton from "../../../components/BackButton"
import { CheckCircle, RefreshCw, Search, X, AlertCircle, Info, ChevronDown, Eye } from "lucide-react"

const GestionarInforme = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Eliminar el estado hasPermission
  const [loading, setLoading] = useState(true)
  const [informe, setInforme] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false) // Estado para modo solo lectura

  // Estado para mostrar el modal de reasignación
  const [showReasignModal, setShowReasignModal] = useState(false)

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Modificar la función fetchInforme para establecer correctamente el modo solo lectura
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

      // Verificar si el informe está aprobado para establecer modo solo lectura
      if (response.data.is_approved === true) {
        setIsReadOnly(true)
      }

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

  // Eliminar la función checkUserPermissions

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
        } else if (error.response.status === 403) {
          errorMessage = "No tienes permisos para realizar esta acción."
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

  // Modificar el return para eliminar la condición que muestra la pantalla de acceso denegado
  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20 mt-[70px] md:mt-[80px]">
        <h1 className="text-center text-xl font-semibold text-[#365486]">
          {isReadOnly ? "Ver Informe de Mantenimiento" : "Gestionar Informe de Mantenimiento"}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#365486]"></div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Indicador de modo solo lectura */}
            {isReadOnly && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center text-blue-700">
                  <Eye size={18} className="mr-2" />
                  <p className="font-medium">Estás viendo un informe aprobado. No se pueden realizar cambios.</p>
                </div>
              </div>
            )}

            {/* Información del reporte/solicitud */}
            <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">{renderReportInfo()}</div>

            {/* Información de la intervención */}
            <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">{renderInterventionInfo()}</div>

            {/* Botones de acción */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mt-8">
              <BackButton to="/reportes-y-novedades/control-reportes-intervenciones" text="Volver" />

              {!isReadOnly && (
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={handleReasignar}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-[#4B77BE] hover:bg-[#3A5F9E] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B77BE] disabled:bg-gray-400 transition-all flex items-center justify-center"
                  >
                    <RefreshCw size={18} className="mr-2" />
                    Reasignar
                  </button>

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
              )}
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
    tipoRol: "",
    termBusqueda: "",
  })
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedStatus] = useState("En proceso") // Estado fijo según requerimiento
  const [reasignInforme, setReasignInforme] = useState(null)
  const [rolesDisponibles, setRolesDisponibles] = useState([])
  const [alert, setAlert] = useState({ show: false, type: "", message: "" })
  const [isOpen, setIsOpen] = useState(false)
  const [tecnicosFiltrados, setTecnicosFiltrados] = useState([])

  // Referencia para cerrar el dropdown al hacer clic fuera
  const dropdownRef = useRef(null)

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Efecto para filtrar técnicos cuando cambia el término de búsqueda
  useEffect(() => {
    if (users.length > 0) {
      if (!filters.termBusqueda) {
        setTecnicosFiltrados(users)
      } else {
        const filtered = users.filter(
          (tecnico) =>
            tecnico.document?.toString().includes(filters.termBusqueda) ||
            (tecnico.first_name && tecnico.first_name.toLowerCase().includes(filters.termBusqueda.toLowerCase())) ||
            (tecnico.email && tecnico.email.toLowerCase().includes(filters.termBusqueda.toLowerCase())),
        )
        setTecnicosFiltrados(filtered)
      }
    }
  }, [filters.termBusqueda, users])

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  // Función para mostrar alertas
  const showAlert = (type, message) => {
    setAlert({
      show: true,
      type,
      message,
    })

    // Ocultar la alerta después de 5 segundos si es de éxito
    if (type === "success") {
      setTimeout(() => {
        setAlert({ show: false, type: "", message: "" })
      }, 5000)
    }
  }

  // Función para extraer el mensaje de error del formato anidado
  const extractErrorMessage = (errorObj) => {
    try {
      // Caso especial para el error específico
      if (typeof errorObj === "string" && errorObj.includes("Solo se puede asignar a usuarios del grupo")) {
        return "Solo se puede asignar a usuarios del grupo 'Técnico' o 'Operador'."
      }

      // Si tenemos un string, intentar extraer el mensaje
      if (typeof errorObj === "string") {
        // Intento de extraer cualquier cosa entre string= y ", code=
        const fullPattern = /string=\\?"?([^"\\,]+?(?:'[^']*?'[^"\\,]*?)*)\\?"?, code=/
        const match = fullPattern.exec(errorObj)
        if (match && match[1]) {
          return match[1]
        }

        // Si lo anterior falla, intentar parsearlo como JSON
        try {
          const parsed = JSON.parse(errorObj)
          return extractErrorMessage(parsed)
        } catch (e) {
          // No es JSON - devolver como está si es menos de 100 caracteres
          if (errorObj.length < 100) return errorObj
          return "Error en el servidor. Por favor, intente más tarde."
        }
      }

      // Si es un objeto con error anidado
      if (errorObj.error && errorObj.error.message) {
        if (typeof errorObj.error.message === "string") {
          // Primero comprobar si contiene el mensaje específico
          if (errorObj.error.message.includes("Solo se puede asignar a usuarios del grupo")) {
            return "Solo se puede asignar a usuarios del grupo 'Técnico' o 'Operador'."
          }

          // Intentar extraer usando regex
          const fullPattern = /string=\\?"?([^"\\,]+?(?:'[^']*?'[^"\\,]*?)*)\\?"?, code=/
          const match = fullPattern.exec(errorObj.error.message)
          if (match && match[1]) {
            return match[1]
          }

          // Intentar parsear como JSON
          try {
            const innerError = JSON.parse(errorObj.error.message.replace(/'/g, '"'))
            if (innerError.non_field_errors && innerError.non_field_errors.length > 0) {
              return innerError.non_field_errors[0]
            }
          } catch (e) {
            // No es JSON, devolver el mensaje tal cual
            return errorObj.error.message
          }
        }
        return errorObj.error.message
      }

      // Errores con estructura non_field_errors
      if (errorObj.non_field_errors && Array.isArray(errorObj.non_field_errors)) {
        return errorObj.non_field_errors[0]
      }

      // Mensaje directo
      if (errorObj.message) {
        return errorObj.message
      }

      // Si es un array
      if (Array.isArray(errorObj) && errorObj.length > 0) {
        return errorObj[0]
      }

      // Campos específicos
      const errorKeys = Object.keys(errorObj)
      for (const key of errorKeys) {
        if (Array.isArray(errorObj[key]) && errorObj[key].length > 0) {
          return `${key}: ${errorObj[key][0]}`
        }
      }

      return "Error desconocido. Por favor, intente más tarde."
    } catch (e) {
      console.error("Error al parsear mensaje de error:", e)
      return "Error al procesar la solicitud."
    }
  }

  // Obtener roles disponibles
  const obtenerRoles = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      // Endpoint para listar grupos
      const response = await axios.get(`${API_URL}/admin/groups`, { headers: { Authorization: `Token ${token}` } })

      setRolesDisponibles(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error al obtener roles:", error)
      setLoading(false)

      if (!error.response) {
        setShowErrorModal(true)
        setErrorMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
      } else {
        let errorMessage = "Error al cargar los roles disponibles"

        if (error.response?.data) {
          errorMessage = extractErrorMessage(error.response.data)
        }

        setError(errorMessage)
      }
    }
  }

  // Buscar técnicos por rol
  const handleBuscarTecnicos = async () => {
    if (!filters.tipoRol) {
      setError("Debe seleccionar un rol para buscar técnicos")
      return
    }

    try {
      setSearchLoading(true)
      setError("")
      const token = localStorage.getItem("token")

      // Endpoint para buscar usuarios por grupo
      const response = await axios.get(`${API_URL}/admin/groups/${filters.tipoRol}/users`, {
        headers: { Authorization: `Token ${token}` },
      })

      if (response.data.length === 0) {
        setError("No se encontraron técnicos disponibles para este rol")
      } else {
        setUsers(response.data)
        setTecnicosFiltrados(response.data)
        showAlert("success", `Se encontraron ${response.data.length} técnicos disponibles`)
      }

      setSearchLoading(false)
    } catch (error) {
      console.error("Error al buscar técnicos:", error)
      setSearchLoading(false)

      if (!error.response) {
        setShowErrorModal(true)
        setErrorMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
      } else {
        let errorMessage = "Error al buscar técnicos disponibles"

        if (error.response?.data) {
          errorMessage = extractErrorMessage(error.response.data)
        }

        setError(errorMessage)
      }
    }
  }

  // Función para manejar la selección de un técnico
  const handleSelectTecnico = (tecnicoId) => {
    setFilters({
      ...filters,
      userId: tecnicoId,
    })
    setIsOpen(false)
  }

  // Función para limpiar la selección de técnico
  const handleClearTecnico = (e) => {
    e.stopPropagation()
    setFilters({
      ...filters,
      userId: "",
    })
  }

  // Cargar los detalles del informe al abrir el modal
  useEffect(() => {
    const fetchReasignInforme = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/communication/maintenance-reports/${informeId}`, {
          headers: { Authorization: `Token ${token}` },
        })
        setReasignInforme(response.data)
      } catch (error) {
        console.error("Error al obtener los detalles del informe:", error)
        setErrorMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
        setShowErrorModal(true)
      }
    }

    if (showModal) {
      fetchReasignInforme()
      obtenerRoles()
    }
  }, [API_URL, informeId, showModal])

  // Modificar la función handleAssign para probar con un enfoque más simple y un ID fijo conocido
  const handleAssign = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      // Obtener los detalles del informe si aún no están cargados
      if (!reasignInforme) {
        const response = await axios.get(`${API_URL}/communication/maintenance-reports/${informeId}`, {
          headers: { Authorization: `Token ${token}` },
        })
        setReasignInforme(response.data)
      }

      // Obtener el ID de la asignación del informe
      const assignmentId =
        reasignInforme?.assignment ||
        (
          await axios.get(`${API_URL}/communication/maintenance-reports/${informeId}`, {
            headers: { Authorization: `Token ${token}` },
          })
        ).data.assignment

      if (!assignmentId) {
        throw new Error("No se pudo obtener el ID de la asignación")
      }

      // Imprimir información de depuración
      console.log("ID de asignación:", assignmentId)
      console.log("ID de usuario seleccionado:", filters.userId)

      // Crear el payload exactamente como se muestra en Postman
      const payload = { assigned_to: filters.userId }
      console.log("Enviando payload:", JSON.stringify(payload))

      // Usar fetch nativo en lugar de axios para ver si hay alguna diferencia
      const response = await fetch(`${API_URL}/communication/assignments/${assignmentId}/reassign`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.log("Error en la respuesta:", response.status, response.statusText)
        const errorText = await response.text()
        console.log("Texto de error:", errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("Respuesta de reasignación:", data)

      // Notificar éxito
      onSuccess()
    } catch (error) {
      console.error("Error al reasignar el informe:", error)

      let errorMsg = "Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico."

      // Intentar extraer mensaje de error
      if (error.message) {
        errorMsg = error.message
      }

      setErrorMessage(errorMsg)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  // Obtener el técnico seleccionado
  const selectedTecnico = users.find((t) => t.document?.toString() === filters.userId)

  // Componente de alerta interna
  const AlertMessage = ({ type, message }) => {
    const alertStyles = {
      error: "bg-red-50 border-red-200 text-red-700",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
      success: "bg-green-50 border-green-200 text-green-700",
      info: "bg-blue-50 border-blue-200 text-blue-700",
    }

    const iconMap = {
      error: <AlertCircle className="h-5 w-5 mr-2 text-red-500" />,
      warning: <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />,
      success: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      info: <Info className="h-5 w-5 mr-2 text-blue-500" />,
    }

    return (
      <div className={`flex items-center p-3 border rounded-md my-3 ${alertStyles[type]}`}>
        {iconMap[type]}
        <span>{message}</span>
        <button
          onClick={() => setAlert({ show: false, type: "", message: "" })}
          className="ml-auto text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[#365486] mb-4">Reasignar Informe</h2>

          {/* Mostrar alertas internas */}
          {alert.show && <AlertMessage type={alert.type} message={alert.message} />}

          {/* Filtros de búsqueda */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {/* Selección de rol */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selección del tipo de rol <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  name="tipoRol"
                  value={filters.tipoRol}
                  onChange={(e) => handleFilterChange("tipoRol", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]"
                >
                  <option value="">Seleccione un rol</option>
                  {rolesDisponibles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBuscarTecnicos}
                  disabled={!filters.tipoRol || searchLoading}
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
                    "Buscar Técnicos"
                  )}
                </button>
              </div>
              {!filters.tipoRol && (
                <p className="mt-1 text-xs text-gray-500">
                  <Info className="inline h-3 w-3 mr-1" />
                  Debe seleccionar un rol antes de buscar técnicos
                </p>
              )}
            </div>

            {/* Selección de técnico con buscador integrado */}
            {users.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Técnico <span className="text-red-500">*</span>
                </label>

                {/* Componente SearchableSelect implementado */}
                <div className="relative w-full" ref={dropdownRef}>
                  <div
                    className="flex items-center justify-between w-full border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <div className="flex-grow truncate">
                      {filters.userId
                        ? `${selectedTecnico?.document} - ${selectedTecnico?.first_name || "Sin nombre"} - ${selectedTecnico?.email || "Sin email"}`
                        : "Seleccione un técnico"}
                    </div>
                    <div className="flex items-center">
                      {filters.userId && (
                        <button
                          type="button"
                          onClick={handleClearTecnico}
                          className="mr-1 text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                        <div className="relative">
                          <input
                            type="text"
                            value={filters.termBusqueda}
                            onChange={(e) => handleFilterChange("termBusqueda", e.target.value)}
                            placeholder="Buscar por ID, nombre o email..."
                            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#365486]"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      {tecnicosFiltrados.length === 0 ? (
                        <div className="p-3 text-gray-500 text-center">
                          No se encontraron técnicos con ese criterio de búsqueda
                        </div>
                      ) : (
                        <ul>
                          {tecnicosFiltrados.map((tecnico) => (
                            <li
                              key={tecnico.document}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${tecnico.document?.toString() === filters.userId ? "bg-blue-50 text-blue-700" : ""}`}
                              onClick={() => handleSelectTecnico(tecnico.document?.toString())}
                            >
                              <div className="flex items-center">
                                <span className="font-medium">{tecnico.document}</span>
                                <span className="mx-1">-</span>
                                <span>{tecnico.first_name || "Sin nombre"}</span>
                                <span className="mx-1">-</span>
                                <span className="text-gray-500 text-sm">{tecnico.email || "Sin email"}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
                        Mostrando {tecnicosFiltrados.length} de {users.length} técnicos
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Mensaje de error */}
            {error && <div className="mt-3 text-red-500 text-sm">{error}</div>}
          </div>

          {/* Información del técnico seleccionado */}
          {filters.userId && selectedTecnico && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h3 className="text-md font-semibold mb-3 text-blue-800">Información del Técnico Seleccionado</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Documento:</span>
                  <span className="text-gray-800 font-medium">{selectedTecnico.document}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Nombre:</span>
                  <span className="text-gray-800">{selectedTecnico.first_name || "No disponible"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <span className="text-gray-800">{selectedTecnico.email || "No disponible"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={() => handleAssign()}
              disabled={!filters.userId || loading}
              className="px-4 py-2 bg-[#365486] text-white rounded-md hover:bg-[#2A4374] focus:outline-none focus:ring-2 focus:ring-[#365486] disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                "Reasignar"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de error */}
      <Modal showModal={showErrorModal} onClose={() => setShowErrorModal(false)} title="Error" btnMessage="Aceptar">
        <p>{errorMessage}</p>
      </Modal>
    </div>
  )
}

export default GestionarInforme
