"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Modal from "../../../components/Modal" // Ajusta la ruta si es necesario
import ConfirmationModal from "../../../components/ConfirmationModal" // Ajusta la ruta si es necesario

const ActivationRequestModal = ({ showModal, onClose, lote, onSuccess, API_URL }) => {
  const [caudal, setCaudal] = useState("")
  const [observations, setObservations] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasValve, setHasValve] = useState(true)
  const [loadingIot, setLoadingIot] = useState(true)
  const [maxFlow, setMaxFlow] = useState(180) // Valor máximo por defecto según requerimiento

  // Estados para los modales adicionales
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showConnectionErrorModal, setShowConnectionErrorModal] = useState(false) // Modal de conexión

  // ID específico para Válvula 4"
  const VALVE_4_ID = "06"

  useEffect(() => {
    const fetchIotDeviceAndValve = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No hay una sesión activa. Por favor, inicie sesión.")
          setLoadingIot(false)
          return
        }

        const loteId = lote.id_lot || lote.id

        const devicesResponse = await axios.get(`${API_URL}/iot/iot-devices`, {
          headers: { Authorization: `Token ${token}` },
        })

        const devices = devicesResponse.data
        const device = devices.find((dev) => dev.id_lot === loteId && dev.device_type === VALVE_4_ID)

        if (!device) {
          setError("No se encontró un dispositivo IoT asociado al lote seleccionado.")
          setHasValve(false)
          setLoadingIot(false)
          return
        }

        // Verificar si tiene válvula asignada y obtener el caudal máximo
        setHasValve(true)
        if (device.max_flow) {
          setMaxFlow(device.max_flow)
        }
        setLoadingIot(false)
      } catch (error) {
        console.error("Error al obtener datos de IoT:", error)
        setShowConnectionErrorModal(true) // Mostrar el modal de error de conexión
        setLoadingIot(false)
      }
    }

    if (showModal) {
      fetchIotDeviceAndValve()
    }
  }, [showModal, lote, API_URL, VALVE_4_ID])

  const validateAndProceed = () => {
    // Validar que el campo de caudal no esté vacío
    if (!caudal.trim()) {
      setError("El campo de caudal es obligatorio.")
      return
    }

    // Validar que el caudal sea un número válido
    const caudalValue = Number.parseFloat(caudal)
    if (isNaN(caudalValue) || caudalValue < 1 || caudalValue > 180) {
      setError("El valor ingresado no corresponde, el rango establecido es entre 1 y 180.")
      return
    }

    // Validación de las observaciones: debe tener mínimo 5 caracteres si se proporciona
    if (observations.trim() !== "" && observations.trim().length < 5) {
      setError("Las observaciones deben tener al menos 5 caracteres.")
      return
    }

    // Verificar si tiene válvula asignada
    if (!hasValve) {
      setShowInfoModal(true)
      return
    }

    // Mostrar modal de confirmación
    setShowConfirmModal(true)
  }

  // Modificar la función handleSubmit para usar la URL correcta
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No hay una sesión activa. Por favor, inicie sesión.")
        setIsSubmitting(false)
        return
      }

      const loteId = lote.id_lot || lote.id

      // Enviamos la solicitud al backend con la URL correcta y el formato adecuado
      await axios.post(
        `${API_URL}/communication/flow-requests/activate/create`,
        {
          type: "Solicitud",
          lot: loteId,
          flow_request_type: "Activación de Caudal",
          requested_flow: Number.parseFloat(caudal),
          observations: observations.trim(),
        },
        { headers: { Authorization: `Token ${token}` } },
      )

      // Si la solicitud es exitosa
      onSuccess("Solicitud de activación enviada correctamente.")
      onClose()
    } catch (error) {
      console.error("Error al enviar la solicitud de activación:", error)

      if (error.response?.data) {
        // Si el backend devuelve un error
        const responseData = error.response.data

        // Manejar el caso específico de solicitud en curso
        if (responseData.error && responseData.error.message) {
          try {
            // Intentar extraer el mensaje de error de la estructura anidada
            const errorMessage = responseData.error.message

            // Verificar si contiene el mensaje específico de solicitud en curso
            if (errorMessage.includes("ya cuenta con una solicitud de activación de caudal en curso")) {
              setError("El lote elegido ya cuenta con una solicitud de activación de caudal en curso.")
              setIsSubmitting(false)
              return
            }

            // Intentar parsear el mensaje JSON si es posible
            if (errorMessage.includes("ErrorDetail")) {
              // Extraer el mensaje de error usando expresiones regulares
              const match = errorMessage.match(/string='([^']+)'/)
              if (match && match[1]) {
                setError(match[1])
                setIsSubmitting(false)
                return
              }
            }
          } catch (parseError) {
            console.error("Error al parsear el mensaje de error:", parseError)
          }
        }

        // Manejar el caso específico de solicitud en curso con la nueva estructura
        if (responseData.errors && responseData.errors.non_field_errors) {
          if (responseData.errors.non_field_errors.includes("solicitud de activación de caudal en curso")) {
            setError("El lote elegido ya cuenta con una solicitud de activación de caudal en curso.")
            setIsSubmitting(false)
            return
          }
          // Para otros errores en non_field_errors
          setError(responseData.errors.non_field_errors)
          setIsSubmitting(false)
          return
        }

        // Comprobamos si hay un array de errores y mostramos todos
        if (responseData.error && Array.isArray(responseData.error)) {
          setError(responseData.error.join(", ")) // Unimos los mensajes de error con coma
        } else if (responseData.requested_flow) {
          // Manejar error específico del campo requested_flow
          setError(`Error en caudal: ${responseData.requested_flow[0]}`)
        } else if (responseData.lot) {
          // Manejar error específico del campo lot
          setError(`Error en lote: ${responseData.lot[0]}`)
        } else if (responseData.non_field_errors) {
          // Manejar errores generales
          setError(responseData.non_field_errors[0])
        } else {
          setError("Error al procesar la solicitud. Verifique los datos e intente nuevamente.")
        }
      } else {
        // Si no hay respuesta de backend, mostrar un error general de conexión
        setError("ERROR. Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.")
      }

      setIsSubmitting(false)
    }
  }

  if (!showModal) return null

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[400px] z-50">
          {/* Título */}
          <h2 className="text-xl font-bold mb-4">ACTIVACIÓN DE CAUDAL</h2>

          {/* Información del lote */}
          <div className="mb-4 text-left">
            <p>
              <span className="font-semibold">ID Lote:</span> {lote.id_lot}
            </p>
            <p>
              <span className="font-semibold">ID Predio:</span> {lote.plot}
            </p>
          </div>

          {/* Cargando información */}
          {loadingIot ? (
            <div className="text-gray-500 text-sm mb-4">Cargando información del dispositivo...</div>
          ) : (
            <>
              {/* Campo de caudal */}
              <div className="mb-4 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Caudal solicitado (L/seg):</label>
                <input
                  type="number"
                  value={caudal}
                  onChange={(e) => setCaudal(e.target.value)}
                  className={`w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]`}
                  placeholder="Ingrese el caudal deseado (1-180)"
                  step="0.1"
                  min="1"
                  max="180"
                />
                {error && error.includes("rango establecido") && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              {/* Campo de observaciones */}
              <div className="mb-4 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones:</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className={`w-full px-3 py-2 border ${error && error.includes("observaciones") ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]`}
                  rows={4}
                  placeholder="Ingrese los detalles de la solicitud (opcional)"
                  maxLength={300}
                ></textarea>
              </div>
            </>
          )}

          {/* Mostrar errores */}
          {error && !error.includes("rango establecido") && !error.includes("observaciones") && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mt-2 text-sm text-left">
              <p className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="mt-6 flex justify-between">
            <button onClick={onClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
              Volver
            </button>
            <button
              onClick={validateAndProceed}
              disabled={isSubmitting || loadingIot}
              className="bg-[#365486] text-white px-4 py-2 rounded-lg disabled:bg-opacity-70"
            >
              {isSubmitting ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Información para lote sin válvula */}
      <Modal
        showModal={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Solicitud no permitida"
        btnMessage="Entendido"
      >
        <p>El lote no cuenta con una válvula 4" asignada, no se puede realizar la solicitud.</p>
      </Modal>

      {/* Modal de Confirmación */}
      <ConfirmationModal
        showModal={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false)
          handleSubmit()
        }}
        message={`¿Estás seguro que deseas activar el caudal de tu lote con un valor de ${caudal} L/seg?`}
      />

      {/* Modal de error de conexión */}
      <Modal
        showModal={showConnectionErrorModal}
        onClose={() => setShowConnectionErrorModal(false)}
        title="ERROR"
        btnMessage="Entendido"
      >
        <p>Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.</p>
      </Modal>
    </>
  )
}

export default ActivationRequestModal
