"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import MiPrediccionLoteComponent from "../../../components/MiPrediccionLoteComponent"
import axios from "axios"
import { Brain, RefreshCw, AlertTriangle, User, Home } from "lucide-react"
import BackButton from "../../../components/BackButton"

const MiPrediccionLote = () => {
  const { id_lot } = useParams()
  const navigate = useNavigate()
  const [predictionData, setPredictionData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState("3")
  const [isGenerating, setIsGenerating] = useState(false)
  const [canGenerate, setCanGenerate] = useState(true)
  const [initialLoad, setInitialLoad] = useState(false)
  const [loteInfo, setLoteInfo] = useState(null)
  const [userDocument, setUserDocument] = useState("")
  const chartRef = useRef(null)

  // Estados para modales - siguiendo el nuevo patrón
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showNoDataModal, setShowNoDataModal] = useState(false)
  const [showPredictionExistsModal, setShowPredictionExistsModal] = useState(false)
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false)
  const [showInsufficientDataModal, setShowInsufficientDataModal] = useState(false)

  // Estados para mensajes de modales
  const [modalErrorMessage, setModalErrorMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("")

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Función helper para extraer mensajes de error
  const extractErrorMessage = (err) => {
    if (err.response?.data) {
      const errorData = err.response.data

      if (errorData.errors?.detail) {
        return errorData.errors.detail
      }

      if (errorData.errors && typeof errorData.errors === "object") {
        const errorMessages = Object.values(errorData.errors)
          .filter((msg) => msg && typeof msg === "string" && msg.trim())
          .join(". ")
        if (errorMessages) {
          return errorMessages
        }
      }

      if (errorData.message) {
        return errorData.message
      }

      if (errorData.error) {
        return errorData.error
      }
    }

    if (err.message) {
      return err.message
    }

    return "Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico"
  }

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
          setModalErrorMessage("Este lote no está activo y no se pueden generar predicciones.")
          setModalTitle("Lote inactivo")
          setShowErrorModal(true)
          return
        }

        setLoteInfo({
          ...loteResponse.data,
          predioInfo: predioResponse.data,
        })
      } catch (err) {
        console.error("Error al verificar acceso al lote:", err)
        if (err.response?.status === 404) {
          setModalErrorMessage("El lote especificado no existe.")
          setModalTitle("Lote no encontrado")
          setShowErrorModal(true)
        } else if (err.response?.status === 403) {
          setShowAccessDeniedModal(true)
        } else {
          setModalErrorMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico")
          setModalTitle("Error")
          setShowErrorModal(true)
        }
      }
    }

    if (id_lot) {
      verifyLotAccess()
    }
  }, [id_lot, API_URL, navigate])

  // Función para obtener predicciones existentes
  const fetchExistingPredictions = React.useCallback(
    async (lotId, periodTime = null) => {
      try {
        setLoading(true)
        setError(null)

        const url = `${API_URL}/ia/prediction-lot?lot=${lotId}`

        const response = await axios.get(url, getAxiosConfig())

        if (Array.isArray(response.data) && response.data.length > 0) {
          let validData = response.data
          if (periodTime) {
            validData = response.data.filter(
              (item) => item.period_time === periodTime || item.period_time === Number.parseInt(periodTime),
            )
          }

          if (validData.length > 0) {
            setPredictionData(validData)
            setCanGenerate(false)
          } else if (periodTime) {
            setPredictionData([])
            setCanGenerate(true)
            await generateNewPredictions(lotId, periodTime, true)
          } else {
            setPredictionData([])
            setCanGenerate(true)
          }
        } else {
          if (periodTime) {
            setPredictionData([])
            setCanGenerate(true)
            await generateNewPredictions(lotId, periodTime, true)
          } else {
            setPredictionData([])
            setCanGenerate(true)
          }
        }
      } catch (err) {
        console.error("Error al obtener predicciones:", err)
        const errorMessage = extractErrorMessage(err)

        if (err.response?.status === 404 && periodTime) {
          setPredictionData([])
          setCanGenerate(true)
          await generateNewPredictions(lotId, periodTime, true)
        } else if (err.response?.status === 404) {
          setPredictionData([])
          setCanGenerate(true)
        } else if (err.response?.status === 403) {
          setShowAccessDeniedModal(true)
        } else {
          setError(errorMessage)
          setModalErrorMessage(errorMessage)
          setModalTitle("Error al cargar predicciones")
          setShowErrorModal(true)
          setCanGenerate(true)
        }
        setPredictionData([])
      } finally {
        setLoading(false)
        if (!initialLoad) {
          setInitialLoad(true)
        }
      }
    },
    [API_URL, initialLoad],
  )

  // Función para generar nuevas predicciones
  const generateNewPredictions = async (lotId, periodTime, isAutoGeneration = false) => {
    try {
      setIsGenerating(true)
      setError(null)
      setCanGenerate(false)

      const requestData = {
        lot: lotId,
        period_time: Number.parseInt(periodTime),
      }

      const response = await axios.post(`${API_URL}/ia/prediction-lot`, requestData, getAxiosConfig())

      if (!isAutoGeneration) {
        setShowSuccessModal(true)
      }

      setTimeout(async () => {
        try {
          setLoading(true)
          const url = `${API_URL}/ia/prediction-lot?lot=${lotId}`
          const response = await axios.get(url, getAxiosConfig())

          if (Array.isArray(response.data) && response.data.length > 0) {
            const validData = response.data.filter(
              (item) => item.period_time === periodTime || item.period_time === Number.parseInt(periodTime),
            )

            if (validData.length > 0) {
              setPredictionData(validData)
              setCanGenerate(false)
            }
          }
        } catch (err) {
          console.error("Error al cargar predicciones después de generar:", err)
        } finally {
          setLoading(false)
        }
      }, 2000)
    } catch (err) {
      console.error("Error al generar predicciones:", err)
      const errorMessage = extractErrorMessage(err)

      if (
        errorMessage.includes("Ya existe una predicción") ||
        errorMessage.includes("already exists") ||
        errorMessage.includes("ya existe") ||
        err.response?.status === 409
      ) {
        try {
          const url = `${API_URL}/ia/prediction-lot?lot=${lotId}`
          const existingResponse = await axios.get(url, getAxiosConfig())

          if (Array.isArray(existingResponse.data) && existingResponse.data.length > 0) {
            const correctData = existingResponse.data.filter(
              (item) => item.period_time === periodTime || item.period_time === Number.parseInt(periodTime),
            )

            if (correctData.length > 0) {
              setPredictionData(correctData)
              setCanGenerate(false)
              setError(null)

              if (!isAutoGeneration) {
                setModalErrorMessage(
                  `Se encontraron ${correctData.length} predicciones existentes para ${periodTime} ${periodTime === "1" ? "mes" : "meses"}.`,
                )
                setShowPredictionExistsModal(true)
              }
            } else {
              setPredictionData([])
              setCanGenerate(true)
              if (!isAutoGeneration) {
                setShowNoDataModal(true)
              }
            }
          } else {
            setPredictionData([])
            setCanGenerate(true)
            if (!isAutoGeneration) {
              setShowNoDataModal(true)
            }
          }
        } catch (fetchErr) {
          console.error("Error al cargar predicciones existentes:", fetchErr)
          if (!isAutoGeneration) {
            setError("No se pudieron cargar las predicciones existentes")
            setModalErrorMessage("Error al cargar las predicciones existentes")
            setModalTitle("Error de carga")
            setShowErrorModal(true)
          }
          setCanGenerate(true)
        }
      } else if (errorMessage.includes("tiempo mínimo") || errorMessage.includes("consumo")) {
        if (!isAutoGeneration) {
          setShowInsufficientDataModal(true)
        }
        setCanGenerate(true)
      } else {
        if (!isAutoGeneration) {
          setError(errorMessage)
          setModalErrorMessage(errorMessage)
          setModalTitle("Error al generar predicciones")
          setShowErrorModal(true)
        }
        setCanGenerate(true)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Cargar predicciones al montar el componente
  useEffect(() => {
    const fetchOnMount = async () => {
      if (id_lot && loteInfo) {
        await fetchExistingPredictions(id_lot, selectedPeriod)
      }
    }
    fetchOnMount()
  }, [id_lot, loteInfo, fetchExistingPredictions])

  // Manejar cambio de período de predicción
  const handlePeriodChange = async (newPeriod) => {
    setSelectedPeriod(newPeriod)

    setPredictionData([])
    setCanGenerate(true)
    setError(null)

    setShowErrorModal(false)
    setShowPredictionExistsModal(false)
    setShowNoDataModal(false)

    if (id_lot) {
      try {
        setLoading(true)

        const url = `${API_URL}/ia/prediction-lot?lot=${id_lot}`
        const response = await axios.get(url, getAxiosConfig())

        if (Array.isArray(response.data) && response.data.length > 0) {
          const correctPeriodData = response.data.filter(
            (item) => item.period_time === newPeriod || item.period_time === Number.parseInt(newPeriod),
          )

          if (correctPeriodData.length > 0) {
            setPredictionData(correctPeriodData)
            setCanGenerate(false)
          } else {
            setPredictionData([])
            setCanGenerate(true)
            await generateNewPredictions(id_lot, newPeriod, true)
          }
        } else {
          setPredictionData([])
          setCanGenerate(true)
          await generateNewPredictions(id_lot, newPeriod, true)
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setPredictionData([])
          setCanGenerate(true)
          await generateNewPredictions(id_lot, newPeriod, true)
        } else {
          setPredictionData([])
          setCanGenerate(true)
          const errorMessage = extractErrorMessage(err)
          setError(errorMessage)
          setModalErrorMessage(errorMessage)
          setModalTitle("Error al cargar predicciones")
          setTimeout(() => {
            setShowErrorModal(true)
          }, 500)
        }
      } finally {
        setLoading(false)
      }
    }
  }

  // Manejar generación manual de nuevas predicciones
  const handleGeneratePredictions = () => {
    generateNewPredictions(id_lot, selectedPeriod, false)
  }

  // Función para refrescar datos
  const handleRefresh = () => {
    fetchExistingPredictions(id_lot, selectedPeriod)
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

      {/* Modal de éxito */}
      <Modal
        showModal={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Predicciones del lote generadas exitosamente"
        btnMessage="Aceptar"
      >
        <div className="flex items-start gap-3">
          <Brain className="text-green-500 mt-1" size={20} />
          <div>
            <p className="text-gray-700 mb-2">
              Las predicciones del lote para{" "}
              <strong>
                {selectedPeriod} {selectedPeriod === "1" ? "mes" : "meses"}
              </strong>{" "}
              han sido generadas exitosamente.
            </p>
            <p className="text-sm text-gray-600">Los datos se han actualizado automáticamente en la gráfica.</p>
          </div>
        </div>
      </Modal>

      {/* Modal de error general */}
      <Modal
        showModal={showErrorModal}
        onClose={() => {
          setShowErrorModal(false)
          setError(null)
          setModalErrorMessage("")
          if (modalErrorMessage.includes("sesión") || modalTitle.includes("no encontrado")) {
            navigate("/mis-predicciones")
          }
        }}
        title={modalTitle || "Error en la conexión"}
        btnMessage="Cerrar"
      >
        <div className="flex items-start gap-3">
          <div>
            <p className="text-gray-700 mb-2">
              {modalErrorMessage || "Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico"}
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal de predicción ya existente */}
      <Modal
        showModal={showPredictionExistsModal}
        onClose={() => {
          setShowPredictionExistsModal(false)
          setModalErrorMessage("")
        }}
        title="Predicciones encontradas"
        btnMessage="Ver gráfica"
      >
        <div className="flex items-start gap-3">
          <Brain className="text-green-500 mt-1" size={20} />
          <div>
            <p className="text-gray-700 mb-2">
              ✅ Ya existen predicciones para este lote con el período de {selectedPeriod}{" "}
              {selectedPeriod === "1" ? "mes" : "meses"}.
            </p>
            <p className="text-sm text-gray-600 mb-2">{modalErrorMessage}</p>
            <p className="text-sm text-green-600 font-medium">
              Las predicciones se han cargado y están listas para visualizar.
            </p>
            {predictionData.length > 0 && (
              <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                <p>📊 Datos cargados: {predictionData.length} registros</p>
                <p>
                  📅 Período: {predictionData[0]?.period_time} {predictionData[0]?.period_time === 1 ? "mes" : "meses"}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de sin datos */}
      <Modal
        showModal={showNoDataModal}
        onClose={() => setShowNoDataModal(false)}
        title="No hay predicciones disponibles"
        btnMessage="Entendido"
      >
        <div className="flex items-start gap-3">
          <Brain className="text-blue-500 mt-1" size={20} />
          <div>
            <p className="text-gray-700 mb-3">
              No se encontraron predicciones para este período ({selectedPeriod}{" "}
              {selectedPeriod === "1" ? "mes" : "meses"}).
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Se generará automáticamente una nueva predicción al seleccionar un período, o puedes usar el botón
              "Generar Predicción" cuando esté habilitado.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Las predicciones se generan utilizando modelos de inteligencia artificial basados
                en datos históricos de consumo.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Contenedor principal */}
      <div className="flex-1 pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Botón de regreso */}
          <div className="mb-6">
            <BackButton to="/mis-predicciones" text="Volver a mis predicciones" />
          </div>

          {/* Header con información del lote */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <Home className="text-blue-600" size={32} />
                  Predicciones IA - Lote {id_lot}
                </h1>
                <p className="text-gray-600 mt-2">
                  Predicciones de consumo del lote generadas con inteligencia artificial
                </p>

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
                  onClick={handleRefresh}
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
                  Predicciones disponibles
                </span>
              )}

              {predictionData.length === 0 && !loading && initialLoad && (
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  <Brain size={12} />
                  Sin predicciones - Generación automática disponible
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

              {error && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  <AlertTriangle size={12} />
                  Error en predicciones
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
                error={error}
                onPeriodChange={handlePeriodChange}
                onGeneratePredictions={handleGeneratePredictions}
                selectedPeriod={selectedPeriod}
                lotId={id_lot}
                title={`PREDICCIÓN DE CONSUMO - LOTE ${id_lot}`}
                chartRef={chartRef}
                isGenerating={isGenerating}
                canGenerate={canGenerate}
                showNoDataMessage={predictionData.length === 0 && initialLoad && !loading}
              />
            </div>
          )}

          {/* Información adicional */}
          {predictionData.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Información de las Predicciones del Lote</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Predio:</strong> {predictionData[0]?.plot || "No disponible"}
                  </p>
                  <p>
                    <strong>Propietario:</strong> {userDocument}
                  </p>
                  <p>
                    <strong>Período de predicción:</strong> {predictionData[0]?.period_time}{" "}
                    {predictionData[0]?.period_time === 1 ? "mes" : "meses"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Código de predicción:</strong> {predictionData[0]?.code_prediction || "No disponible"}
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
                    <strong>Total de predicciones:</strong> {predictionData.length} registros
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
