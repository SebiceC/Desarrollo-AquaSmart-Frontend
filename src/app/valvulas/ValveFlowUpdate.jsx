"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../../components/NavBar"
import Modal from "../../components/Modal"
import BackButton from "../../components/BackButton"
import { Search, Loader } from 'lucide-react'
import axios from "axios"

// Crear una instancia de axios con configuración base
const createAPI = (token) => {
  return axios.create({
    baseURL: import.meta.env.VITE_APP_API_URL,
    headers: { Authorization: `Token ${token}` },
  })
}

const ValveFlowUpdate = () => {
  const { id_valve } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("Información")
  const [isConnectivityIssue, setIsConnectivityIssue] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Modales de confirmación para apertura y cierre total
  const [showConfirmOpenModal, setShowConfirmOpenModal] = useState(false)
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState(false)
  const [isProcessingOpen, setIsProcessingOpen] = useState(false)
  const [isProcessingClose, setIsProcessingClose] = useState(false)

  // Añadir un nuevo estado para controlar la carga progresiva
  const [loadingValveInfo, setLoadingValveInfo] = useState(true)

  // Estados iniciales
  const initialValveState = {
    id: "",
    name: "",
    location_id: "",
    location_type: "",
    location_name: "",
    parent_plot_name: "",
    property: "",
    owner: "",
    is_active: false,
    current_flow: 0,
    max_flow: 180,
    flow_unit: "litros (L/s)",
    valve_type: "",
    last_update: "",
  }

  const initialFormState = {
    flow: "",
    flow_unit: "litros (L/s)",
  }

  // Usar estos estados iniciales en los useState
  const [valve, setValve] = useState(initialValveState)
  const [formData, setFormData] = useState(initialFormState)
  const [deviceData, setDeviceData] = useState(null)
  const [plots, setPlots] = useState([])
  const [allLots, setAllLots] = useState([])

  // Validation states
  const [flowError, setFlowError] = useState("")
  const [sameFlowError, setSameFlowError] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState("")

  // Units options
  const unitOptions = [{ value: "litros", label: "litros (L/s)" }]

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Utilidades para manejo de errores y mensajes
  const handleApiError = (err, defaultMessage) => {
    console.error(defaultMessage, err)

    if (err.response) {
      if (err.response.status === 403) {
        return err.response.data?.detail || "No tiene permisos para acceder a esta válvula."
      } else {
        return err.response.data?.detail || err.response.data?.message || defaultMessage
      }
    } else if (err.request) {
      setIsConnectivityIssue(true)
      return "No se pudo conectar con el servidor. Verifique su conexión a internet."
    }

    return `Error de configuración: ${err.message}`
  }

  const showMessage = (title, message, type = "info") => {
    setModalTitle(title)
    setModalMessage(message)

    if (type === "error") {
      setErrorModalMessage(message)
      setShowErrorModal(true)
    } else if (type === "success") {
      setShowSuccessModal(true)
    } else {
      setShowModal(true)
    }
  }

  // Función optimizada para cargar todos los datos necesarios en paralelo
  const fetchAllData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No hay una sesión activa. Por favor, inicie sesión.")
        setLoading(false)
        return
      }

      const api = createAPI(token)

      // Realizar todas las peticiones en paralelo
      const [devicesResponse, plotsResponse] = await Promise.all([
        api.get("/iot/iot-devices"),
        api.get("/plot-lot/plots/list"),
      ])

      // Encontrar el dispositivo específico
      const device = devicesResponse.data.find((d) => d.iot_id === id_valve)

      if (!device) {
        throw new Error("No se encontró la válvula solicitada.")
      }

      // Guardar los datos del dispositivo para uso posterior
      setDeviceData(device)
      setPlots(plotsResponse.data)

      // Configurar los datos básicos de la válvula inmediatamente
      const basicValveData = {
        id: device.iot_id,
        name: device.name || "Sin nombre",
        is_active: device.is_active,
        current_flow: device.actual_flow || 0,
        max_flow: 180,
        flow_unit: "litros (L/s)",
        registration_date: device.registration_date || new Date().toISOString(),
      }

      // Actualizar el estado con los datos básicos
      setValve(basicValveData)
      setFormData({
        flow: "",
        flow_unit: "litros (L/s)",
      })

      // Marcar que la carga principal ha terminado
      setLoading(false)

      // Iniciar la carga de lotes en segundo plano
      fetchLotsData(token, device, plotsResponse.data)
    } catch (err) {
      const errorMessage = handleApiError(err, "No se pudieron cargar los datos de la válvula.")
      setError(errorMessage)
      setLoading(false)
      setLoadingValveInfo(false)
    }
  }, [id_valve])

  // Función para cargar los datos de lotes en segundo plano
  const fetchLotsData = useCallback(async (token, device, plots) => {
    try {
      const api = createAPI(token)

      // Crear un array de promesas para todas las peticiones de lotes
      const lotPromises = plots.map((plot) =>
        api
          .get(`/plot-lot/plots/${plot.id_plot}`)
          .then((response) => {
            if (response.data.lotes && Array.isArray(response.data.lotes)) {
              return response.data.lotes.map((lot) => ({
                ...lot,
                parent_plot_id: plot.id_plot,
                parent_plot_name: plot.plot_name,
                parent_plot_owner: plot.owner,
              }))
            }
            return []
          })
          .catch((err) => {
            console.error(`Error al obtener lotes del predio ${plot.id_plot}:`, err)
            return []
          }),
      )

      // Ejecutar todas las promesas en paralelo
      const lotsArrays = await Promise.all(lotPromises)
      const allLotsData = lotsArrays.flat()

      // Guardar todos los lotes para uso posterior
      setAllLots(allLotsData)

      // Determinar la ubicación (predio o lote)
      const locationInfo = determineLocation(device, plots, allLotsData)

      // Actualizar el estado con los datos completos
      setValve((prev) => ({
        ...prev,
        ...locationInfo,
        valve_type: device.device_type_name || device.type || "N/A",
      }))
    } catch (err) {
      console.error("Error al cargar datos detallados:", err)
    } finally {
      setLoadingValveInfo(false)
    }
  }, [])

  // Determinar la ubicación de la válvula
  const determineLocation = (deviceData, plots, allLots) => {
    const associatedPlot = plots.find((plot) => plot.id_plot === deviceData.id_plot)
    const associatedLot = allLots.find((lot) => lot.id_lot === deviceData.id_lot)

    let locationInfo = {
      location_id: "N/A",
      location_type: "N/A",
      location_name: "N/A",
      parent_plot_name: null,
      owner: "N/A",
      property: "N/A",
    }

    if (associatedLot) {
      // Si está asociado a un lote, mostrar el ID del lote
      locationInfo = {
        location_id: associatedLot.id_lot,
        location_type: "lote",
        location_name: associatedLot.crop_type ? `${associatedLot.crop_name || "Sin variedad"}` : "Sin información",
        parent_plot_name: associatedLot.parent_plot_name,
        owner: associatedLot.parent_plot_owner || "N/A",
        property: "N/A", // Los lotes no tienen propiedad directa
      }
    } else if (associatedPlot) {
      // Si no está asociado a un lote pero sí a un predio
      locationInfo = {
        location_id: associatedPlot.id_plot,
        location_type: "predio",
        location_name: associatedPlot.plot_name,
        owner: associatedPlot.owner || "N/A",
        property: associatedPlot.property || "N/A",
        parent_plot_name: null,
      }
    }

    return locationInfo
  }

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Validar entrada de flujo
  const validateFlowInput = (value) => {
    // Limpiar errores previos
    setFlowError("")
    setSameFlowError(false)

    // Validar formato numérico
    if (value && !/^\d*\.?\d*$/.test(value)) {
      return "ERROR: El tipo de dato no es válido (solo números)"
    }

    const numValue = Number.parseFloat(value)

    // Validar máximo
    if (numValue > 180) {
      return "ERROR: El valor ingresado no es permitido, valor máximo es 180 litros (L/s)"
    }

    // Validar mínimo
    if (value !== "" && numValue < 0) {
      return "ERROR: El valor ingresado no es permitido, valor mínimo es 0 litros (L/s)"
    }

    // Validar si es igual al valor actual
    if (numValue === valve.current_flow) {
      setSameFlowError(true)
    }

    return null
  }

  // Actualizar handleInputChange
  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === "flow") {
      const error = validateFlowInput(value)
      if (error) {
        setFlowError(error)
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Open error modal
  const openErrorModal = (message, title = "ERROR") => {
    setModalTitle(title)
    setModalMessage(message)
    setShowModal(true)
  }

  // Validar el formulario antes de enviar
  const validateForm = () => {
    // Validar si la válvula está activa
    if (!valve.is_active) {
      showMessage("ERROR", "No se puede actualizar el caudal porque la válvula no está activa.")
      return false
    }

    // Validar si se proporcionó un valor
    if (!formData.flow) {
      setFlowError("ERROR: El valor en litros es requerido")
      return false
    }

    // Validar si el valor es el mismo que el actual
    if (Number.parseFloat(formData.flow) === valve.current_flow) {
      setSameFlowError(true)
      return false
    }

    // Validar si el valor excede el máximo
    if (Number.parseFloat(formData.flow) > 180) {
      setFlowError(`ERROR: El valor ingresado no es permitido, valor máximo es 180 litros (L/s)`)
      return false
    }

    return true
  }

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    if (!validateForm()) {
      setIsSaving(false)
      return
    }

    try {
      const updateData = {
        actual_flow: Number.parseFloat(formData.flow),
      }

      const token = localStorage.getItem("token")
      const api = createAPI(token)

      await api.put(`/iot/update-flow/${valve.id}`, updateData)

      // POST al endpoint externo para ajustar ángulo
      await axios.post(
        "https://mqtt-flask-api-production.up.railway.app/publicar_comando_lote",
        {
          comando: "ajustar",
          angulo: Number.parseFloat(formData.flow),
          lote_id: valve.location_id
        }
        
      )

      showMessage("Éxito", "El valor en litros ha sido actualizado correctamente.", "success")

      // Actualizar datos locales con la fecha actual
      const currentDate = new Date().toISOString()
      setValve({
        ...valve,
        current_flow: Number.parseFloat(formData.flow),
      })

      // Limpiar formulario
      setFormData({
        ...formData,
        flow: "",
      })
    } catch (err) {
      showMessage("ERROR", handleApiError(err, "No se pudo actualizar el valor en litros de la válvula."), "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Verificar estado de la válvula
  const isFullyOpen = () => valve.current_flow >= 180
  const isFullyClosed = () => valve.current_flow <= 0

  // Funciones de confirmación para apertura/cierre
  const confirmValveOperation = (operationType) => {
    if (!valve.is_active) {
      const action = operationType === "open" ? "abrir" : "cerrar"
      showMessage("ERROR", `No se puede ${action} la válvula porque no está activa.`)
      return
    }

    if (operationType === "open") {
      setShowConfirmOpenModal(true)
    } else {
      setShowConfirmCloseModal(true)
    }
  }

  // Reemplazar confirmFullOpen y confirmFullClose con:
  const confirmFullOpen = () => confirmValveOperation("open")
  const confirmFullClose = () => confirmValveOperation("close")

  // Manejar operaciones de apertura/cierre total
  const handleValveOperation = async (operationType) => {
    const isOpening = operationType === "open"
    const setProcessing = isOpening ? setIsProcessingOpen : setIsProcessingClose
    const setShowModal = isOpening ? setShowConfirmOpenModal : setShowConfirmCloseModal
    const targetFlow = isOpening ? 180 : 0
    const successMessage = isOpening
      ? "La válvula ha sido abierta completamente."
      : "La válvula ha sido cerrada completamente."
    const errorMessage = isOpening
      ? "No se pudo abrir completamente la válvula. Por favor, intente nuevamente."
      : "No se pudo cerrar completamente la válvula. Por favor, intente nuevamente."

    setProcessing(true)

    try {
      const updateData = { actual_flow: targetFlow }
      const token = localStorage.getItem("token")
      const api = createAPI(token)

      await api.put(`/iot/update-flow/${valve.id}`, updateData)

      // POST al endpoint externo para abrir/cerrar
      await axios.post(
        "https://mqtt-flask-api-production.up.railway.app/publicar_comando_lote",
        {
          comando: isOpening ? "abrir" : "cerrar",
          lote_id: valve.location_id
        }
      )
      // console.log(lote_id)

      setShowModal(false)
      showMessage("Éxito", successMessage, "success")

      setValve({
        ...valve,
        current_flow: targetFlow,
      })
    } catch (err) {
      setShowModal(false)
      showMessage("ERROR", handleApiError(err, errorMessage), "error")
    } finally {
      setProcessing(false)
    }
  }

  // Reemplazar handleFullOpen y handleFullClose con:
  const handleFullOpen = () => handleValveOperation("open")
  const handleFullClose = () => handleValveOperation("close")

  // Handle retry after connectivity issue
  const handleRetryConnection = () => {
    setIsConnectivityIssue(false)
    setError(null)
    setLoading(true)
    fetchAllData()
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return "Fecha no disponible"
    }
  }

  // Componente de carga
  const LoadingSpinner = ({ message }) => (
    <div>
      <NavBar />
      <div className="max-w-7xl mx-auto p-6 mt-24 bg-white rounded-lg shadow">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#365486]"></div>
        </div>
        <p className="text-center text-gray-500">{message}</p>
      </div>
    </div>
  )

  // Componente de error
  const ErrorDisplay = ({ error, isConnectivityIssue, onRetry, onBack }) => (
    <div>
      <NavBar />
      <div className="container mx-auto p-6 mt-24">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong> 
          <span className="block sm:inline">{error}</span>
          {isConnectivityIssue && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="bg-[#365486] hover:bg-[#2f4275] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Intentar nuevamente
              </button>
              <button
                onClick={onBack}
                className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Volver a la lista
              </button>
            </div>
          )}
        </div>
        {!isConnectivityIssue && (
          <div className="mt-4">
            <BackButton to="/control-IoT/valvulas" text="Volver a la lista de válvulas" />
          </div>
        )}
      </div>
    </div>
  )

  // Componente para mostrar información de la válvula
  const ValveInfoItem = ({ label, value }) => (
    <div>
      <p className="text-sm">
        <span className="font-medium text-black">{label}: </span>
        <span className="text-gray-600 font-medium">{value}</span>
      </p>
    </div>
  )

  // Renderizar información de ubicación
  const renderLocationInfo = () => {
    const { location_id, location_name } = valve

    return (
      <>
        <ValveInfoItem label="ID Propiedad" value={location_id} />
        <ValveInfoItem label="Nombre Propiedad" value={location_name} />
      </>
    )
  }

  // Renderizar botón de acción (apertura/cierre)
  const ActionButton = ({ onClick, disabled, children, processingState = false }) => (
    <button
      type="button"
      onClick={onClick}
      className={`${
        disabled ? "bg-gray-400 cursor-not-allowed" : "bg-[#365486] hover:bg-[#2f4275]"
      } text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline text-sm`}
      disabled={disabled || processingState}
    >
      {processingState ? "Procesando..." : children}
    </button>
  )

  // Componente para modal de confirmación
  const ConfirmationModal = ({ show, onCancel, onConfirm, title, message, isProcessing, confirmText }) => {
    if (!show) return null

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 text-center">
          {/* Icono de advertencia */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-orange-400 flex items-center justify-center">
              <span className="text-orange-400 text-3xl font-bold">!</span>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold mb-2">{title}</h2>

          {/* Mensaje */}
          <p className="mb-6">{message}</p>

          {/* Botones */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-8 py-2 bg-[#365486] text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-8 py-2 bg-red-600 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Reemplazar el código de carga actual con uno más compacto
  if (loading) {
    return <LoadingSpinner message="Cargando datos de la válvula..." />
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        isConnectivityIssue={isConnectivityIssue}
        onRetry={handleRetryConnection}
        onBack={() => navigate("/control-IoT/valvulas")}
      />
    )
  }

  // Reemplazar la sección de información de la válvula en el return
  return (
    <div>
      <NavBar />
      <div className="flex-1 container mx-auto px-6 pb-6 max-w-7xl shadow-xl rounded-lg bg-white mt-24">
        <div className="pt-4">
          <div className="mb-5 text-center">
            <h1 className="text-2xl font-semibold text-[#365486] mb-1">Ajuste de caudal</h1>
            <p className="text-sm text-gray-600">Modifique el caudal en litros</p>
            <div className="w-16 h-1 bg-[#365486] mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            {/* Información de la válvula */}
            <div className="bg-gray-50 rounded-lg p-5 md:w-1/3 shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium text-[#365486]">Información de la válvula</h3>
                {loadingValveInfo && (
                  <div className="flex items-center text-[#365486] text-xs">
                    <Loader className="animate-spin h-3 w-3 mr-1" />
                    <span>Cargando detalles...</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <ValveInfoItem label="ID" value={valve.id} />
                <ValveInfoItem label="Nombre" value={valve.name} />

                {loadingValveInfo ? (
                  <div className="py-2">
                    <div className="animate-pulse space-y-3 w-full">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    {renderLocationInfo()}
                    <ValveInfoItem label="Propietario" value={valve.owner} />
                    <ValveInfoItem label="Tipo de válvula" value={valve.valve_type} />
                  </>
                )}

                <ValveInfoItem label="Fecha de registro" value={formatDate(valve.registration_date || "N/A")} />

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <BackButton
                    to="/control-IoT/valvulas"
                    text="Volver a la lista de válvulas"
                    className="hover:bg-blue-50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Formulario de ajuste */}
            <div className="md:w-2/3">
              <h3 className="text-md font-medium text-[#365486] mb-3">Ajuste de caudal</h3>

              <div className="bg-gray-50 rounded-lg p-5 shadow-md border border-gray-100">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-black text-sm mr-2">Estado:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        valve.is_active
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {valve.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium text-black text-sm mr-2">Caudal actual:</span>
                    <span className="font-bold text-gray-600">
                      {valve.current_flow} {valve.flow_unit}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="font-medium text-black text-sm mr-2">Caudal maximo:</span>
                  <span className="text-gray-600">
                    {valve.max_flow} {valve.flow_unit}
                  </span>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="flow">
                      Caudal en litros (L/s) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <div className="relative flex-grow">
                        <span className="absolute left-3 top-2 text-gray-400">
                          <Search size={18} />
                        </span>
                        <input
                          type="text"
                          id="flow"
                          name="flow"
                          value={formData.flow}
                          onChange={handleInputChange}
                          className={`w-full pl-10 py-2 bg-gray-100 text-gray-700 border ${
                            flowError ? "border-red-500" : "border-gray-300"
                          } rounded-l-full focus:outline-none text-sm`}
                          placeholder="Ingrese la caudal en litros (L/s) (0-180)"
                        />
                      </div>
                      <select
                        id="flow_unit"
                        name="flow_unit"
                        value={formData.flow_unit}
                        onChange={handleInputChange}
                        className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-r-full focus:outline-none appearance-none text-sm"
                        disabled={true} // Deshabilitado porque solo hay una opción según el backend
                      >
                        {unitOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {flowError && <p className="text-[#F90000] text-xs mt-1">{flowError}</p>}
                    {sameFlowError && (
                      <p className="text-[#F90000] text-xs mt-1">
                        ERROR: El caudal que quieres registrar es el mismo caudal actual
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between mb-6">
                    <ActionButton
                      onClick={confirmFullOpen}
                      disabled={!valve.is_active || isFullyOpen()}
                      processingState={isProcessingOpen}
                    >
                      Apertura Total
                    </ActionButton>

                    <ActionButton
                      onClick={confirmFullClose}
                      disabled={!valve.is_active || isFullyClosed()}
                      processingState={isProcessingClose}
                    >
                      Cierre Total
                    </ActionButton>
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      type="submit"
                      className={`${
                        isSaving || !valve.is_active || flowError || sameFlowError || !formData.flow
                          ? "bg-gray-400"
                          : "bg-[#365486] hover:bg-[#2f4275] hover:scale-105"
                      } text-white px-6 py-2 rounded-full text-sm font-semibold h-[38px]`}
                      disabled={isSaving || !valve.is_active || flowError || sameFlowError || !formData.flow}
                    >
                      {isSaving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de información general */}
      <Modal showModal={showModal} onClose={() => setShowModal(false)} title={modalTitle} btnMessage="Aceptar">
        <p>{modalMessage}</p>
      </Modal>

      {/* Modal de éxito */}
      <Modal
        showModal={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          // Optionally navigate back to list after success
          // navigate("/control-IoT/valvulas");
        }}
        title="Éxito"
        btnMessage="Aceptar"
      >
        <p>El caudal ha sido actualizado correctamente.</p>
      </Modal>

      {/* Modal de error */}
      <Modal showModal={showErrorModal} onClose={() => setShowErrorModal(false)} title="ERROR" btnMessage="Aceptar">
        <p>{errorModalMessage}</p>
      </Modal>

      <ConfirmationModal
        show={showConfirmOpenModal}
        onCancel={() => !isProcessingOpen && setShowConfirmOpenModal(false)}
        onConfirm={handleFullOpen}
        title="¿Estás seguro?"
        message="¿Estás seguro que deseas abrir completamente la válvula a 180 litros (L/s)?"
        isProcessing={isProcessingOpen}
        confirmText="Sí, abrir!"
      />

      <ConfirmationModal
        show={showConfirmCloseModal}
        onCancel={() => !isProcessingClose && setShowConfirmCloseModal(false)}
        onConfirm={handleFullClose}
        title="¿Estás seguro?"
        message="¿Estás seguro que deseas cerrar completamente la válvula a 0 litros (L/s)?"
        isProcessing={isProcessingClose}
        confirmText="Sí, cerrar!"
      />
    </div>
  )
}

export default ValveFlowUpdate