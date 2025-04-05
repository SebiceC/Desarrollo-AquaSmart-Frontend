"use client"

import { useState, useEffect } from "react"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import Button from "../../../components/Button"
import InputItem from "../../../components/InputItem"
import BackButton from "../../../components/BackButton"
import ErrorDisplay from "../../../components/error-display"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { ChevronDown } from "lucide-react"

const ActualizacionPredios = () => {
  const { id_plot } = useParams()
  const navigate = useNavigate()

  // Estados para el formulario
  const [formData, setFormData] = useState({
    predio: "",
    dueno: "",
    fechaRegistro: "",
    extension: "",
    latitud: "",
    longitud: "",
    plot_name: "",
    is_activate: ""
  })
  const [originalData, setOriginalData] = useState({})

  // Estados para carga y envío
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState(null)

  // Estados para errores
  const [validationErrors, setValidationErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState("")
  const [geoRefError, setGeoRefError] = useState("")
  const [userError, setUserError] = useState("")

  // Estados para modales
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFormErrorModal, setShowFormErrorModal] = useState(false)
  const [showNoChangeErrorModal, setShowNoChangeErrorModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Cargar datos del predio
  useEffect(() => {
    const fetchPredioData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          setLoadError("No hay sesión activa. Por favor, inicie sesión nuevamente.")
          setLoading(false)
          setTimeout(() => navigate("/login"), 2000)
          return
        }

        const API_URL = import.meta.env.VITE_APP_API_URL

        const response = await axios.get(`${API_URL}/plot-lot/plots/${id_plot}`, {
          headers: { Authorization: `Token ${token}` },
        })

        const predioData = response.data
        const fechaRegistro = new Date(predioData.registration_date).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })

        const formattedData = {
          predio: predioData.id_plot,
          dueno: predioData.owner,
          fechaRegistro: fechaRegistro,
          extension: predioData.plot_extension.toString(),
          latitud: predioData.latitud,
          longitud: predioData.longitud,
          plot_name: predioData.plot_name || "",
          is_activate: predioData.is_activate === true || predioData.is_activate === "true", // Asegurarse que is_activate es un booleano
        }

        setFormData(formattedData)
        setOriginalData(formattedData)
        setLoading(false)
      } catch (error) {
        console.error("Error al obtener los datos del predio", error)

        let errorMessage = "Error al cargar los datos del predio. Por favor, intente más tarde."

        if (error.response) {
          if (error.response.status === 403) {
            errorMessage = "No tiene permisos para acceder a este predio."
          } else if (error.response.status === 404) {
            errorMessage = "El predio solicitado no existe."
          } else if (error.response.data?.detail) {
            errorMessage = error.response.data.detail
          }
        } else if (error.request) {
          errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet."
        }

        setLoadError(errorMessage)
        setLoading(false)
      }
    }

    if (id_plot) {
      fetchPredioData()
    }
  }, [id_plot, navigate])

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target

    // Aplicar las mismas validaciones que en el registro de predios
    if (name === "latitud" || name === "longitud") {
      // Validar formato: hasta 3 dígitos enteros y 6 decimales
      if (/^-?\d{0,3}(\.\d{0,6})?$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }))
      }
    } else if (name === "extension") {
      // Validar formato: hasta 6 dígitos enteros y 2 decimales
      if (/^\d{0,6}(\.\d{0,2})?$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }))
      }
    } else if (name === "dueno") {
      // Validar ID del dueño: solo números y máximo 12 caracteres
      if (/^\d*$/.test(value) && value.length <= 12) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }))
      }
    } else if (name === "plot_name") {
      // Validar nombre del predio: solo letras y máximo 20 caracteres
      if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value) && value.length <= 20) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Limpiar mensajes de error
    setErrorMessage("")
    setGeoRefError("")
    setUserError("")

    // Limpiar errores de validación específicos
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validación de datos sin cambios
  const validateChanges = () => {
    const isUnchanged =
      formData.dueno === originalData.dueno &&
      formData.extension === originalData.extension &&
      formData.latitud === originalData.latitud &&
      formData.longitud === originalData.longitud &&
      formData.plot_name === originalData.plot_name &&
      formData.is_activate === originalData.is_activate  // Add this line

    if (isUnchanged) {
      setShowNoChangeErrorModal(true)
      return false
    }
    return true
  }

  // Validación completa del formulario
  const validateForm = () => {
    const errors = {}
    let isValid = true

    // Validar que todos los campos requeridos estén completos
    Object.entries(formData).forEach(([key, value]) => {
      // Excluir campos de solo lectura y el campo is_activate
      if (key !== "predio" && key !== "fechaRegistro" && key !== "is_activate") {
        if (typeof value === 'string' && !value.trim()) {
          errors[key] = "Este campo es obligatorio"
          isValid = false
        } else if (value === undefined || value === null) {
          errors[key] = "Este campo es obligatorio"
          isValid = false
        }
      }
    })

    // Validar is_activate por separado
    if (formData.is_activate === undefined || formData.is_activate === "") {
      errors.is_activate = "El estado del predio es obligatorio"
      isValid = false
    }

    // Validaciones específicas para cada campo
    if (formData.dueno) {
      if (!/^\d+$/.test(formData.dueno)) {
        errors.dueno = "El ID del dueño debe contener solo números"
        isValid = false
      } else if (formData.dueno.length < 6) {
        errors.dueno = "El ID del dueño debe tener al menos 6 caracteres"
        isValid = false
      } else if (formData.dueno.length > 12) {
        errors.dueno = "El ID del dueño no debe exceder los 12 caracteres"
        isValid = false
      }
    }

    if (formData.plot_name) {
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.plot_name)) {
        errors.plot_name = "El nombre del predio solo puede contener letras"
        isValid = false
      } else if (formData.plot_name.length > 20) {
        errors.plot_name = "El nombre del predio no debe exceder los 20 caracteres"
        isValid = false
      }
    }

    if (formData.extension && !/^\d{1,6}(\.\d{1,2})?$/.test(formData.extension)) {
      errors.extension = "La extensión debe ser un número con hasta 6 dígitos y 2 decimales"
      isValid = false
    }

    if (formData.latitud && !/^-?\d{1,3}(\.\d{1,6})?$/.test(formData.latitud)) {
      errors.latitud = "La latitud debe ser un número con hasta 3 dígitos y 6 decimales"
      isValid = false
    }

    if (formData.longitud && !/^-?\d{1,3}(\.\d{1,6})?$/.test(formData.longitud)) {
      errors.longitud = "La longitud debe ser un número con hasta 3 dígitos y 6 decimales"
      isValid = false
    }

    setValidationErrors(errors)

    if (!isValid) {
      setErrorMessage("Por favor, complete todos los campos obligatorios correctamente.")
    }

    return isValid
  }

  // Procesar errores del backend
  const processBackendErrors = (backendData) => {
    // Verificar si el error viene en el formato {error, detalles}
    if (backendData.detalles) {
      try {
        const detallesStr = backendData.detalles

        // Verificar errores específicos
        if (detallesStr.includes("usuario asignado no está registrado")) {
          setUserError("ERROR: El usuario asignado no está registrado")
          return true
        }

        if (detallesStr.includes("georeferenciación")) {
          setGeoRefError("ERROR: La georeferenciación ingresada ya está asignada a otro predio.")
          return true
        }

        // Extraer mensajes de error para cada campo
        const errors = {}
        const fieldPatterns = [
          { field: "dueno", pattern: /owner.*?string='(.*?)',/ },
          { field: "extension", pattern: /plot_extension.*?string='(.*?)',/ },
          { field: "latitud", pattern: /latitud.*?string='(.*?)',/ },
          { field: "longitud", pattern: /longitud.*?string='(.*?)',/ },
          { field: "plot_name", pattern: /plot_name.*?string='(.*?)',/ },
        ]

        for (const { field, pattern } of fieldPatterns) {
          if (
            detallesStr.includes(`'${field === "dueno" ? "owner" : field === "extension" ? "plot_extension" : field}':`)
          ) {
            const match = detallesStr.match(pattern)
            if (match && match[1]) {
              errors[field] = `ERROR: ${match[1]}`
            }
          }
        }

        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors)
          return true
        }

        // Error general
        setErrorMessage(`ERROR: ${backendData.error}`)
        return true
      } catch (parseError) {
        console.error("Error al parsear detalles:", parseError)
        return false
      }
    }

    return false
  }

  // Procesar errores en formato tradicional
  const processTraditionalErrors = (backendErrors) => {
    const errors = {}

    // Mapear errores específicos de campos
    const fieldMappings = [
      { backend: "owner", form: "dueno" },
      { backend: "plot_extension", form: "extension" },
      { backend: "latitud", form: "latitud" },
      { backend: "longitud", form: "longitud" },
      { backend: "plot_name", form: "plot_name" },
    ]

    for (const { backend, form } of fieldMappings) {
      if (backendErrors[backend]) {
        const errorMsg = Array.isArray(backendErrors[backend]) ? backendErrors[backend][0] : backendErrors[backend]
        errors[form] = `ERROR: ${errorMsg}`

        // Verificar si es error de usuario no registrado
        if (backend === "owner" && typeof errorMsg === "string" && errorMsg.includes("no está registrado")) {
          setUserError("ERROR: El usuario asignado no está registrado")
          return true
        }
      }
    }

    // Manejar error de georeferenciación duplicada
    if (
      backendErrors.duplicate_coordinates ||
      (backendErrors.non_field_errors &&
        backendErrors.non_field_errors.some((error) => error.includes("georeferenciación"))) ||
      backendErrors.detail === "La georeferenciación ya está asignada a otro predio."
    ) {
      setGeoRefError("ERROR: La georeferenciación ingresada ya está asignada a otro predio.")
      return true
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return true
    }

    // Errores generales
    if (backendErrors.non_field_errors) {
      setErrorMessage(`ERROR: ${backendErrors.non_field_errors[0]}`)
      return true
    }

    if (backendErrors.detail) {
      setErrorMessage(`ERROR: ${backendErrors.detail}`)
      return true
    }

    return false
  }

  // Manejar confirmación antes de enviar
  const handleConfirmSubmit = (e) => {
    e.preventDefault()

    // Evitar múltiples envíos
    if (submitting) return

    // Limpiar errores previos
    setValidationErrors({})
    setErrorMessage("")
    setGeoRefError("")
    setUserError("")

    // Validaciones
    if (!validateChanges() || !validateForm()) {
      return
    }

    // Llamar directamente a handleSubmit en lugar de mostrar el modal
    handleSubmit()
  }

  // Manejar envío del formulario
  const handleSubmit = async () => {
    // Evitar múltiples envíos
    if (submitting) return

    // Iniciar proceso de envío
    setSubmitting(true)
    // Eliminamos la línea: setShowConfirmModal(false)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMessage("ERROR: Sesión expirada. Por favor, inicie sesión nuevamente.")
        setTimeout(() => navigate("/login"), 2000)
        return
      }

      const API_URL = import.meta.env.VITE_APP_API_URL

      // Preparar los datos para enviar
      const updateData = {
        owner: formData.dueno,
        plot_extension: formData.extension ? Number.parseFloat(formData.extension) : null,
        latitud: formData.latitud ? Number.parseFloat(formData.latitud) : null,
        longitud: formData.longitud ? Number.parseFloat(formData.longitud) : null,
        plot_name: formData.plot_name,
        is_activate: formData.is_activate,  // Incluir el estado en la solicitud
      }

      // Enviar solicitud
      await axios.patch(`${API_URL}/plot-lot/plots/${id_plot}/update`, updateData, {
        headers: { Authorization: `Token ${token}` },
      })

      // Actualización exitosa
      setShowSuccessModal(true)
    } catch (error) {
      console.error("Error al actualizar el predio", error)

      if (error.response) {
        console.log("Respuesta de error completa:", error.response.data)

        const backendData = error.response.data
        let errorHandled = false

        // Procesar errores según su formato
        if (backendData.detalles) {
          errorHandled = processBackendErrors(backendData)
        } else if (error.response.status === 400) {
          errorHandled = processTraditionalErrors(backendData)
        }

        // Manejar otros códigos de estado
        if (!errorHandled) {
          if (error.response.status === 401) {
            setErrorMessage("ERROR: Sesión expirada. Por favor, inicie sesión nuevamente.")
            setTimeout(() => navigate("/login"), 2000)
          } else if (error.response.status === 404) {
            setErrorMessage("ERROR: No se encontró el predio o la ruta de actualización.")
          } else {
            setShowFormErrorModal(true)
          }
        }
      } else {
        // Error de conexión
        setShowFormErrorModal(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Renderizar pantalla de error
  if (loadError) {
    return (
      <div>
        <NavBar />
        <ErrorDisplay message={loadError} backTo="/gestionDatos/predios" backText="Regresar a la lista de predios" />
      </div>
    )
  }

  // Renderizar pantalla de carga
  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="max-w-7xl mx-auto p-6 mt-24 bg-white rounded-lg shadow animate-pulse">
          <h1 className="text-xl font-medium text-center mb-2 bg-gray-300 h-6 w-1/3 mx-auto rounded"></h1>
          <p className="text-sm text-gray-400 text-center mb-6 bg-gray-200 h-4 w-1/2 mx-auto rounded"></p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2 mb-4">
                <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
                <div className="bg-gray-200 h-10 w-full rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Renderizar formulario
  return (
    <div>
      <NavBar />
      <div className="w-full min-h-screen flex flex-col items-center pt-24 bg-white p-6">
        <div className="w-full max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-[#365486] mb-2">Actualización de Predios</h2>
        </div>
        <div className="bg-white p-6 w-full max-w-3xl">
          <form onSubmit={handleConfirmSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Campo Predio (solo lectura) */}
              <InputItem
                id="predio"
                name="predio"
                labelName="ID Predio"
                value={formData.predio}
                style={{ backgroundColor: "#f3f4f6" }}
                className="text-gray-600"
                readOnly
              />

              {/* Campo Nombre del Predio */}
              <InputItem
                id="plot_name"
                name="plot_name"
                labelName="Nombre del predio"
                value={formData.plot_name}
                onChange={handleChange}
                placeholder="Ej: La divina"
                error={validationErrors.plot_name}
              />

              {/* Campo Fecha de Registro (solo lectura) */}
              <InputItem
                id="fechaRegistro"
                name="fechaRegistro"
                labelName="Fecha de registro"
                value={formData.fechaRegistro}
                style={{ backgroundColor: "#f3f4f6" }}
                className="text-gray-600"
                readOnly
              />

              {/* Campo Latitud */}
              <InputItem
                id="latitud"
                name="latitud"
                labelName="Latitud"
                value={formData.latitud}
                onChange={handleChange}
                placeholder="Ej: 2.879568"
                error={validationErrors.latitud}
              />
            </div>

            <div className="space-y-4">
              {/* Campo Dueño */}
              <InputItem
                id="dueno"
                name="dueno"
                labelName="Dueño del predio"
                value={formData.dueno}
                onChange={handleChange}
                placeholder="ID del dueño"
                error={validationErrors.dueno}
              />

              {/* Campo Extensión */}
              <InputItem
                id="extension"
                name="extension"
                labelName="Extensión de tierra (m²)"
                value={formData.extension}
                onChange={handleChange}
                placeholder="Ej: 200"
                error={validationErrors.extension}
              />

              {/* Campo Longitud */}
              <InputItem
                id="longitud"
                name="longitud"
                labelName="Longitud"
                value={formData.longitud}
                onChange={handleChange}
                placeholder="Ej: -75.293823"
                error={validationErrors.longitud}
              />
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado del predio</label>
                <div className="relative">
                  <select
                    className={`w-[85%] border border-gray-300 rounded px-3 py-2 appearance-none ${validationErrors.is_activate ? "border-red-300" : ""} ${originalData.is_activate === true ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    name="is_activate"
                    value={formData.is_activate === undefined ? "" : formData.is_activate.toString()}
                    onChange={(e) => {
                      const value = e.target.value === "true";
                      setFormData((prev) => ({
                        ...prev,
                        is_activate: value,
                      }));
                      setValidationErrors((prev) => ({ ...prev, is_activate: "" }));
                    }}
                    disabled={originalData.is_activate === true}  // Solo deshabilitado si originalmente venía activo
                  >
                    <option value="">SELECCIÓN DE ESTADO</option>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                  <ChevronDown className="absolute right-15 top-1/2 transform -translate-y-1/2 text-gray-400" />

                </div>
                {validationErrors.is_activate && <p className="text-red-500 text-sm mt-1">{validationErrors.is_activate}</p>}
              </div>
            </div>


            <div className="col-span-1 md:col-span-2 flex flex-col items-start">
              {/* Mensajes de error */}
              {geoRefError && <p className="text-[#F90000] text-sm mb-2">{geoRefError}</p>}
              {userError && <p className="text-[#F90000] text-sm mb-2">{userError}</p>}
              {errorMessage && <p className="text-[#F90000] text-sm mb-2">{errorMessage}</p>}

              {/* Botones de acción - Invertidos como solicitado */}
              <div className="flex flex-col lg:flex-row justify-between w-[70%] lg:w-full mt-2 gap-3 mx-auto ">
                <BackButton to="/gestionDatos/predios" text="Regresar a la lista" />
                <Button
                  text={submitting ? "Actualizando..." : "Actualizar"}
                  disabled={submitting}
                  color="bg-[#365486]"
                  hoverColor="hover:bg-[#2f4275]"
                  type="submit"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de éxito */}
      <Modal
        showModal={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          navigate("/gestionDatos/predios")
        }}
        title="Actualización Exitosa"
        btnMessage="Aceptar"
      >
        <p>El predio ha sido actualizado con éxito.</p>
      </Modal>

      {/* Modal de error de envío */}
      <Modal
        showModal={showFormErrorModal}
        onClose={() => setShowFormErrorModal(false)}
        title="Error de Envío"
        btnMessage="Cerrar"
      >
        <p>Error en envío de formulario, por favor intente más tarde.</p>
      </Modal>

      {/* Modal de datos sin cambios */}
      <Modal
        showModal={showNoChangeErrorModal}
        onClose={() => setShowNoChangeErrorModal(false)}
        title="Sin Cambios"
        btnMessage="Cerrar"
      >
        <p>No se detectaron cambios en los datos del predio. Modifique al menos un campo antes de actualizar.</p>
      </Modal>
    </div>
  )
}

export default ActualizacionPredios