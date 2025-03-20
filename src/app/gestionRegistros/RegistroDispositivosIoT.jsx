"use client"

import { useState } from "react"
import NavBar from "../../components/NavBar"
import Modal from "../../components/Modal"
import InputItem from "../../components/InputItem"
import { useNavigate } from "react-router-dom"
import { ChevronDown, AlertCircle } from "lucide-react"
import axios from "axios"

const RegistroDispositivosIoT = () => {
  const [formData, setFormData] = useState({
    name: "",
    id_plot: "",
    device_type: "",
    id_lot: "",
    is_active: "true",
    characteristics: "",
  })

  const [errors, setErrors] = useState({})
  const [fieldErrors, setFieldErrors] = useState({
    id_plot: "",
    characteristics: "",
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_APP_API_URL

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({ ...prevData, [name]: value }))

    // Limpiar mensaje de error general al cambiar cualquier campo
    setErrorMessage("")

    // Validación en tiempo real para el prefijo PR-
    if (name === "id_plot") {
      if (value && !value.startsWith("PR-")) {
        setFieldErrors((prev) => ({
          ...prev,
          id_plot: "ERROR: El ID del predio debe comenzar con 'PR-'",
        }))
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          id_plot: "",
        }))
      }
    }

    // Validación en tiempo real para el límite de caracteres
    if (name === "characteristics") {
      if (value.length > 300) {
        setFieldErrors((prev) => ({
          ...prev,
          characteristics: "ERROR: El campo excede la cantidad de caracteres permitida.",
        }))
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          characteristics: "",
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    let isValid = true

    // Validar campos obligatorios
    const requiredFields = ["name", "id_plot", "device_type", "is_active", "characteristics"]
    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = " "
        isValid = false
      }
    })

    // Validar que el ID del predio comience con "PR-"
    if (formData.id_plot && !formData.id_plot.startsWith("PR-")) {
      newErrors.id_plot = " "
      isValid = false
    }

    // Validar que las características no excedan los 300 caracteres
    if (formData.characteristics && formData.characteristics.length > 300) {
      newErrors.characteristics = " "
      isValid = false
    }

    if (!isValid && !errorMessage) {
      setErrorMessage("Por favor, complete todos los campos obligatorios correctamente.")
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      // Convertir is_active de string a booleano
      const isActive = formData.is_active === "true"

      const response = await axios.post(
        `${API_URL}/iot/register`,
        {
          name: formData.name,
          id_plot: formData.id_plot,
          device_type: formData.device_type,
          id_lot: formData.id_lot || null, // Si está vacío, enviar null
          is_active: isActive,
          characteristics: formData.characteristics,
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.status === 201) {
        setShowSuccessModal(true)
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const newErrors = {}

        // Manejar errores específicos de campos
        if (error.response.data.id_plot) {
          newErrors.id_plot = " "
          setErrorMessage(`ERROR: ${error.response.data.id_plot[0]}`)
        }

        if (error.response.data.id_lot) {
          newErrors.id_lot = " "
          setErrorMessage(`ERROR: ${error.response.data.id_lot[0]}`)
        }

        if (error.response.data.name) {
          newErrors.name = " "
          setErrorMessage(`ERROR: ${error.response.data.name[0]}`)
        }

        if (error.response.data.device_type) {
          newErrors.device_type = " "
          setErrorMessage(`ERROR: ${error.response.data.device_type[0]}`)
        }

        if (error.response.data.characteristics) {
          newErrors.characteristics = " "
          setErrorMessage(`ERROR: ${error.response.data.characteristics[0]}`)
        }

        // Manejar error de lote duplicado
        if (error.response.data.non_field_errors) {
          setErrorMessage(error.response.data.non_field_errors[0])

          // Si el error menciona un lote, marcar el campo de lote
          if (error.response.data.non_field_errors[0].includes("lote")) {
            newErrors.id_lot = " "
          }
        }

        setErrors(newErrors)
      } else {
        setErrorMessage("Error de conexión con el servidor.")
      }
    }
  }

  // Función para renderizar mensajes de error específicos de campo
  const renderFieldError = (message) => (
    <div className="flex items-center mt-1 text-red-600 text-xs">
      <AlertCircle className="h-3 w-3 mr-1" />
      <p>{message}</p>
    </div>
  )

  return (
    <div>
      <NavBar />
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <h2 className="text-center text-2xl font-bold mb-6 mt-20">Formulario de Registro de Dispositivos IoT</h2>
        <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-md">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputItem
              label="Nombre del Dispositivo"
              type="text"
              name="name"
              placeholder="Ej: Válvula principal"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />

            <div className="flex flex-col">
              <label htmlFor="id_plot" className="block text-sm mb-2">
                Predio a asignar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="id_plot"
                name="id_plot"
                placeholder="Ej: PR-001"
                value={formData.id_plot}
                onChange={handleChange}
                className={`w-full border ${errors.id_plot || fieldErrors.id_plot ? "border-red-500" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                required
              />
              {errors.id_plot && <div className="h-1 bg-red-500 mt-1 rounded-full"></div>}
              {fieldErrors.id_plot && renderFieldError(fieldErrors.id_plot)}
            </div>

            <div className="flex flex-col">
              <label htmlFor="device_type" className="block text-sm mb-2">
                Tipo de Dispositivo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="device_type"
                  name="device_type"
                  value={formData.device_type}
                  onChange={handleChange}
                  className={`w-full border appearance-none ${errors.device_type ? "border-red-500" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                  required
                >
                  <option value="">SELECCIÓN DE TIPO DE DISPOSITIVO</option>
                  <option value="caudalimetro">Caudalímetro</option>
                  <option value="electrovalvula">Electroválvula</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              {errors.device_type && <div className="h-1 bg-red-500 mt-1 rounded-full"></div>}
            </div>

            <InputItem
              label="Lote a asignar (Opcional)"
              type="text"
              name="id_lot"
              placeholder="Ej: Lote1"
              value={formData.id_lot}
              onChange={handleChange}
              error={errors.id_lot}
            />

            <div className="flex flex-col">
              <label htmlFor="is_active" className="block text-sm mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="is_active"
                  name="is_active"
                  value={formData.is_active}
                  onChange={handleChange}
                  className={`w-full border appearance-none ${errors.is_active ? "border-red-500" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                  required
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              {errors.is_active && <div className="h-1 bg-red-500 mt-1 rounded-full"></div>}
            </div>

            <div className="flex flex-col col-span-1 md:col-span-2">
              <label htmlFor="characteristics" className="block text-sm mb-2">
                Características <span className="text-red-500">*</span>
              </label>
              <textarea
                id="characteristics"
                name="characteristics"
                value={formData.characteristics}
                onChange={handleChange}
                placeholder="Escribe la descripción aquí!"
                className={`w-full border resize-none h-24 ${errors.characteristics || fieldErrors.characteristics ? "border-red-500" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                maxLength={300}
                required
              />
              <div
                className={`text-xs ${formData.characteristics.length > 280 ? "text-amber-500" : "text-gray-400"} ${formData.characteristics.length >= 300 ? "text-red-600" : ""} text-right mt-1`}
              >
                {formData.characteristics.length}/300 caracteres
              </div>
              {errors.characteristics && <div className="h-1 bg-red-500 mt-1 rounded-full"></div>}
              {fieldErrors.characteristics && renderFieldError(fieldErrors.characteristics)}
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col items-start">
              {errorMessage && <p className="text-red-600 text-sm mb-3">{errorMessage}</p>}
              <button type="submit" className="bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                Registrar
              </button>
            </div>
          </form>
        </div>

        {/* Modal de éxito */}
        <Modal
          showModal={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false)
            navigate("/home")
          }}
          title="Registro Exitoso"
          btnMessage="Aceptar"
        >
          <p>El dispositivo IoT ha sido registrado con éxito.</p>
        </Modal>
      </div>
    </div>
  )
}

export default RegistroDispositivosIoT