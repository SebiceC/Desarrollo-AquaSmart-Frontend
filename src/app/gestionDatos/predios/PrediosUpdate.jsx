"use client"

import { useState, useEffect } from "react"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import Button from "../../../components/Button"
import InputItem from "../../../components/InputItem"
import BackButton from "../../../components/BackButton"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"

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
  })
  const [originalData, setOriginalData] = useState({})

  // Estados para carga y envío
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Estados para errores
  const [validationErrors, setValidationErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState("")
  const [geoRefError, setGeoRefError] = useState("")
  const [userError, setUserError] = useState("")

  // Estados para modales
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFormErrorModal, setShowFormErrorModal] = useState(false)
  const [showNoChangeErrorModal, setShowNoChangeErrorModal] = useState(false)

  // Cargar datos del predio
  useEffect(() => {
    const fetchPredioData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        const API_URL = import.meta.env.VITE_APP_API_URL

        const response = await axios.get(`${API_URL}/plot-lot/plots/${id_plot}`, {
          headers: { Authorization: `Token ${token}` },
        })

        const predioData = response.data
        const fechaRegistro = new Date(predioData.registration_date).toLocaleDateString()

        const formattedData = {
          predio: predioData.id_plot,
          dueno: predioData.owner,
          fechaRegistro: fechaRegistro,
          extension: predioData.plot_extension.toString(),
          latitud: predioData.latitud,
          longitud: predioData.longitud,
        }

        setFormData(formattedData)
        setOriginalData(formattedData)
        setLoading(false)
      } catch (error) {
        console.error("Error al obtener los datos del predio", error)
        setErrorMessage("Error al cargar los datos del predio. Por favor, intente más tarde.")
        setLoading(false)
      }
    }

    if (id_plot) {
      fetchPredioData()
    }
  }, [id_plot])

  // Validación de campos numéricos
  const validateNumericField = (name, value) => {
    // Verificar si contiene letras
    if (/[a-zA-Z]/.test(value)) {
      return `ERROR: El campo ${name} no debe contener letras`
    }

    // Convertir a número para validar cero o negativos
    const numValue = Number.parseFloat(value)

    // Verificar si es cero o negativo
    if (!isNaN(numValue) && numValue <= 0) {
      return `ERROR: El campo ${name} no debe ser cero o negativo`
    }

    return "" // Sin error
  }

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpiar mensajes de error
    setErrorMessage("")
    setGeoRefError("")
    setUserError("")

    // Validar campos numéricos en tiempo real
    if (name === "extension" || name === "latitud" || name === "longitud") {
      const fieldLabel = name === "extension" ? "Extensión de tierra" : name === "latitud" ? "Latitud" : "Longitud"

      const error = validateNumericField(fieldLabel, value)

      if (error) {
        setValidationErrors((prev) => ({
          ...prev,
          [name]: error,
        }))
      } else {
        // Eliminar el error si ya no existe
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    }
  }

  // Validación de datos sin cambios
  const validateChanges = () => {
    const isUnchanged =
      formData.dueno === originalData.dueno &&
      formData.extension === originalData.extension &&
      formData.latitud === originalData.latitud &&
      formData.longitud === originalData.longitud

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

    // Validar dueño (no debe estar vacío)
    if (!formData.dueno.trim()) {
      errors.dueno = "ERROR: El campo Dueño del predio es obligatorio"
      isValid = false
    }

    // Validar campos numéricos
    const fieldsToValidate = [
      { name: "extension", label: "Extensión de tierra", value: formData.extension },
      { name: "latitud", label: "Latitud", value: formData.latitud },
      { name: "longitud", label: "Longitud", value: formData.longitud },
    ]

    for (const field of fieldsToValidate) {
      const error = validateNumericField(field.label, field.value)
      if (error) {
        errors[field.name] = error
        isValid = false
      }
    }

    setValidationErrors(errors)
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
        backendErrors.non_field_errors.some((error) => error.includes("georeferenciación")))
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

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
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

    // Iniciar proceso de envío
    setSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const API_URL = import.meta.env.VITE_APP_API_URL

      // Preparar los datos para enviar
      const updateData = {
        owner: formData.dueno,
        plot_extension: Number.parseFloat(formData.extension),
        latitud: Number.parseFloat(formData.latitud),
        longitud: Number.parseFloat(formData.longitud),
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

  // Renderizar pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    )
  }

  // Renderizar formulario
  return (
    <div>
      <NavBar />
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="w-full max-w-3xl">
          <h2 className="text-center text-2xl font-bold mb-8">Actualización de Predios</h2>
        </div>
        <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-md">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Campo Predio (solo lectura) */}
              <InputItem
                id="predio"
                name="predio"
                labelName="Predio"
                value={formData.predio}
                style={{ backgroundColor: "#cbcbcb" }}
                className="text-black"
                readOnly
              />

              {/* Campo Fecha de Registro (solo lectura) */}
              <InputItem
                id="fechaRegistro"
                name="fechaRegistro"
                labelName="Fecha de registro del predio"
                value={formData.fechaRegistro}
                style={{ backgroundColor: "#cbcbcb" }}
                className="text-black"
                readOnly
              />

              {/* Campo Latitud */}
              <InputItem
                id="latitud"
                name="latitud"
                labelName="Latitud"
                value={formData.latitud}
                onChange={handleChange}
                placeholder="Ej: 40.7128"
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
                placeholder="Ej: 1000"
                error={validationErrors.extension}
              />

              {/* Campo Longitud */}
              <InputItem
                id="longitud"
                name="longitud"
                labelName="Longitud"
                value={formData.longitud}
                onChange={handleChange}
                placeholder="Ej: -74.0060"
                error={validationErrors.longitud}
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col items-start">
              {/* Mensajes de error */}
              {geoRefError && <p className="text-[#F90000] text-sm mb-2">{geoRefError}</p>}
              {userError && <p className="text-[#F90000] text-sm mb-2">{userError}</p>}
              {errorMessage && <p className="text-[#F90000] text-sm mb-2">{errorMessage}</p>}

              {/* Botones de acción */}
              <div className="flex justify-between w-full mt-2">
                <Button
                  text={submitting ? "Actualizando..." : "Actualizar"}
                  disabled={submitting}
                  color="bg-[#365486]"
                  hoverColor="hover:bg-[#2f4275]"
                  onClick={() => {}}
                />
                <BackButton to="/gestionDatos/predios" />
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