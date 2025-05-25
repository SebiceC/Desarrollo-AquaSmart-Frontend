"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Calendar, ChevronDown, Brain } from "lucide-react"
import Modal from "./Modal"

const MiPrediccionLoteComponent = ({
  predictionData = [],
  isLoading = false,
  error = null,
  onPeriodChange = () => {},
  onGeneratePredictions = () => {},
  selectedPeriod = "3",
  lotId = "",
  title = "PREDICCIÓN DE CONSUMO",
  chartRef,
  isGenerating = false,
  canGenerate = true,
}) => {
  const localChartRef = useRef(null)
  const actualChartRef = chartRef || localChartRef

  const [showPeriodSelector, setShowPeriodSelector] = useState(false)
  const [showPredictionErrorModal, setShowPredictionErrorModal] = useState(false)
  const [showNoDataModal, setShowNoDataModal] = useState(false)

  // Opciones de períodos de predicción (1, 3, 6 meses según requerimiento)
  const predictionPeriods = {
    "1": { label: "1 mes", months: 1 },
    "3": { label: "3 meses", months: 3 },
    "6": { label: "6 meses", months: 6 },
  }

  // Procesar datos de predicción para el gráfico
  const processedData = useMemo(() => {
    if (!predictionData || predictionData.length === 0) {
      return []
    }

    try {
      const sortedData = [...predictionData].sort((a, b) => {
        return new Date(a.date_prediction) - new Date(b.date_prediction)
      })

      const result = sortedData.map((item) => {
        const date = new Date(item.date_prediction)
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

        return {
          name: `${months[date.getMonth()]} ${date.getFullYear()}`,
          flowRate: Number.parseFloat(item.consumption_prediction || 0),
          timestamp: item.date_prediction,
          originalData: item,
        }
      })

      return result
    } catch (err) {
      console.error("Error procesando datos de predicción:", err)
      return []
    }
  }, [predictionData])

  // Solo mostrar error si realmente hay un error y no hay datos
  useEffect(() => {
    if (error && processedData.length === 0) {
      setShowPredictionErrorModal(true)
    }
  }, [error, processedData.length])

  const handlePeriodChange = (period, e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }

    try {
      setShowPeriodSelector(false)
      onPeriodChange(period)
    } catch (err) {
      console.error("Error al cambiar el período de predicción:", err)
    }
  }

  const handleGeneratePredictions = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }

    onGeneratePredictions()
  }

  const togglePeriodSelector = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }

    setShowPeriodSelector(!showPeriodSelector)
  }

  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toFixed(0)
  }

  // Calcular estadísticas
  const statistics = useMemo(() => {
    if (processedData.length === 0) return null

    const values = processedData.map((item) => item.flowRate)
    const average = values.reduce((acc, val) => acc + val, 0) / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    return { average, max, min }
  }, [processedData])

  useEffect(() => {
    return () => {
      setShowPeriodSelector(false)
      setShowPredictionErrorModal(false)
      setShowNoDataModal(false)
    }
  }, [])

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md p-6 md:p-10 w-full max-w-4xl mx-auto">
      {/* Modales */}
      <Modal
        showModal={showPredictionErrorModal}
        onClose={() => setShowPredictionErrorModal(false)}
        title="Error"
        btnMessage="Aceptar"
      >
        <p>
          {error?.includes("conexión")
            ? "Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico"
            : `¡Ocurrió un error al momento de generar la predicción! ${error || "Error desconocido"}. Vuelve a intentarlo más tarde o ponte en contacto con soporte.`}
        </p>
      </Modal>

      <Modal
        showModal={showNoDataModal}
        onClose={() => setShowNoDataModal(false)}
        title="Sin datos de predicción"
        btnMessage="Aceptar"
      >
        <p>
          No hay datos de predicción disponibles para el período seleccionado. Selecciona un período y presiona
          "Predecir".
        </p>
      </Modal>

      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-center text-gray-800">{title}</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          {/* Selector de período */}
          <div className="relative mb-4 sm:mb-0">
            <button
              onClick={togglePeriodSelector}
              type="button"
              className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              disabled={isLoading || isGenerating}
            >
              <Calendar size={16} />
              <span>Predicción: {predictionPeriods[selectedPeriod].label}</span>
              <ChevronDown size={16} />
            </button>

            {showPeriodSelector && (
              <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-full">
                {Object.entries(predictionPeriods).map(([key, period]) => (
                  <button
                    key={key}
                    type="button"
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedPeriod === key ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                    }`}
                    onClick={(e) => handlePeriodChange(key, e)}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del lote y botón de generar */}
          <div className="flex items-center gap-4">
            {lotId && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm">
                <span className="font-medium">Lote: {lotId}</span>
              </div>
            )}

            <button
              onClick={handleGeneratePredictions}
              disabled={!canGenerate || isGenerating || isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                canGenerate && !isGenerating && !isLoading
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Predecir
                </>
              ) : (
                <>
                  <Brain size={16} />
                  Predecir
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nota informativa */}
        {!isLoading && !error && processedData.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Nota:</strong> Los datos presentados son aproximaciones y pueden variar respecto a los valores
                  reales. Por favor, consultelos únicamente como referencia.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenedor de la gráfica */}
      <div className="h-64 sm:h-80 mt-6" ref={actualChartRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Generando predicción con IA...</p>
            </div>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Brain className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">No hay predicción disponible</p>
              <p className="text-sm text-gray-400">Selecciona un período y presiona "Predecir"</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: "#E5E7EB" }}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickLine={{ stroke: "#E5E7EB" }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                axisLine={{ stroke: "#E5E7EB" }}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickLine={{ stroke: "#E5E7EB" }}
                domain={["auto", "auto"]}
                label={{ value: "Litros (L)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "flowRate") {
                    return [`${value.toLocaleString()} L`, "Consumo Predicho"]
                  }
                  return [value, name]
                }}
                labelFormatter={(value) => `${value}`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="flowRate"
                stroke="#2563EB"
                strokeWidth={3}
                strokeDasharray="8 8"
                dot={{ stroke: "#2563EB", strokeWidth: 2, r: 5, fill: "white" }}
                activeDot={{ stroke: "#1D4ED8", strokeWidth: 2, r: 7, fill: "#2563EB" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Leyenda y estadísticas */}
      {processedData.length > 0 && !isLoading && !error && statistics && (
        <div className="mt-6 space-y-4">
          {/* Leyenda */}
          <div className="flex justify-center">
            <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-500" style={{ borderTop: "3px dashed #2563EB" }}></div>
                <span className="text-sm text-gray-600">Predicción de consumo mensual en L/s</span>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-blue-600 font-medium">Promedio Mensual</p>
              <p className="text-lg font-bold text-blue-800">
                {statistics.average.toLocaleString(undefined, { maximumFractionDigits: 2 })} L
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-sm text-green-600 font-medium">Consumo Máximo</p>
              <p className="text-lg font-bold text-green-800">
                {statistics.max.toLocaleString(undefined, { maximumFractionDigits: 2 })} L
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <p className="text-sm text-orange-600 font-medium">Consumo Mínimo</p>
              <p className="text-lg font-bold text-orange-800">
                {statistics.min.toLocaleString(undefined, { maximumFractionDigits: 2 })} L
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MiPrediccionLoteComponent
