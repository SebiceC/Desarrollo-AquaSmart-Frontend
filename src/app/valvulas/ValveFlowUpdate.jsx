"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../../components/NavBar"
import Modal from "../../components/Modal"
import BackButton from "../../components/BackButton"
import { Search } from "lucide-react"
import axios from "axios"

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

  // Valve data state
  const [valve, setValve] = useState({
    id: "",
    name: "",
    assigned_plot: "",
    plot_name: "",
    property: "",
    owner: "", // Añadimos el campo owner para el dueño del predio
    is_active: false,
    current_flow: 0,
    max_flow: 0,
    flow_unit: "L/min",
    valve_type: "",
    last_update: "",
  })

  // Form state
  const [formData, setFormData] = useState({
    flow: "",
    flow_unit: "L/min",
    comments: "",
  })

  // Validation states
  const [flowError, setFlowError] = useState("")
  const [sameFlowError, setSameFlowError] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState("")
  const [errorModalMessage, setErrorModalMessage] = useState("")

  // Units options
  const unitOptions = [
    { value: "L/min", label: "L/min" },
    { value: "m³/s", label: "m³/s" },
    { value: "m³/h", label: "m³/h" },
  ]

  // Simulate connectivity issues randomly (for testing)
  const simulateConnectivityIssue = () => {
    // 10% chance of connectivity issue for demonstration
    return Math.random() < 0.1
  }

  // Simulate save error randomly (for testing)
  const simulateSaveError = () => {
    // 10% chance of save error for demonstration
    return Math.random() < 0.1
  }

  const API_URL = import.meta.env.VITE_APP_API_URL

  useEffect(() => {
    const fetchValveData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No hay una sesión activa. Por favor, inicie sesión.")
          setLoading(false)
          return
        }

        // Simular problemas de conectividad (solo para pruebas)
        if (simulateConnectivityIssue()) {
          setIsConnectivityIssue(true)
          setError("Problema de conectividad con la válvula. Por favor, intente nuevamente.")
          setLoading(false)
          return
        }

        // Obtener la lista de predios primero
        const plotsResponse = await axios.get(`${API_URL}/plot-lot/plots/list`, {
          headers: { Authorization: `Token ${token}` },
        })

        console.log("Predios obtenidos:", plotsResponse.data)

        // Obtener la lista de dispositivos IoT desde la API
        const devicesResponse = await axios.get(`${API_URL}/iot/iot-devices`, {
          headers: { Authorization: `Token ${token}` },
        })

        console.log("Dispositivos IoT obtenidos:", devicesResponse.data)

        // Buscar el dispositivo específico por ID
        const deviceData = devicesResponse.data.find((device) => device.iot_id === id_valve)

        if (!deviceData) {
          setError("No se encontró la válvula solicitada.")
          setLoading(false)
          return
        }

        // Buscar el predio asociado para obtener su nombre
        const associatedPlot = plotsResponse.data.find((plot) => plot.id_plot === deviceData.id_plot)

        // Formatear los datos de la válvula
        const formattedValve = {
          id: deviceData.iot_id,
          name: deviceData.name || "Sin nombre",
          assigned_plot: deviceData.id_plot || "N/A",
          plot_name: associatedPlot ? associatedPlot.plot_name : "N/A",
          is_active: deviceData.is_active,
          current_flow: deviceData.current_flow || 0,
          max_flow: deviceData.max_flow || 100,
          flow_unit: deviceData.flow_unit || "L/min",
          valve_type: deviceData.device_type_name || deviceData.type || "N/A",
          registration_date: deviceData.registration_date || new Date().toISOString(),
          last_update: deviceData.last_update || new Date().toISOString(),
          property: associatedPlot ? associatedPlot.property : "N/A",
          owner: associatedPlot ? associatedPlot.owner : "N/A", // Añadimos el owner del predio
        }

        console.log("Datos de válvula formateados:", formattedValve)
        setValve(formattedValve)
        setFormData({
          ...formData,
          flow_unit: formattedValve.flow_unit,
        })
        setLoading(false)
      } catch (err) {
        console.error("Error al cargar los datos de la válvula:", err)

        // Extract detailed error message from response
        let errorMessage = "No se pudieron cargar los datos de la válvula."

        if (err.response) {
          if (err.response.status === 403) {
            errorMessage = "No tiene permisos para acceder a esta válvula."
            if (err.response.data?.detail) {
              errorMessage = err.response.data.detail
            }
          } else if (err.response.data?.detail) {
            errorMessage = err.response.data.detail
          } else if (err.response.data?.message) {
            errorMessage = err.response.data.message
          }
        } else if (err.request) {
          errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet."
        } else {
          errorMessage = `Error de configuración: ${err.message}`
        }

        setError(errorMessage)
        setLoading(false)
      }
    }

    fetchValveData()
  }, [id_valve, API_URL])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === "flow") {
      // Clear previous errors
      setFlowError("")
      setSameFlowError(false)

      // Validate if it's a number
      if (value && isNaN(value)) {
        setFlowError("ERROR: El tipo de dato no es válido (solo números)")
        return
      }

      // Validate if it exceeds maximum flow
      if (Number.parseFloat(value) > valve.max_flow) {
        setFlowError(`ERROR: El valor ingresado no es permitido, valor máximo es ${valve.max_flow}`)
      }

      // Check if it's the same as current flow
      if (Number.parseFloat(value) === valve.current_flow) {
        setSameFlowError(true)
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    // Validate if valve is active
    if (!valve.is_active) {
      openErrorModal("No se puede actualizar el caudal porque la válvula no está activa.")
      setIsSaving(false)
      return
    }

    // Validate if flow is provided
    if (!formData.flow) {
      setFlowError("ERROR: El caudal es requerido")
      setIsSaving(false)
      return
    }

    // Validate if flow is the same as current
    if (Number.parseFloat(formData.flow) === valve.current_flow) {
      setSameFlowError(true)
      setIsSaving(false)
      return
    }

    // Validate if flow exceeds maximum
    if (Number.parseFloat(formData.flow) > valve.max_flow) {
      setFlowError(`ERROR: El valor ingresado no es permitido, valor máximo es ${valve.max_flow}`)
      setIsSaving(false)
      return
    }

    try {
      // Preparar los datos para enviar al backend (cuando esté disponible)
      const updateData = {
        iot_id: valve.id,
        current_flow: Number.parseFloat(formData.flow),
        flow_unit: formData.flow_unit,
        comments: formData.comments,
      }

      console.log("Datos a enviar al backend (cuando esté disponible):", updateData)

      // Por ahora, simulamos la respuesta exitosa
      // TODO: Cuando el backend esté listo, reemplazar con la llamada real a la API
      // const token = localStorage.getItem("token")
      // const response = await axios.put(`${API_URL}/iot/valve-flow/${valve.id}`, updateData, {
      //   headers: { Authorization: `Token ${token}` },
      // })

      // Simulamos un retraso para la respuesta
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check for connectivity issues (solo para simulación)
      if (simulateConnectivityIssue()) {
        setErrorModalMessage(
          "Problema de conectividad con la válvula. No se pudo ajustar el caudal. Por favor, intente nuevamente o contacte a soporte técnico.",
        )
        setShowErrorModal(true)
        setIsSaving(false)
        return
      }

      // Check for save errors (solo para simulación)
      if (simulateSaveError()) {
        setErrorModalMessage(
          "Error al guardar los cambios. Por favor, intente nuevamente o contacte a soporte técnico si el problema persiste.",
        )
        setShowErrorModal(true)
        setIsSaving(false)
        return
      }

      // Show success message
      setModalTitle("Éxito")
      setModalMessage("El caudal ha sido actualizado correctamente.")
      setShowSuccessModal(true)

      // Update local valve data
      setValve({
        ...valve,
        current_flow: Number.parseFloat(formData.flow),
        flow_unit: formData.flow_unit,
        last_update: new Date().toISOString(),
      })

      // Clear form
      setFormData({
        ...formData,
        flow: "",
        comments: "",
      })
    } catch (err) {
      console.error("Error al actualizar el caudal:", err)

      let errorMessage = "No se pudo actualizar el caudal de la válvula."

      if (err.response) {
        if (err.response.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message
        }
      }

      setErrorModalMessage(errorMessage)
      setShowErrorModal(true)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle full open
  const handleFullOpen = async () => {
    if (!valve.is_active) {
      openErrorModal("No se puede abrir la válvula porque no está activa.")
      return
    }

    try {
      // Preparar los datos para enviar al backend (cuando esté disponible)
      const updateData = {
        iot_id: valve.id,
        current_flow: valve.max_flow,
        flow_unit: valve.flow_unit,
        comments: "Apertura total de válvula",
      }

      console.log("Datos para apertura total (cuando el backend esté disponible):", updateData)

      // Simulamos un retraso para la respuesta
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check for connectivity issues (solo para simulación)
      if (simulateConnectivityIssue()) {
        setErrorModalMessage(
          "Problema de conectividad con la válvula. No se pudo abrir completamente. Por favor, intente nuevamente o contacte a soporte técnico.",
        )
        setShowErrorModal(true)
        return
      }

      // Show success message
      setModalTitle("Éxito")
      setModalMessage("La válvula ha sido abierta completamente.")
      setShowSuccessModal(true)

      // Update local valve data
      setValve({
        ...valve,
        current_flow: valve.max_flow,
        last_update: new Date().toISOString(),
      })
    } catch (err) {
      console.error("Error al abrir completamente la válvula:", err)
      setErrorModalMessage("No se pudo abrir completamente la válvula. Por favor, intente nuevamente.")
      setShowErrorModal(true)
    }
  }

  // Handle full close
  const handleFullClose = async () => {
    if (!valve.is_active) {
      openErrorModal("No se puede cerrar la válvula porque no está activa.")
      return
    }

    try {
      // Preparar los datos para enviar al backend (cuando esté disponible)
      const updateData = {
        iot_id: valve.id,
        current_flow: 0,
        flow_unit: valve.flow_unit,
        comments: "Cierre total de válvula",
      }

      console.log("Datos para cierre total (cuando el backend esté disponible):", updateData)

      // Simulamos un retraso para la respuesta
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check for connectivity issues (solo para simulación)
      if (simulateConnectivityIssue()) {
        setErrorModalMessage(
          "Problema de conectividad con la válvula. No se pudo cerrar completamente. Por favor, intente nuevamente o contacte a soporte técnico.",
        )
        setShowErrorModal(true)
        return
      }

      // Show success message
      setModalTitle("Éxito")
      setModalMessage("La válvula ha sido cerrada completamente.")
      setShowSuccessModal(true)

      // Update local valve data
      setValve({
        ...valve,
        current_flow: 0,
        last_update: new Date().toISOString(),
      })
    } catch (err) {
      console.error("Error al cerrar completamente la válvula:", err)
      setErrorModalMessage("No se pudo cerrar completamente la válvula. Por favor, intente nuevamente.")
      setShowErrorModal(true)
    }
  }

  // Handle retry after connectivity issue
  const handleRetryConnection = () => {
    setIsConnectivityIssue(false)
    setError(null)
    setLoading(true)

    // La reconexión se manejará automáticamente en el useEffect
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

  if (error) {
    return (
      <div>
        <NavBar />
        <div className="container mx-auto p-6 mt-24">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            {isConnectivityIssue && (
              <div className="mt-4">
                <button
                  onClick={handleRetryConnection}
                  className="bg-[#365486] hover:bg-[#2f4275] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Intentar nuevamente
                </button>
                <button
                  onClick={() => navigate("/control-IoT/valvulas")}
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
  }

  return (
    <div>
      <NavBar />
      <div className="flex-1 container mx-auto px-6 pb-6 max-w-7xl shadow-xl rounded-lg bg-white mt-24">
        <div className="pt-4">
          <div className="mb-5 text-center">
            <h1 className="text-2xl font-semibold text-[#365486] mb-1">Ajuste del caudal</h1>
            <p className="text-sm text-gray-600">Modifique el caudal de la válvula seleccionada</p>
            <div className="w-16 h-1 bg-[#365486] mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            {/* Información de la válvula */}
            <div className="bg-gray-50 rounded-lg p-5 md:w-1/3 shadow-md border border-gray-100">
              <h3 className="text-md font-medium text-[#365486] mb-3">Información de la válvula</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-black">ID: </span>
                    <span className="text-gray-600 font-medium">{valve.id}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-black">Nombre: </span>
                    <span className="text-gray-600 font-medium">{valve.name}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-black">ID Predio: </span>
                    <span className="text-gray-600 font-medium">{valve.assigned_plot}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-black">Nombre Predio: </span>
                    <span className="text-gray-600 font-medium">{valve.plot_name}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-black">Propietario: </span>
                    <span className="text-gray-600 font-medium">{valve.owner}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-black">Tipo de válvula: </span>
                    <span className="text-gray-600 font-medium">{valve.valve_type}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-black">Última actualización: </span>
                    <span className="text-gray-600 font-medium">{formatDate(valve.last_update)}</span>
                  </p>
                </div>
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
                  <span className="font-medium text-black text-sm mr-2">Caudal máximo:</span>
                  <span className="text-gray-600">
                    {valve.max_flow} {valve.flow_unit}
                  </span>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="flow">
                      Caudal <span className="text-red-500">*</span>
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
                          placeholder="Ingrese el nuevo caudal"
                        />
                      </div>
                      <select
                        id="flow_unit"
                        name="flow_unit"
                        value={formData.flow_unit}
                        onChange={handleInputChange}
                        className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-r-full focus:outline-none appearance-none text-sm"
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
                    <button
                      type="button"
                      onClick={handleFullOpen}
                      className="bg-[#365486] hover:bg-[#2f4275] text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline text-sm"
                      disabled={!valve.is_active}
                    >
                      Apertura Total
                    </button>

                    <button
                      type="button"
                      onClick={handleFullClose}
                      className="bg-[#365486] hover:bg-[#2f4275] text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline text-sm"
                      disabled={!valve.is_active}
                    >
                      Cierre Total
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comments">
                      Comentarios (Opcional)
                    </label>
                    <textarea
                      id="comments"
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg focus:outline-none text-sm"
                      placeholder="Comentarios u observaciones"
                      maxLength={500}
                      rows={3}
                    ></textarea>
                    <p className="text-gray-500 text-xs text-right mt-1">{formData.comments.length}/500 caracteres</p>
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

          {/* Botón de regreso */}
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
    </div>
  )
}

export default ValveFlowUpdate

