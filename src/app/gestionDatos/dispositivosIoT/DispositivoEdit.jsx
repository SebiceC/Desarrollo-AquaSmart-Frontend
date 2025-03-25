"use client"

import { useState, useEffect, useRef } from "react"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import BackButton from "../../../components/BackButton"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronDown, AlertCircle, Info, Search, X } from "lucide-react"
import axios from "axios"

// Componente SearchableSelect completamente replicado
const SearchableSelect = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  hasError,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

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

  // Filtrar opciones según el término de búsqueda
  const filteredOptions = options.filter((option) => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obtener la etiqueta seleccionada
  const selectedLabel = options.find((option) => option.value === value)?.label || ""

  // Manejar la selección de una opción
  const handleSelect = (optionValue) => {
    const event = {
      target: {
        name,
        value: optionValue,
      },
    }
    onChange(event)
    setIsOpen(false)
    setSearchTerm("")
  }

  // Manejar el clic en el botón de limpiar
  const handleClear = (e) => {
    e.stopPropagation()
    const event = {
      target: {
        name,
        value: "",
      },
    }
    onChange(event)
    setSearchTerm("")
  }

  return (
    <div className="relative w-[85%]" ref={dropdownRef}>
      <div
        className={`flex items-center justify-between w-full border ${hasError ? "border-red-300" : "border-gray-300"} rounded-lg px-3 py-2 mb-2 bg-white cursor-pointer ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-grow truncate">{value ? selectedLabel : placeholder}</div>
        <div className="flex items-center">
          {value && (
            <button type="button" onClick={handleClear} className="mr-1 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {filteredOptions.length === 0 ? (
            <div className="p-3 text-gray-500 text-center">No se encontraron resultados</div>
          ) : (
            <ul>
              {placeholder && (
                <li
                  className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${value === "" ? "bg-blue-50 text-blue-700" : ""}`}
                  onClick={() => handleSelect("")}
                >
                  {placeholder}
                </li>
              )}
              {filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${option.value === value ? "bg-blue-50 text-blue-700" : ""}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hasError && <div className="h-0.5 bg-red-200 mt-0.5 rounded-full opacity-70"></div>}

      <input type="hidden" id={id} name={name} value={value || ""} required={required} />
    </div>
  )
}

const DispositivoEdit = () => {
  const { iot_id } = useParams()
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_APP_API_URL

  // Estado para el formulario
  const [formData, setFormData] = useState({
    name: "",
    id_plot: "",
    device_type: "",
    id_lot: "",
    is_active: "true",
    characteristics: "",
  })

  const [originalDeviceType, setOriginalDeviceType] = useState("")
  // Estados para listas de selección
  const [predios, setPredios] = useState([])
  const [lotes, setLotes] = useState([])
  const [tiposDispositivo, setTiposDispositivo] = useState([])

  // Estados para errores y carga
  const [errors, setErrors] = useState({})
  const [fieldErrors, setFieldErrors] = useState({
    characteristics: "",
    name: "",
    device_type: "",
    id_plot: "",
    id_lot: "",
  })
  const [loading, setLoading] = useState(false)
  const [loadingPredios, setLoadingPredios] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Cargar tipos de dispositivos y datos del dispositivo
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingTipos(true)
        setLoadingPredios(true)
        
        const token = localStorage.getItem("token")
        if (!token) {
          setErrorMessage("No hay sesión activa. Por favor, inicie sesión nuevamente.")
          setTimeout(() => navigate("/login"), 2000)
          return
        }

        // Cargar tipos de dispositivos
        const tiposResponse = await axios.get(`${API_URL}/iot/device-types`, {
          headers: { Authorization: `Token ${token}` },
        })
        setTiposDispositivo(tiposResponse.data)

        // Cargar predios
        const prediosResponse = await axios.get(`${API_URL}/plot-lot/plots/list`, {
          headers: { Authorization: `Token ${token}` },
        })
        const prediosActivos = prediosResponse.data.filter((predio) => predio.is_activate)
        setPredios(prediosActivos)

        // Cargar dispositivo a editar
        const dispositivoResponse = await axios.get(`${API_URL}/iot/iot-devices/${iot_id}`, {
          headers: { Authorization: `Token ${token}` },
        })
        const dispositivo = dispositivoResponse.data

        // Preparar datos iniciales del formulario
        setFormData({
          name: dispositivo.name,
          device_type: dispositivo.device_type,
          is_active: dispositivo.is_active ? "true" : "false",
          characteristics: dispositivo.characteristics,
          id_plot: dispositivo.id_plot || "",
          id_lot: dispositivo.id_lot || "",
        })

        setOriginalDeviceType(dispositivo.device_type)
        setLoadingTipos(false)
        setLoadingPredios(false)
        setInitialLoading(false)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setErrorMessage("Error al cargar los datos. Por favor, intente más tarde.")
        setLoadingTipos(false)
        setLoadingPredios(false)
        setInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [API_URL, navigate, iot_id])

  // Cargar lotes cuando se selecciona un predio
  useEffect(() => {
    const fetchLotes = async () => {
      // Si no hay predio seleccionado o el tipo es "valvula_48", no cargar lotes
      if (!formData.id_plot || formData.device_type === "valvula_48") {
        setLotes([])
        return
      }

      try {
        setLoadingLotes(true)
        const token = localStorage.getItem("token")

        const response = await axios.get(`${API_URL}/plot-lot/plots/${formData.id_plot}`, {
          headers: { Authorization: `Token ${token}` },
        })

        // Filtrar solo lotes activos
        const lotesActivos = response.data.lotes.filter((lote) => lote.is_activate)
        setLotes(lotesActivos)
        setLoadingLotes(false)
      } catch (error) {
        console.error("Error al cargar lotes:", error)
        setLotes([])
        setLoadingLotes(false)
      }
    }

    fetchLotes()
  }, [formData.id_plot, formData.device_type])

  // Validar que el texto solo contenga caracteres permitidos
  const validateTextInput = (text) => {
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,\-_]+$/
    return regex.test(text)
  }

  // Validar longitud mínima
  const validateMinLength = (text, minLength) => {
    return text.trim().length >= minLength
  }

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target

    // Actualizar el estado del formulario
    if (name === "name") {
      // Limitar a 20 caracteres para el nombre
      if (value.length <= 20) {
        setFormData((prevData) => ({ ...prevData, [name]: value }))
      }

      // Validar caracteres especiales y longitud mínima
      if (value.trim() !== "") {
        const hasValidChars = validateTextInput(value)
        const hasValidLength = validateMinLength(value, 3)

        if (!hasValidChars) {
          setFieldErrors((prev) => ({
            ...prev,
            name: "El nombre solo puede contener letras, números y caracteres básicos (. , - _)",
          }))
          setErrorMessage("ERROR: El nombre contiene caracteres no permitidos")
        } else if (!hasValidLength) {
          setFieldErrors((prev) => ({
            ...prev,
            name: "El nombre debe tener al menos 3 caracteres",
          }))
          setErrorMessage("ERROR: El nombre es demasiado corto")
        } else {
          setFieldErrors((prev) => ({
            ...prev,
            name: "",
          }))
          setErrorMessage("")
        }
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          name: "",
        }))
      }
    } else if (name === "characteristics") {
      setFormData((prevData) => ({ ...prevData, [name]: value }))

      // Validar características
      if (value.trim() !== "") {
        if (value.length > 300) {
          setFieldErrors((prev) => ({
            ...prev,
            characteristics: "ERROR: El campo excede la cantidad de caracteres permitida (máximo 300)",
          }))
        } else if (!validateMinLength(value, 10)) {
          setFieldErrors((prev) => ({
            ...prev,
            characteristics: "Las características deben tener al menos 10 caracteres",
          }))
        } else if (!validateTextInput(value)) {
          setFieldErrors((prev) => ({
            ...prev,
            characteristics: "Las características contienen caracteres no permitidos",
          }))
        } else {
          setFieldErrors((prev) => ({
            ...prev,
            characteristics: "",
          }))
        }
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          characteristics: "",
        }))
      }
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    // Limpiar mensaje de error general al cambiar cualquier campo
    setErrorMessage("")

    // Si cambia el tipo de dispositivo a Válvula 48, limpiar predio y lote
    if (name === "device_type") {
      const isValvula = tiposDispositivo.some(
        (tipo) => tipo.device_id === value && tipo.name.toLowerCase().includes("válvula 48"),
      )

      if (isValvula) {
        setFormData((prevData) => ({
          ...prevData,
          id_plot: "",
          id_lot: "",
        }))
      }
    }

    // Si cambia el predio, limpiar el lote seleccionado
    if (name === "id_plot") {
      setFormData((prevData) => ({
        ...prevData,
        id_lot: "",
      }))
    }

    // Limpiar errores específicos del campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {}
    let isValid = true

    // Validar campos obligatorios
    if (!formData.name.trim()) {
      newErrors.name = " "
      isValid = false
    } else {
      // Validar longitud mínima del nombre
      if (!validateMinLength(formData.name, 3)) {
        newErrors.name = " "
        setFieldErrors((prev) => ({ ...prev, name: "El nombre debe tener al menos 3 caracteres" }))
        isValid = false
      }

      // Validar caracteres del nombre
      if (!validateTextInput(formData.name)) {
        newErrors.name = " "
        setFieldErrors((prev) => ({ ...prev, name: "El nombre contiene caracteres no permitidos" }))
        isValid = false
      }
    }

    if (!formData.device_type) {
      newErrors.device_type = " "
      isValid = false
    }

    if (!formData.characteristics.trim()) {
      newErrors.characteristics = " "
      isValid = false
    } else {
      // Validar longitud mínima de características
      if (!validateMinLength(formData.characteristics, 10)) {
        newErrors.characteristics = " "
        setFieldErrors((prev) => ({
          ...prev,
          characteristics: "Las características deben tener al menos 10 caracteres",
        }))
        isValid = false
      }

      // Validar caracteres de características
      if (!validateTextInput(formData.characteristics)) {
        newErrors.characteristics = " "
        setFieldErrors((prev) => ({
          ...prev,
          characteristics: "Las características contienen caracteres no permitidos",
        }))
        isValid = false
      }
    }

    // Predio es obligatorio solo si el tipo de dispositivo NO es Válvula 48
    const isValvulaDevice = tiposDispositivo.some(
      (tipo) => tipo.device_id === formData.device_type && tipo.name.toLowerCase().includes("válvula 48"),
    )
    if (!isValvulaDevice && !formData.id_plot) {
      newErrors.id_plot = " "
      isValid = false
    }

    // Validar que las características no excedan los 300 caracteres
    if (formData.characteristics && formData.characteristics.length > 300) {
      newErrors.characteristics = " "
      setFieldErrors((prev) => ({
        ...prev,
        characteristics: "ERROR: El campo excede la cantidad de caracteres permitida",
      }))
      isValid = false
    }

    // Validar que el nombre no exceda los 20 caracteres
    if (formData.name && formData.name.length > 20) {
      newErrors.name = " "
      setFieldErrors((prev) => ({ ...prev, name: "ERROR: El nombre excede la cantidad de caracteres permitida" }))
      isValid = false
    }

    if (!isValid && !errorMessage) {
      setErrorMessage("Por favor, complete todos los campos obligatorios correctamente.")
    }

    setErrors(newErrors)
    return isValid
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setLoading(true)
      // Convertir is_active de string a booleano
      const isActive = formData.is_active === "true"

      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMessage("No hay sesión activa. Por favor, inicie sesión nuevamente.")
        setTimeout(() => navigate("/login"), 2000)
        return
      }

      // Preparar datos para enviar
      const requestData = {
        name: formData.name,
        // device_type: formData.device_type,
        is_active: isActive,
        characteristics: formData.characteristics,
      }

      if (formData.device_type !== originalDeviceType) {
        requestData.device_type = formData.device_type
      }
      // Agregar id_plot solo si no es Válvula 48
      const isValvulaForSubmit = tiposDispositivo.some(
        (tipo) => tipo.device_id === formData.device_type && tipo.name.toLowerCase().includes("válvula 48")
      )
      if (!isValvulaForSubmit) {
        requestData.id_plot = formData.id_plot
      }

      // Agregar id_lot solo si está seleccionado
      if (formData.id_lot) {
        requestData.id_lot = formData.id_lot
      }

      const response = await axios.patch(
        `${API_URL}/iot/iot-devices/${iot_id}/update`, 
        requestData, 
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.status === 200) {
        setShowSuccessModal(true)
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error("Error al actualizar dispositivo:", error)

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

        // Manejar mensaje de error general
        if (error.response.data.error) {
          setErrorMessage(`ERROR: ${error.response.data.error}`)
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

  // Verificar si el tipo de dispositivo seleccionado es Válvula 48
  const isValvula48 = tiposDispositivo.some(
    (tipo) => tipo.device_id === formData.device_type && tipo.name.toLowerCase().includes("válvula 48"),
  )
  const showPlotFields = !isValvula48

  // Preparar opciones para los selects
  const tiposDispositivoOptions = tiposDispositivo.map((tipo) => ({
    value: tipo.device_id,
    label: tipo.name,
  }))

  const prediosOptions = predios.map((predio) => ({
    value: predio.id_plot,
    label: predio.plot_name || predio.id_plot,
  }))

  const lotesOptions = lotes.map((lote) => ({
    value: lote.id_lot,
    label: `${lote.id_lot} - ${lote.crop_type}`,
  }))

  const estadoOptions = [
    { value: "true", label: "Activo" },
    { value: "false", label: "Inactivo" },
  ]

  // Renderizar pantalla de carga inicial
  if (initialLoading) {
    return (
      <div>
        <NavBar />
        <div className="w-full min-h-screen flex flex-col items-center pt-24 bg-white p-6">
          <div className="w-full max-w-3xl">
            <h2 className="text-center text-2xl font-semibold text-[#365486] mb-2">Editar Dispositivo</h2>
            <p className="text-sm text-gray-600 text-center mb-6">Cargando información del dispositivo...</p>
            <div className="w-16 h-1 bg-[#365486] mx-auto mb-6 rounded-full"></div>
          </div>
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#365486]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <NavBar />
      <div className="w-full min-h-screen flex flex-col items-center pt-24 bg-white p-6">
        <div className="w-full max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-[#365486] mb-2">Editar Dispositivo</h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Modifique los datos del dispositivo seleccionado
          </p>
          <div className="w-16 h-1 bg-[#365486] mx-auto mb-6 rounded-full"></div>

          {/* Mensaje de error general en la parte superior */}
          {errorMessage && (
            <div className="w-full border border-red-100 bg-red-50 rounded px-4 py-3 text-red-600 text-sm mb-6 flex items-start">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-md">
          {loading && !showSuccessModal ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#365486]"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campo de Nombre */}
              <div className="flex flex-col">
                <label htmlFor="name" className="block text-sm mb-2">
                  Nombre del Dispositivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Ej: Válvula principal"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border ${errors.name ? "border-red-300" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                  required
                  maxLength={20}
                />
                {errors.name && <div className="h-0.5 bg-red-200 mt-0.5 rounded-full opacity-70"></div>}
                {fieldErrors.name && renderFieldError(fieldErrors.name)}
              </div>

              {/* Campo de Tipo de Dispositivo con búsqueda */}
              <div className="flex flex-col">
                <label htmlFor="device_type" className="block text-sm mb-2">
                  Tipo de Dispositivo <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  id="device_type"
                  name="device_type"
                  value={formData.device_type}
                  onChange={handleChange}
                  options={tiposDispositivoOptions}
                  placeholder="SELECCIONE TIPO DE DISPOSITIVO"
                  hasError={errors.device_type}
                  required={true}
                />
              </div>

              {/* Mensaje informativo cuando se selecciona Válvula 48 */}
              {isValvula48 && (
                <div className="flex flex-col md:col-span-2 mt-2 mb-2">
                  <div className="w-full border border-gray-100 bg-gray-50 rounded px-4 py-3 text-gray-600 text-sm flex items-center">
                    <Info className="h-4 w-4 text-gray-400 mr-2" />
                    <p>
                      Los dispositivos de tipo "Válvula 48" se asignan a la bocatoma y no requieren selección de predio
                      ni lote.
                    </p>
                  </div>
                </div>
              )}

              {/* Contenedor para campos de predio y lote (oculto para Válvula 48) */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2 ${showPlotFields ? "block" : "hidden"}`}
              >
                {/* Campo de Predio con búsqueda */}
                <div className="flex flex-col">
                  <label htmlFor="id_plot" className="block text-sm mb-2">
                    Predio a asignar <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    id="id_plot"
                    name="id_plot"
                    value={formData.id_plot}
                    onChange={handleChange}
                    options={prediosOptions}
                    placeholder="SELECCIONE UN PREDIO"
                    hasError={errors.id_plot}
                    required={showPlotFields}
                  />
                </div>

                {/* Campo de Lote con búsqueda o mensaje informativo */}
                <div className="flex flex-col">
                  <label htmlFor="id_lot" className="block text-sm mb-2">
                    Lote a asignar
                  </label>
                  <div className="relative">
                    {loadingLotes ? (
                      <div className="w-full border border-gray-300 rounded px-3 py-2 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#365486] mr-2"></div>
                        <span className="text-gray-500">Cargando lotes...</span>
                      </div>
                    ) : lotes.length > 0 ? (
                      <SearchableSelect
                        id="id_lot"
                        name="id_lot"
                        value={formData.id_lot}
                        onChange={handleChange}
                        options={lotesOptions}
                        placeholder="SELECCIONE UN LOTE (OPCIONAL)"
                        hasError={errors.id_lot}
                      />
                    ) : formData.id_plot ? (
                      <div className="w-full border border-gray-100 bg-gray-50 rounded px-3 py-2 text-gray-500 text-sm flex items-center">
                        <Info className="h-4 w-4 text-gray-400 mr-2" />
                        No hay lotes disponibles para este predio
                      </div>
                    ) : (
                      <div className="w-full border border-gray-200 rounded px-3 py-2 text-gray-400 bg-gray-50">
                        Seleccione un predio primero
                      </div>
                    )}
                  </div>
                  {errors.id_lot && <div className="h-0.5 bg-red-200 mt-0.5 rounded-full opacity-70"></div>}
                </div>
              </div>

              {/* Campo de Estado con búsqueda */}
              <div className="flex flex-col">
                <label htmlFor="is_active" className="block text-sm mb-2">
                  Estado <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  id="is_active"
                  name="is_active"
                  value={formData.is_active}
                  onChange={handleChange}
                  options={estadoOptions}
                  placeholder="SELECCIONE ESTADO"
                  hasError={errors.is_active}
                  required={true}
                />
              </div>

              {/* Campo de Características */}
              <div className="flex flex-col col-span-1 md:col-span-2">
                <label htmlFor="characteristics" className="block text-sm mb-2">
                  Características <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="characteristics"
                  name="characteristics"
                  value={formData.characteristics}
                  onChange={handleChange}
                  placeholder="Describa las características del dispositivo"
                  className={`w-full border resize-none h-24 ${errors.characteristics || fieldErrors.characteristics ? "border-red-300" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                  maxLength={300}
                  required
                />
                <div
                  className={`text-xs ${formData.characteristics.length > 280 ? "text-amber-500" : "text-gray-400"} ${formData.characteristics.length >= 300 ? "text-red-600" : ""} text-right mt-1`}
                >
                  {formData.characteristics.length}/300 caracteres
                </div>
                {errors.characteristics && <div className="h-0.5 bg-red-200 mt-0.5 rounded-full opacity-70"></div>}
                {fieldErrors.characteristics && renderFieldError(fieldErrors.characteristics)}
              </div>

              {/* Eliminar el mensaje de error de aquí */}
              <div className="col-span-1 md:col-span-2 flex flex-col items-start">
                {/* Botones de acción */}
                <div className="flex justify-between w-full mt-2">
                  <BackButton to="/gestionDatos/dispositivosIoT" text="Regresar a la lista" />
                  <button
                    type="submit"
                    className="bg-[#365486] text-white px-5 py-2 rounded-lg hover:bg-[#2f4275] disabled:bg-gray-400"
                    disabled={loading}
                  >
                    {loading ? "Actualizando..." : "Actualizar"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal de éxito */}
        <Modal
          showModal={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false)
            navigate("/gestionDatos/dispositivosIoT")
          }}
          title="Actualización Exitosa"
          btnMessage="Aceptar"
        >
          <p>El dispositivo ha sido actualizado con éxito.</p>
        </Modal>
      </div>
    </div>
  )
}

export default DispositivoEdit;