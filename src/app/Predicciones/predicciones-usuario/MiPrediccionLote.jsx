"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import MiPrediccionLoteComponent from "../../../components/MiPrediccionLoteComponent"
import axios from "axios"
import { Brain, RefreshCw, AlertTriangle, User } from "lucide-react"
import BackButton from "../../../components/BackButton"

const MiPrediccionLote = () => {
  const { id_lot } = useParams()
  const navigate = useNavigate()
  const [predictionData, setPredictionData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("3")
  const [isGenerating, setIsGenerating] = useState(false)
  const [canGenerate, setCanGenerate] = useState(true)
  const [loteInfo, setLoteInfo] = useState(null)
  const [userDocument, setUserDocument] = useState("")
  const chartRef = useRef(null)

  // Estados para modales - siguiendo el patrón del proyecto
  const [modalMessage, setModalMessage] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false)
  const [showInsufficientDataModal, setShowInsufficientDataModal] = useState(false)

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Configurar axios con el token de autenticación
  const getAxiosConfig = () => {
    const token = localStorage.getItem("token")
    return {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  }

  // Verificar que el usuario tenga acceso al lote
  useEffect(() => {
    const verifyLotAccess = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          navigate("/login")
          return
        }

        // Obtener perfil del usuario
        const profileResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Token ${token}` },
        })
        setUserDocument(profileResponse.data.document)

        // Obtener información del lote
        const loteResponse = await axios.get(`${API_URL}/plot-lot/lots/${id_lot}`, {
          headers: { Authorization: `Token ${token}` },
        })

        // Obtener información del predio para verificar propiedad
        const predioResponse = await axios.get(`${API_URL}/plot-lot/plots/${loteResponse.data.plot}`, {
          headers: { Authorization: `Token ${token}` },
        })

        // Verificar que el usuario sea el propietario del predio
        if (predioResponse.data.owner !== profileResponse.data.document) {
          setShowAccessDeniedModal(true)
          return
        }

        // Verificar que el lote esté activo
        if (!loteResponse.data.is_activate) {
          setModalMessage("Este lote no está activo y no se pueden generar predicciones.")
          setShowModal(true)
          return
        }

        setLoteInfo({
          ...loteResponse.data,
          predioInfo: predioResponse.data,
        })
      } catch (err) {
        console.error("Error al verificar acceso al lote:", err)
        if (err.response?.status === 404) {
          setModalMessage("El lote especificado no existe.")
          setShowModal(true)
        } else if (err.response?.status === 403) {
          setShowAccessDeniedModal(true)
        } else {
          setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico")
          setShowModal(true)
        }
      }
    }

    if (id_lot) {
      verifyLotAccess()
    }
  }, [id_lot, API_URL, navigate])

  // Función para obtener predicciones existentes
  const fetchExistingPredictions = async (lotId, periodTime = null) => {
    try {
      setLoading(true)

      const response = await axios.get(`${API_URL}/ia/prediction-lot`, {
        ...getAxiosConfig(),
        params: {
          lot: lotId,
        },
      })

      if (Array.isArray(response.data) && response.data.length > 0) {
        let filteredData = response.data
        if (periodTime) {
          filteredData = response.data.filter((item) => item.period_time.toString() === periodTime.toString())
        }
        setPredictionData(filteredData)
      } else {
        setPredictionData([])
      }
    } catch (err) {
      console.error("Error al obtener predicciones:", err)
      if (err.response?.status === 403) {
        setShowAccessDeniedModal(true)
      } else {
        setModalMessage("Error al obtener las predicciones")
        setShowModal(true)
        setPredictionData([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para generar nuevas predicciones
  const generateNewPredictions = async (lotId, periodTime) => {
    try {
      setIsGenerating(true)
      setCanGenerate(false)

      const requestData = {
        lot: lotId,
        period_time: periodTime,
      }

      const response = await axios.post(`${API_URL}/ia/prediction-lot`, requestData, getAxiosConfig())

      setShowSuccessModal(true)
      // Recargar las predicciones después de generar
      await fetchExistingPredictions(lotId, periodTime)
    } catch (err) {
      console.error("Error al generar predicciones:", err)
      console.log("Error response:", err.response?.data)

      // Manejar errores específicos del backend - siguiendo el patrón del proyecto
      if (err.response?.data) {
        const errorData = err.response.data

        if (errorData.errors?.detail) {
          // Estructura: { errors: { detail: "mensaje" } }
          const errorMessage = errorData.errors.detail

          if (errorMessage.includes("predicción activa")) {
            setModalMessage(errorMessage)
            setShowModal(true)
            // Automáticamente cargar las predicciones existentes
            await fetchExistingPredictions(lotId, periodTime)
          } else if (errorMessage.includes("tiempo mínimo") || errorMessage.includes("consumo")) {
            setShowInsufficientDataModal(true)
          } else {
            setModalMessage(errorMessage)
            setShowModal(true)
          }
        } else if (errorData.detail) {
          // Estructura: { detail: "mensaje" }
          const errorMessage = errorData.detail

          if (errorMessage.includes("predicción activa")) {
            setModalMessage(errorMessage)
            setShowModal(true)
            // Automáticamente cargar las predicciones existentes
            await fetchExistingPredictions(lotId, periodTime)
          } else if (errorMessage.includes("tiempo mínimo") || errorMessage.includes("consumo")) {
            setShowInsufficientDataModal(true)
          } else {
            setModalMessage(errorMessage)
            setShowModal(true)
          }
        } else if (errorData.message) {
          // Estructura: { message: "mensaje" }
          setModalMessage(errorData.message)
          setShowModal(true)
        } else {
          setModalMessage("Error al procesar la solicitud. Verifique los datos e intente nuevamente.")
          setShowModal(true)
        }
      } else if (err.response?.status === 403) {
        setShowAccessDeniedModal(true)
      } else {
        setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico")
        setShowModal(true)
      }
    } finally {
      setIsGenerating(false)
      setCanGenerate(true)
    }
  }

  // Cargar predicciones al montar el componente
  useEffect(() => {
    if (id_lot && loteInfo) {
      fetchExistingPredictions(id_lot, selectedPeriod)
    }
  }, [id_lot, loteInfo])

  // Cargar predicciones cuando cambie el período
  useEffect(() => {
    if (id_lot && selectedPeriod && loteInfo) {
      fetchExistingPredictions(id_lot, selectedPeriod)
    }
  }, [selectedPeriod])

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod)
  }

  const handleGeneratePredictions = () => {
    generateNewPredictions(id_lot, selectedPeriod)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {/* Modal de acceso denegado */}
      <Modal
        showModal={showAccessDeniedModal}
        onClose={() => {
          setShowAccessDeniedModal(false)
          navigate("/mis-predicciones")
        }}
        title="Acceso denegado"
        btnMessage="Aceptar"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-500 mt-1" size={20} />
          <div>
            <p className="text-gray-700 mb-2">No tienes permisos para acceder a las predicciones de este lote.</p>
            <p className="text-sm text-gray-600">Solo puedes ver predicciones de tus propios lotes.</p>
          </div>
        </div>
      </Modal>

      {/* Modal de datos insuficientes */}
      <Modal
        showModal={showInsufficientDataModal}
        onClose={() => setShowInsufficientDataModal(false)}
        title="Datos insuficientes para predicción"
        btnMessage="Aceptar"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 mt-1" size={20} />
          <div>
            <p className="text-gray-700 mb-2">
              <strong>El lote no cuenta con el tiempo mínimo de un mes de consumo para realizar la predicción</strong>
            </p>
            <p className="text-sm text-gray-600">
              Para generar predicciones precisas, el lote debe tener al menos un mes de datos de consumo registrados.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal de error principal - siguiendo el patrón del proyecto */}
      <Modal showModal={showModal} onClose={() => setShowModal(false)} title="Error" btnMessage="Aceptar">
        <p>{modalMessage}</p>
      </Modal>

      {/* Modal de éxito */}
      <Modal
        showModal={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Predicciones generadas exitosamente"
        btnMessage="Aceptar"
      >
        <div className="flex items-start gap-3">
          <Brain className="text-green-500 mt-1" size={20} />
          <div>
            <p className="text-gray-700 mb-2">
              Las predicciones para{" "}
              <strong>
                {selectedPeriod} {selectedPeriod === "1" ? "mes" : "meses"}
              </strong>{" "}
              han sido generadas exitosamente.
            </p>
            <p className="text-sm text-gray-600">Los datos se han actualizado automáticamente en la gráfica.</p>
          </div>
        </div>
      </Modal>

      {/* Contenedor principal con padding top suficiente para evitar el navbar */}
      <div className="flex-1 pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Botón de regreso con espaciado adecuado */}
          <div className="mb-6">
            <BackButton to="/mis-predicciones" text="Volver a mis predicciones" />
          </div>

          {/* Header con información del lote */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <Brain className="text-blue-600" size={32} />
                  Predicción del consumo de agua para lotes del distrito
                </h1>
                <p className="text-gray-600 mt-2">Predicción de consumo de agua generada con inteligencia artificial</p>

                {loteInfo && (
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
                      <User size={14} className="text-blue-600" />
                      <span className="text-blue-800">Propietario: {userDocument}</span>
                    </div>
                    <div className="bg-green-50 px-3 py-1 rounded-lg">
                      <span className="text-green-800">ID Predio: {loteInfo.plot}</span>
                    </div>
                    <div className="bg-purple-50 px-3 py-1 rounded-lg">
                      <span className="text-purple-800">ID Lote: {id_lot}</span>
                    </div>
                    <div className="bg-orange-50 px-3 py-1 rounded-lg">
                      <span className="text-orange-800">
                        Variedad del Cultivo: {loteInfo.crop_type === 1 ? "Piscicultura" : "Agricultura"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => fetchExistingPredictions(id_lot, selectedPeriod)}
                  disabled={loading || isGenerating}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  Actualizar
                </button>
              </div>
            </div>

            {/* Indicadores de estado */}
            <div className="mt-4 flex flex-wrap gap-2">
              {predictionData.length > 0 && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Predicciones para {selectedPeriod} {selectedPeriod === "1" ? "mes" : "meses"}
                </span>
              )}

              {isGenerating && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Generando con IA...
                </span>
              )}

              {loading && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                  Cargando datos...
                </span>
              )}
            </div>
          </div>

          {/* Componente de gráfica de predicciones */}
          {loteInfo && (
            <div className="mb-6">
              <MiPrediccionLoteComponent
                predictionData={predictionData}
                isLoading={loading}
                error={null} // No pasar errores aquí para evitar duplicados
                onPeriodChange={handlePeriodChange}
                onGeneratePredictions={handleGeneratePredictions}
                selectedPeriod={selectedPeriod}
                lotId={id_lot}
                title={`PREDICCIÓN DE CONSUMO - LOTE ${id_lot}`}
                chartRef={chartRef}
                isGenerating={isGenerating}
                canGenerate={canGenerate}
              />
            </div>
          )}

          {/* Información adicional */}
          {predictionData.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Información de las Predicciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>ID Predio:</strong> {predictionData[0]?.plot}
                  </p>
                  <p>
                    <strong>ID Lote:</strong> {id_lot}
                  </p>
                  <p>
                    <strong>ID Dueño:</strong> {userDocument}
                  </p>
                  <p>
                    <strong>Período de predicción:</strong> {predictionData[0]?.period_time} meses
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Código de predicción:</strong> {predictionData[0]?.code_prediction}
                  </p>
                  <p>
                    <strong>Fecha de generación:</strong>{" "}
                    {predictionData[0]?.created_at
                      ? new Date(predictionData[0].created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "No disponible"}
                  </p>
                  <p>
                    <strong>Total de predicciones:</strong> {predictionData.length} meses
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Nota:</strong> Los datos presentados son aproximaciones y pueden variar respecto a los valores
                  reales. Por favor, consúltelos únicamente como referencia.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MiPrediccionLote
