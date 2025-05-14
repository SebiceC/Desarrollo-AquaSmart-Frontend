"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import axios from "axios"
import BackButton from "../../../components/BackButton"

const CrearInforme = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [asignacion, setAsignacion] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para el formulario
  const [formData, setFormData] = useState({
    interventionDate: "",
    status: "",
    description: "",
  })

  // Estado para las imágenes
  const [images, setImages] = useState([])
  const [imagePreview, setImagePreview] = useState([])

  // Estado para los errores de validación
  const [errors, setErrors] = useState({
    interventionDate: "",
    status: "",
    images: "",
    description: "",
  })

  const API_URL = import.meta.env.VITE_APP_API_URL

  useEffect(() => {
    const fetchAsignacion = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setModalTitle("Error")
          setModalMessage("No hay una sesión activa. Por favor, inicie sesión.")
          setShowModal(true)
          setLoading(false)
          return
        }

        // Obtener los detalles de la asignación usando el endpoint correcto
        const response = await axios.get(`${API_URL}/communication/technician/assignments/${id}`, {
          headers: { Authorization: `Token ${token}` },
        })

        console.log("Detalles de la asignación:", response.data)

        // Verificar si necesitamos obtener detalles adicionales
        const assignmentData = response.data

        // Si hay una solicitud de caudal, obtener sus detalles completos
        if (assignmentData.flow_request && typeof assignmentData.flow_request !== "object") {
          try {
            const flowResponse = await axios.get(
              `${API_URL}/communication/assignments/flow-request/${assignmentData.flow_request}`,
              { headers: { Authorization: `Token ${token}` } },
            )
            assignmentData.flow_request = flowResponse.data
            console.log("Detalles de solicitud de caudal:", flowResponse.data)
          } catch (error) {
            console.error("Error al obtener detalles de la solicitud de caudal:", error)
          }
        }

        // Si hay un reporte de fallo, obtener sus detalles completos
        if (assignmentData.failure_report && typeof assignmentData.failure_report !== "object") {
          try {
            const failureResponse = await axios.get(
              `${API_URL}/communication/assignments/failure-report/${assignmentData.failure_report}`,
              { headers: { Authorization: `Token ${token}` } },
            )
            assignmentData.failure_report = failureResponse.data
            console.log("Detalles de reporte de fallo:", failureResponse.data)
          } catch (error) {
            console.error("Error al obtener detalles del reporte de fallo:", error)
          }
        }

        setAsignacion(assignmentData)
        setLoading(false)
      } catch (error) {
        console.error("Error al obtener los detalles de la asignación:", error)
        setModalTitle("Error")
        setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
        setShowModal(true)
        setLoading(false)
      }
    }

    fetchAsignacion()
  }, [API_URL, id])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Limpiar error al cambiar el valor
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  // Mejorar la validación de imágenes para cumplir con RF70-HU21
  // Modificar la función handleImageChange para validar mejor el formato, tamaño y cantidad
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)

    // Validar número máximo de imágenes (5)
    if (files.length > 5) {
      setErrors({
        ...errors,
        images: "Solo puede subir un máximo de 5 imágenes.",
      })
      return
    }

    // Validar tamaño de cada imagen (máximo 2MB)
    const oversizedFiles = files.filter((file) => file.size > 2 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setErrors({
        ...errors,
        images: `Cada imagen debe tener un tamaño máximo de 2MB. ${oversizedFiles.length} ${oversizedFiles.length === 1 ? "imagen excede" : "imágenes exceden"} el límite.`,
      })
      return
    }

    // Validar formato de las imágenes (solo JPEG/PNG)
    const invalidFormatFiles = files.filter((file) => !["image/jpeg", "image/png"].includes(file.type))
    if (invalidFormatFiles.length > 0) {
      setErrors({
        ...errors,
        images: `Solo se permiten imágenes en formato JPEG o PNG. ${invalidFormatFiles.length} ${invalidFormatFiles.length === 1 ? "archivo tiene" : "archivos tienen"} formato no válido.`,
      })
      return
    }

    // Limpiar error de imágenes
    setErrors({
      ...errors,
      images: "",
    })

    // Guardar las imágenes
    setImages(files)

    // Crear previsualizaciones
    const previews = files.map((file) => URL.createObjectURL(file))
    setImagePreview(previews)
  }

  // Mejorar la validación del formulario para cumplir con RF70-HU20
  // Modificar la función validateForm para validar mejor todos los campos obligatorios
  const validateForm = () => {
    const newErrors = {
      interventionDate: "",
      status: "",
      images: "",
      description: "",
    }

    let isValid = true

    // Validar fecha de intervención
    if (!formData.interventionDate) {
      newErrors.interventionDate = "La fecha de intervención es obligatoria."
      isValid = false
    } else {
      const interventionDate = new Date(formData.interventionDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (interventionDate > today) {
        newErrors.interventionDate = "La fecha de intervención no puede ser futura."
        isValid = false
      }
    }

    // Validar estado
    if (!formData.status) {
      newErrors.status = "Debe seleccionar el estado de la intervención."
      isValid = false
    }

    // Validar que haya al menos imágenes o descripción (según el backend)
    if (images.length === 0) {
      newErrors.images = "Debe subir al menos una imagen para documentar la intervención."
      isValid = false
    }

    // Validar descripción
    if (!formData.description || formData.description.trim() === "") {
      newErrors.description = "Debe proporcionar una descripción detallada de la intervención."
      isValid = false
    } else if (formData.description.length > 1000) {
      newErrors.description = "La descripción no puede exceder los 1000 caracteres."
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Modificar la función handleSubmit para implementar el cambio de estado a "A espera de aprobación"
  // y mejorar las alertas de éxito y error (RF70-HU22 y RF70-HU23)
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar formulario
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      // Preparar los datos para el backend según el modelo MaintenanceReport
      const maintenanceReportData = {
        assignment: id,
        intervention_date: new Date(formData.interventionDate).toISOString(),
        status: formData.status,
        description: formData.description || null,
        images: null, // Inicialmente vacío, se llenará con las imágenes codificadas
        assignment_status: "A espera de aprobación", // Cambiar el estado de la asignación
      }

      // Convertir imágenes a base64 y agregarlas al objeto
      if (images.length > 0) {
        const imagePromises = images.map((image) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve(reader.result)
            }
            reader.readAsDataURL(image)
          })
        })

        const imageResults = await Promise.all(imagePromises)
        maintenanceReportData.images = imageResults.join(",")
      }

      console.log("Enviando datos del informe:", maintenanceReportData)

      // Enviar el informe usando el endpoint correcto
      const response = await axios.post(`${API_URL}/communication/maintenance-reports/create`, maintenanceReportData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Respuesta del servidor:", response.data)

      // Mostrar mensaje de éxito según RF70-HU23
      setModalTitle("Éxito")
      setModalMessage("¡Envío del formulario realizado con éxito!")
      setShowModal(true)

      // Redirigir al listado de asignaciones después de cerrar el modal
      setTimeout(() => {
        navigate("/reportes-y-novedades/informe-mantenimiento")
      }, 2000)
    } catch (error) {
      console.error("Error al enviar el informe:", error)

      // Mostrar mensaje de error específico según RF70-HU22
      let errorMessage = "Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico."

      if (error.response) {
        // Verificar si es el error específico de informe ya existente
        if (error.response.status === 400 && error.response.data?.error?.message) {
          const errorMsg = error.response.data.error.message

          // Verificar si contiene el mensaje específico sobre informe existente
          if (errorMsg.includes("Ya existe un informe de mantenimiento para esta asignación")) {
            errorMessage =
              "Ya existe un informe de mantenimiento para esta asignación. No se puede crear otro informe para la misma asignación."
          } else if (error.response.data.error.type === "ValidationError") {
            // Otros errores de validación
            errorMessage = errorMsg
          }
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data) {
          // Formatear errores de validación del backend
          const backendErrors = error.response.data
          errorMessage = Object.keys(backendErrors)
            .map((key) => `${key}: ${backendErrors[key].join(", ")}`)
            .join("\n")
        }
      }

      setModalTitle("Error")
      setModalMessage(errorMessage)
      setShowModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mejorar la visualización de las observaciones para hacerlas más destacadas
  // Modificar la función renderReportInfo para mejorar la sección de observaciones
  const renderReportInfo = () => {
    if (!asignacion) return null

    // Extraer ID del predio y ID del lote del formato "1770511-001" para solicitudes de caudal
    let predioId = "No disponible"
    let loteId = "No disponible"
    let caudal = "No aplicable"

    if (asignacion.flow_request && typeof asignacion.flow_request === "object") {
      if (asignacion.flow_request.lot && typeof asignacion.flow_request.lot === "string") {
        const lotParts = asignacion.flow_request.lot.split("-")
        if (lotParts.length === 2) {
          predioId = lotParts[0]
          loteId = lotParts[1]
        } else {
          // Si no tiene el formato esperado, mostrar el valor completo como ID del lote
          loteId = asignacion.flow_request.lot
        }
      }

      if (asignacion.flow_request.requested_flow) {
        caudal = `${asignacion.flow_request.requested_flow} L/s`
      }
    }

    // Extraer ID del predio y ID del lote para reportes de fallo
    if (asignacion.failure_report && typeof asignacion.failure_report === "object") {
      if (asignacion.failure_report.lot && typeof asignacion.failure_report.lot === "string") {
        const lotParts = asignacion.failure_report.lot.split("-")
        if (lotParts.length === 2) {
          predioId = lotParts[0]
          loteId = lotParts[1]
        } else {
          // Si no tiene el formato esperado, mostrar el valor completo como ID del lote
          loteId = asignacion.failure_report.lot
        }
      }

      // Si hay un plot separado, usarlo como ID del predio
      if (asignacion.failure_report.plot) {
        predioId = asignacion.failure_report.plot
      }
    }

    // Obtener observaciones
    const observaciones =
      asignacion.flow_request?.observations || asignacion.failure_report?.observations || "Sin observaciones"

    return (
      <>
        {/* Fila 1: ID de la solicitud, Tipo de solicitud, Usuario que envía la solicitud */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500">ID de la solicitud</p>
            <p className="font-medium">
              {asignacion.flow_request?.id || asignacion.failure_report?.id || "No disponible"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tipo de solicitud</p>
            <p className="font-medium">
              {asignacion.flow_request?.flow_request_type || asignacion.failure_report?.failure_type || "No disponible"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Usuario que envía la solicitud</p>
            <p className="font-medium">
              {asignacion.flow_request?.created_by || asignacion.failure_report?.created_by || "No disponible"}
            </p>
          </div>
        </div>

        {/* Fila 2: Asignado A, Fecha de solicitud, Fecha de asignación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Asignado A</p>
            <p className="font-medium">{asignacion.assigned_to || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de solicitud</p>
            <p className="font-medium">
              {asignacion.flow_request?.created_at || asignacion.failure_report?.created_at
                ? new Date(
                    asignacion.flow_request?.created_at || asignacion.failure_report?.created_at,
                  ).toLocaleDateString()
                : "No disponible"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de asignación</p>
            <p className="font-medium">
              {asignacion.assignment_date ? new Date(asignacion.assignment_date).toLocaleDateString() : "No disponible"}
            </p>
          </div>
        </div>

        {/* Fila 3: ID del predio, ID del lote, Caudal solicitado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500">ID del predio</p>
            <p className="font-medium">{predioId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">ID del lote</p>
            <p className="font-medium">{loteId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Caudal solicitado</p>
            <p className="font-medium">{caudal}</p>
          </div>
        </div>

        {/* Observaciones (fila completa) - Mejorada visualmente */}
        <div className="mb-6">
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
              <p className="font-medium text-gray-700 break-words">{observaciones}</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center mt-15 text-xl font-semibold text-[#365486]">Informe de Mantenimiento</h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#365486]"></div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Información de la asignación */}
            <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">
              <h2 className="text-md font-medium text-[#365486] mb-4">Detalles de la Asignación</h2>
              {renderReportInfo()}
            </div>

            {/* Formulario de informe */}
            <form onSubmit={handleSubmit}>
              <h2 className="text-md font-medium text-[#365486] mb-4">Informe de Intervención</h2>

              {/* Fecha de intervención - Mejorada */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de intervención <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="interventionDate"
                    value={formData.interventionDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.interventionDate ? "border-red-500 bg-red-50" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486] transition-colors`}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {errors.interventionDate && (
                    <div className="mt-1 flex items-center">
                      <svg
                        className="w-4 h-4 text-red-500 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <p className="text-sm text-red-600">{errors.interventionDate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado de la intervención - Mejorada */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de la intervención <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.status ? "border-red-500 bg-red-50" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486] appearance-none transition-colors`}
                  >
                    <option value="">Seleccione un estado</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Requiere nueva intervención">Requiere nueva intervención</option>
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
                  {errors.status && (
                    <div className="mt-1 flex items-center">
                      <svg
                        className="w-4 h-4 text-red-500 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <p className="text-sm text-red-600">{errors.status}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fotografías */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fotografías de la intervención <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                      errors.images ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"
                    } hover:bg-gray-100 transition-colors`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className={`w-8 h-8 mb-4 ${errors.images ? "text-red-500" : "text-gray-500"}`}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte
                      </p>
                      <p className="text-xs text-gray-500">JPEG o PNG (Máx. 5 archivos, 2MB c/u)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg, image/png"
                      multiple
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                {errors.images && (
                  <div className="mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 text-red-500 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <p className="text-sm text-red-600">{errors.images}</p>
                  </div>
                )}

                {/* Previsualización de imágenes - Mejorada */}
                {imagePreview.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Vista previa ({imagePreview.length} {imagePreview.length === 1 ? "imagen" : "imágenes"})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreview.map((src, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={src || "/placeholder.svg"}
                            alt={`Vista previa ${index + 1}`}
                            className="h-24 w-full object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newImages = [...images]
                              newImages.splice(index, 1)
                              setImages(newImages)

                              const newPreviews = [...imagePreview]
                              URL.revokeObjectURL(newPreviews[index])
                              newPreviews.splice(index, 1)
                              setImagePreview(newPreviews)
                            }}
                            title="Eliminar imagen"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción detallada de la intervención <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  maxLength={1000}
                  className={`w-full px-3 py-2 border ${
                    errors.description ? "border-red-500 bg-red-50" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486] transition-colors`}
                  placeholder="Describa detalladamente la intervención realizada..."
                ></textarea>
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-red-500 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <p className="text-sm text-red-600">{errors.description}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Máximo 1000 caracteres</p>
                  )}
                  <p
                    className={`text-xs ${formData.description.length >= 900 ? "text-orange-500 font-medium" : "text-gray-500"}`}
                  >
                    {formData.description.length}/1000
                  </p>
                </div>
              </div>

              {/* Botones - Mejorados */}
              <div className="flex justify-between mt-8">
                <BackButton to="/reportes-y-novedades/informe-mantenimiento" text="Volver" />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 ${
                    isSubmitting ? "bg-gray-400" : "bg-[#365486] hover:bg-[#2A4374] hover:scale-105"
                  } text-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#365486] disabled:bg-gray-400 transition-all flex items-center`}
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
                      Enviando...
                    </>
                  ) : (
                    <>Enviar Informe</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal para mensajes */}
        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false)
              if (modalTitle === "Éxito") {
                navigate("/reportes-y-novedades/informe-mantenimiento")
              }
            }}
            title={modalTitle}
            btnMessage="Aceptar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}
      </div>
    </div>
  )
}

export default CrearInforme
