"use client"

import { useState, useEffect, useRef, useContext } from "react"
import axios from "axios"
import Modal from "./Modal"
import { Search, X, AlertCircle, Info, ChevronDown } from "lucide-react"
import { PermissionsContext } from "../app/context/PermissionsContext"

/**
 * Componente base para modales de asignación de técnicos a solicitudes/reportes
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.showModal - Controla la visibilidad del modal
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.solicitudBasica - Datos básicos de la solicitud/reporte
 * @param {Function} props.onSuccess - Función a ejecutar en caso de éxito
 * @param {Function} props.onError - Función a ejecutar en caso de error
 * @param {string} props.titulo - Título del modal
 * @param {string} props.tipoAsignacion - Tipo de asignación ('flow_request' o 'failure_report')
 * @param {Function} props.renderDetallesSolicitud - Función para renderizar detalles específicos de la solicitud
 * @param {Function} props.getEndpointDetalle - Función para obtener el endpoint para detalles
 * @param {Object} props.dataAsignacion - Datos específicos para crear la asignación
 * @param {string} props.mensajeExito - Mensaje de éxito personalizado
 */
const BaseAsignacionModal = ({
  showModal,
  onClose,
  solicitudBasica,
  onSuccess,
  onError,
  titulo = "Asignación de Solicitud",
  tipoAsignacion = "flow_request",
  renderDetallesSolicitud,
  getEndpointDetalle,
  dataAsignacion,
  mensajeExito = "Solicitud asignada correctamente",
}) => {
  const { hasPermission } = useContext(PermissionsContext)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tecnicoId: "",
    tipoRol: "",
    termBusqueda: "",
  })

  // Estado para almacenar técnicos disponibles
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState([])
  // Estado para almacenar técnicos filtrados por búsqueda
  const [tecnicosFiltrados, setTecnicosFiltrados] = useState([])
  // Estado para almacenar roles disponibles
  const [rolesDisponibles, setRolesDisponibles] = useState([])
  // Estado para almacenar detalles de la solicitud
  const [detalleSolicitud, setDetalleSolicitud] = useState(null)
  // Estado para controlar el dropdown del select
  const [isOpen, setIsOpen] = useState(false)
  // Estado para manejar alertas internas
  const [alert, setAlert] = useState({ show: false, type: "", message: "" })
  // Estado para modal de error de conexión
  const [showConnectionErrorModal, setShowConnectionErrorModal] = useState(false)
  // Añadir un nuevo estado para el modal de error de auto-asignación
  const [showSelfAssignmentErrorModal, setShowSelfAssignmentErrorModal] = useState(false)

  // Referencia para cerrar el dropdown al hacer clic fuera
  const dropdownRef = useRef(null)

  // Función para extraer el mensaje de error del formato anidado
  const extractErrorMessage = (errorObj) => {
    try {
      // Nuevo formato de error
      if (errorObj && errorObj.status === "error" && errorObj.errors) {
        // Si hay non_field_errors como string
        if (typeof errorObj.errors.non_field_errors === "string") {
          return errorObj.errors.non_field_errors
        }

        // Si hay non_field_errors como array
        if (Array.isArray(errorObj.errors.non_field_errors) && errorObj.errors.non_field_errors.length > 0) {
          return errorObj.errors.non_field_errors[0]
        }

        // Si hay otros campos de error
        const errorFields = Object.keys(errorObj.errors)
        if (errorFields.length > 0) {
          const firstField = errorFields[0]
          const fieldError = errorObj.errors[firstField]

          if (typeof fieldError === "string") {
            return `${firstField}: ${fieldError}`
          }

          if (Array.isArray(fieldError) && fieldError.length > 0) {
            return `${firstField}: ${fieldError[0]}`
          }
        }

        return "Error en la solicitud"
      }

      // Caso especial para el error específico que estás encontrando
      if (typeof errorObj === "string" && errorObj.includes("Solo se puede asignar a usuarios del grupo")) {
        return "Solo se puede asignar a usuarios del grupo 'Técnico' o 'Operador'."
      }

      // Si tenemos un string, intentar extraer el mensaje usando un patrón muy permisivo
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

  // Efecto para filtrar técnicos cuando cambia el término de búsqueda
  useEffect(() => {
    if (tecnicosDisponibles.length > 0) {
      if (!formData.termBusqueda) {
        setTecnicosFiltrados(tecnicosDisponibles)
      } else {
        const filtered = tecnicosDisponibles.filter(
          (tecnico) =>
            tecnico.document.toString().includes(formData.termBusqueda) ||
            (tecnico.first_name && tecnico.first_name.toLowerCase().includes(formData.termBusqueda.toLowerCase())) ||
            (tecnico.email && tecnico.email.toLowerCase().includes(formData.termBusqueda.toLowerCase())),
        )
        setTecnicosFiltrados(filtered)
      }
    }
  }, [formData.termBusqueda, tecnicosDisponibles])

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !event.target.closest(".fixed.z-50")) {
        // No cerrar si el clic es dentro del dropdown
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Añadir este useEffect después del useEffect existente para handleClickOutside
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isOpen])

  const API_URL = import.meta.env.VITE_APP_API_URL

  useEffect(() => {
    if (showModal && solicitudBasica) {
      // Resetear el formulario y alertas cuando se abre el modal
      setFormData({
        tecnicoId: "",
        tipoRol: "",
        termBusqueda: "",
      })
      setAlert({ show: false, type: "", message: "" })

      // Cargar datos adicionales específicos de la solicitud
      fetchDetalleSolicitud()
    }
  }, [showModal, solicitudBasica])

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

  const fetchDetalleSolicitud = async () => {
    if (!solicitudBasica || !solicitudBasica.id) return

    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      // Obtener el endpoint dinámicamente
      const endpoint = getEndpointDetalle
        ? getEndpointDetalle(solicitudBasica, API_URL)
        : `${API_URL}/communication/admin/requests-and-reports/${solicitudBasica.id}`

      const response = await axios.get(endpoint, { headers: { Authorization: `Token ${token}` } })

      setDetalleSolicitud(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error al obtener detalles de la solicitud:", error)
      setLoading(false)

      if (!error.response) {
        setShowConnectionErrorModal(true)
      } else {
        let errorMessage = "Error al cargar los detalles de la solicitud"

        if (error.response?.data) {
          errorMessage = extractErrorMessage(error.response.data)
        }

        showAlert("error", errorMessage)
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Función para manejar la selección de un técnico
  const handleSelectTecnico = (tecnicoId) => {
    setFormData({
      ...formData,
      tecnicoId,
    })
    setIsOpen(false)
  }

  // Función para limpiar la selección de técnico
  const handleClearTecnico = (e) => {
    e.stopPropagation()
    setFormData({
      ...formData,
      tecnicoId: "",
    })
  }

  const handleBuscarTecnicos = async () => {
    if (!formData.tipoRol) {
      showAlert("error", "Debe seleccionar un rol para buscar técnicos")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      // Endpoint para buscar usuarios por grupo
      const response = await axios.get(`${API_URL}/admin/groups/${formData.tipoRol}/users`, {
        headers: { Authorization: `Token ${token}` },
      })

      if (response.data.length === 0) {
        showAlert("warning", "No se encontraron técnicos disponibles para este rol")
      } else {
        // Filtrar técnicos que tienen el permiso "can_be_assigned"
        const tecnicosConPermiso = []

        // Para cada técnico, verificar si tiene el permiso requerido
        for (const tecnico of response.data) {
          try {
            // Obtener los permisos del técnico
            const permisosResponse = await axios.get(`${API_URL}/admin/users/${tecnico.document}/permissions`, {
              headers: { Authorization: `Token ${token}` },
            })

            const permisosUsuario = permisosResponse.data.Permisos_Usuario || []
            const permisosRol = Object.values(permisosResponse.data.Permisos_Rol || {}).flat()
            const permisosCombinados = [...permisosUsuario, ...permisosRol]

            // Verificar si el técnico tiene el permiso "can_be_assigned"
            const tienePermiso = permisosCombinados.some((p) => p.codename === "can_be_assigned")

            if (tienePermiso) {
              tecnicosConPermiso.push(tecnico)
            }
          } catch (error) {
            console.error(`Error al verificar permisos para el técnico ${tecnico.document}:`, error)
          }
        }

        setTecnicosDisponibles(tecnicosConPermiso)
        setTecnicosFiltrados(tecnicosConPermiso)

        if (tecnicosConPermiso.length === 0) {
          showAlert("warning", "No se encontraron técnicos con permiso para ser asignados")
        } else {
          showAlert(
            "success",
            `Se encontraron ${tecnicosConPermiso.length} técnicos disponibles con permiso para ser asignados`,
          )
        }
      }

      setLoading(false)
    } catch (error) {
      console.error("Error al buscar técnicos:", error)
      setLoading(false)

      if (!error.response) {
        setShowConnectionErrorModal(true)
      } else {
        let errorMessage = "Error al buscar técnicos disponibles"

        if (error.response?.data) {
          errorMessage = extractErrorMessage(error.response.data)
        }

        showAlert("error", errorMessage)
      }
    }
  }

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
        setShowConnectionErrorModal(true)
      } else {
        let errorMessage = "Error al cargar los roles disponibles"

        if (error.response?.data) {
          errorMessage = extractErrorMessage(error.response.data)
        }

        showAlert("error", errorMessage)
      }
    }
  }

  useEffect(() => {
    if (showModal) {
      obtenerRoles()
    }
  }, [showModal])

  // Modificar la función handleSubmit para manejar el error específico de auto-asignación
  const handleSubmit = async () => {
    if (!solicitudBasica || !solicitudBasica.id) {
      showAlert("error", "Información de solicitud no disponible")
      return
    }

    if (!formData.tecnicoId) {
      showAlert("error", "Debe seleccionar un técnico para la asignación")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      // Preparar datos para la asignación
      // Si dataAsignacion es una función, ejecutarla para obtener los datos específicos
      const asignacionData =
        typeof dataAsignacion === "function"
          ? dataAsignacion(solicitudBasica.id, formData.tecnicoId)
          : {
              [tipoAsignacion]: solicitudBasica.id,
              assigned_to: formData.tecnicoId,
            }

      // Crear una nueva asignación para la solicitud
      const response = await axios.post(`${API_URL}/communication/assignments/create`, asignacionData, {
        headers: { Authorization: `Token ${token}` },
      })

      setLoading(false)
      onSuccess(mensajeExito)
      onClose()
    } catch (error) {
      console.error("Error al asignar la solicitud:", error)
      setLoading(false)

      // Verificar si es un error de conexión
      if (!error.response) {
        setShowConnectionErrorModal(true)
      } else {
        // Verificar si es el error específico de auto-asignación
        const errorData = error.response?.data
        if (
          errorData?.status === "error" &&
          errorData?.errors?.non_field_errors === "Un usuario no puede asignarse a sí mismo una solicitud o reporte."
        ) {
          // Mostrar el modal específico para este error
          setShowSelfAssignmentErrorModal(true)
        } else {
          // Extraer y mostrar el mensaje de error genérico
          let errorMessage = "Error al asignar la solicitud al técnico"

          if (error.response?.data) {
            errorMessage = extractErrorMessage(error.response.data)
          } else if (error.responseText) {
            errorMessage = extractErrorMessage(error.responseText)
          }

          showAlert("error", errorMessage)
        }
      }
    }
  }
  // Obtener el técnico seleccionado
  const selectedTecnico = tecnicosDisponibles.find((t) => t.document.toString() === formData.tecnicoId.toString())

  // Si no hay datos básicos de la solicitud, no mostrar nada
  if (!solicitudBasica) return null

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

  // Añadir el modal de error de auto-asignación al final del componente, justo antes del cierre del return
  return (
    <>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] sm:w-[700px] md:w-[800px] lg:w-[900px] z-50 max-h-[90vh] flex flex-col">
            {/* Encabezado del modal */}
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-[#365486]">{titulo}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Contenido del modal con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Mostrar alertas internas */}
              {alert.show && <AlertMessage type={alert.type} message={alert.message} />}

              {/* Sección de información de la solicitud - Contenido personalizable */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {renderDetallesSolicitud ? (
                  renderDetallesSolicitud(solicitudBasica, detalleSolicitud)
                ) : (
                  <>
                    <h3 className="text-lg font-semibold mb-3 text-blue-800 border-b border-gray-200 pb-2">
                      Información de la Solicitud
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-600 w-32">ID:</span>
                          <span className="text-gray-800">{solicitudBasica.id}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-600 w-16">Usuario:</span>
                          <span className="text-gray-800">{solicitudBasica.created_by || "No especificado"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-600 w-32">Fecha de envío:</span>
                          <span className="text-gray-800">{solicitudBasica.created_at || "No especificada"}</span>
                        </div>
                      </div>
                    </div>

                    {detalleSolicitud && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-600 mb-1">Observaciones:</h4>
                        <div className="p-3 bg-white rounded-md border border-gray-200 max-h-32 overflow-y-auto">
                          {detalleSolicitud.observations || "No hay observaciones disponibles"}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sección de selección de rol y técnicos */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-3 text-blue-800 border-b border-gray-200 pb-2">
                  Asignación de Técnico
                </h3>

                {/* Selección de rol */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selección del tipo de rol <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="tipoRol"
                      value={formData.tipoRol}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un rol</option>
                      {rolesDisponibles.map((rol) => (
                        <option key={rol.id} value={rol.id}>
                          {rol.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleBuscarTecnicos}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                      disabled={!formData.tipoRol || loading}
                    >
                      {loading ? "Buscando..." : "Buscar Técnicos"}
                    </button>
                  </div>
                  {!formData.tipoRol && (
                    <p className="mt-1 text-xs text-gray-500">
                      <Info className="inline h-3 w-3 mr-1" />
                      Debe seleccionar un rol antes de buscar técnicos
                    </p>
                  )}
                </div>

                {/* Selección de técnico con buscador integrado */}
                {tecnicosDisponibles.length > 0 && (
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
                          {formData.tecnicoId
                            ? `${selectedTecnico?.document} - ${selectedTecnico?.first_name || "Sin nombre"} - ${selectedTecnico?.email || "Sin email"}`
                            : "Seleccione un técnico"}
                        </div>
                        <div className="flex items-center">
                          {formData.tecnicoId && (
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
                        <div
                          className="fixed z-50 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden"
                          style={{
                            width: dropdownRef.current ? dropdownRef.current.offsetWidth : "auto",
                            maxHeight: "300px",
                            top: dropdownRef.current
                              ? Math.min(
                                  dropdownRef.current.getBoundingClientRect().bottom + 5,
                                  window.innerHeight - 305,
                                )
                              : 0,
                            left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0,
                          }}
                        >
                          <div className="sticky top-0 bg-white p-2 border-b border-gray-200 z-10">
                            <div className="relative">
                              <input
                                type="text"
                                value={formData.termBusqueda}
                                onChange={(e) => setFormData({ ...formData, termBusqueda: e.target.value })}
                                placeholder="Buscar por ID, nombre o email..."
                                className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                maxLength={50}
                              />
                              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                          </div>

                          <div className="overflow-y-auto" style={{ maxHeight: "240px" }}>
                            {tecnicosFiltrados.length === 0 ? (
                              <div className="p-3 text-gray-500 text-center">
                                No se encontraron técnicos con ese criterio de búsqueda
                              </div>
                            ) : (
                              <ul>
                                {tecnicosFiltrados.map((tecnico) => (
                                  <li
                                    key={tecnico.document}
                                    className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${tecnico.document.toString() === formData.tecnicoId ? "bg-blue-50 text-blue-700" : ""}`}
                                    onClick={() => handleSelectTecnico(tecnico.document.toString())}
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
                          </div>
                          <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
                            Mostrando {tecnicosFiltrados.length} de {tecnicosDisponibles.length} técnicos
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Información del técnico seleccionado */}
              {formData.tecnicoId && selectedTecnico && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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

              {/* Mensaje de aviso cuando no hay técnicos disponibles */}
              {!tecnicosDisponibles.length && formData.tipoRol && !alert.show && (
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                  <span>
                    Seleccione un rol y haga clic en "Buscar Técnicos" para cargar la lista de técnicos disponibles.
                  </span>
                </div>
              )}
            </div>

            {/* Pie del modal con botones */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#365486] text-white px-4 py-2 rounded-md hover:bg-[#2c3e6f] focus:outline-none disabled:opacity-70"
              >
                {loading ? "Procesando..." : "Asignar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de error de conexión */}
      <Modal
        showModal={showConnectionErrorModal}
        onClose={() => setShowConnectionErrorModal(false)}
        title="ERROR"
        btnMessage="Entendido"
      >
        <p>Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.</p>
      </Modal>

      {/* Modal de error de auto-asignación */}
      <Modal
        showModal={showSelfAssignmentErrorModal}
        onClose={() => setShowSelfAssignmentErrorModal(false)}
        title="Error de Asignación"
        btnMessage="Entendido"
      >
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No es posible realizar esta asignación</h3>
          <p>Un usuario no puede asignarse a sí mismo una solicitud o reporte.</p>
          <p className="mt-2 text-sm text-gray-600">Por favor, seleccione otro técnico para realizar la asignación.</p>
        </div>
      </Modal>
    </>
  )
}

export default BaseAsignacionModal