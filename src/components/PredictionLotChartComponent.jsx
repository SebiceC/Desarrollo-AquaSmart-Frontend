import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Calendar, Brain, TrendingUp, Droplet, Loader, AlertTriangle, RefreshCw, ArrowUp, ArrowDown, Lightbulb } from 'lucide-react';
import Modal from "./Modal";
import PropTypes from 'prop-types';

/**
 * Component for displaying prediction flow rate data with predefined time filters
 */
const PredictionLotChartComponent = ({ 
  predictionData = [],
  isLoading = false,
  error = null,
  onPeriodChange = () => {},
  onGeneratePredictions = () => {},
  selectedPeriod = '3',
  lotId = '',
  title = "PREDICCIÓN DE CONSUMO - LOTE",
  chartRef,
  isGenerating = false,
  canGenerate = true,
  showNoDataMessage = false
}) => {
  const localChartRef = useRef(null);
  const actualChartRef = chartRef || localChartRef;
  
  // Estados para modales
  const [showPredictionErrorModal, setShowPredictionErrorModal] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  
  // Estado para estadísticas
  const [stats, setStats] = useState({
    totalPredicted: 0,
    avgConsumption: 0,
    maxConsumption: 0,
    minConsumption: 0,
    trend: 'stable'
  });
  
  // Opciones de períodos de predicción
  const periodOptions = [
    { value: '1', label: '1 mes' },
    { value: '3', label: '3 meses' },
    { value: '6', label: '6 meses' }
  ];

  // Procesar datos de predicción para el gráfico - MODIFICADO para mostrar meses futuros
  const processedData = useMemo(() => {


    try {
        // Filtrar datos que correspondan al período seleccionado
        const correctPeriodData = predictionData.filter(item => {
            const matches = (item.period_time === selectedPeriod || item.period_time === parseInt(selectedPeriod));
            return matches;
        });
        
        
        
        if (correctPeriodData.length === 0) {
            return [];
        }

        // Ordenar datos por fecha de predicción
        const sortedData = [...correctPeriodData].sort((a, b) => {
            return new Date(a.date_prediction) - new Date(b.date_prediction);
        });

        

        // Procesar cada predicción individual como un punto en la gráfica
        const result = sortedData.map((prediction, index) => {
            const predictionDate = new Date(prediction.date_prediction);
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const monthLabel = `${monthNames[predictionDate.getMonth()]} ${predictionDate.getFullYear()}`;
            
            const consumptionValue = parseFloat(prediction.consumption_prediction || 0);
            
            
            
            return {
                month: monthLabel,
                predicted: consumptionValue,
                date: prediction.date_prediction,
                fullDate: predictionDate.toLocaleDateString('es-ES'),
                originalData: prediction,
                isPredicted: true,
                monthIndex: index + 1
            };
        });

        
        
        return result;
    } catch (err) {
        console.error('❌ Error procesando datos de predicción:', err);
        return [];
    }
}, [predictionData, selectedPeriod]);


  // Calcular estadísticas
  useEffect(() => {
    if (processedData && processedData.length > 0) {
      const values = processedData.map(item => item.predicted);
      const totalPredicted = values.reduce((sum, val) => sum + val, 0);
      const avgConsumption = totalPredicted / values.length;
      const maxConsumption = Math.max(...values);
      const minConsumption = Math.min(...values);
      
      // Calcular tendencia
      let trend = 'stable';
      if (values.length > 1) {
        const firstHalf = values.slice(0, Math.ceil(values.length / 2));
        const secondHalf = values.slice(Math.ceil(values.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        if (secondAvg > firstAvg * 1.05) trend = 'increasing';
        else if (secondAvg < firstAvg * 0.95) trend = 'decreasing';
      }

      setStats({
        totalPredicted: totalPredicted.toFixed(2),
        avgConsumption: avgConsumption.toFixed(2),
        maxConsumption: maxConsumption.toFixed(2),
        minConsumption: minConsumption.toFixed(2),
        trend
      });
    } else {
      setStats({
        totalPredicted: 0,
        avgConsumption: 0,
        maxConsumption: 0,
        minConsumption: 0,
        trend: 'stable'
      });
    }
  }, [processedData]);

  // Mostrar modal de error cuando hay error
  useEffect(() => {
    if (error) {
      setShowPredictionErrorModal(true);
    }
  }, [error]);

  // Tooltip personalizado - MODIFICADO para mostrar información de meses futuros
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          <p className="text-blue-600">
            <span className="font-medium">Consumo Predicho: </span>
            {`${payload[0].value.toFixed(2)} L/mes`}
          </p>
          <p className="text-gray-500 text-sm">{data.fullDate}</p>
          <p className="text-purple-600 text-sm">
            <span className="font-medium">Mes futuro #{data.monthIndex}</span>
          </p>
          {data.originalData?.code_prediction && (
            <p className="text-gray-400 text-xs">Código: {data.originalData.code_prediction}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Manejar cambio de período - MODIFICADO: Llamar automáticamente a onPeriodChange
  const handlePeriodChange = async (event) => {
    const newPeriod = event.target.value;
    
    // Llamar la función del componente padre que maneja el cambio automático
    await onPeriodChange(newPeriod);
};
  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      setShowPredictionErrorModal(false);
      setShowNoDataModal(false);
    };
  }, []);

  // Componente de mensaje de sin datos personalizado - MODIFICADO
  const NoDataMessage = () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <Brain className="mx-auto text-blue-400" size={48} />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No hay predicciones disponibles
        </h3>
        <p className="text-gray-500 mb-4 text-sm leading-relaxed">
          Para el período de {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'} futuro{selectedPeriod !== '1' ? 's' : ''} no hay predicciones generadas.
          {canGenerate ? 
            ' Usa el botón "Generar Predicción" para crear predicciones de los próximos meses con IA.' :
            ' Las predicciones se generarán automáticamente al cambiar de período.'
          }
        </p>
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
          <div className="flex items-start">
            <Lightbulb className="text-purple-500 mt-0.5 mr-2" size={16} />
            <div className="text-left">
              <p className="text-purple-700 text-xs font-medium mb-1">Predicciones futuras:</p>
              <ul className="text-purple-600 text-xs space-y-1">
                <li>• 1 mes: Predicción del próximo mes</li>
                <li>• 3 meses: Predicciones de los próximos 3 meses</li>
                <li>• 6 meses: Predicciones de los próximos 6 meses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Determinar el estado del botón de generar
  const shouldShowGenerateButton = canGenerate && predictionData.length === 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Modal de error de predicción */}
      <Modal 
        showModal={showPredictionErrorModal} 
        onClose={() => setShowPredictionErrorModal(false)} 
        title="Error" 
        btnMessage="Aceptar"
      >
        <div className="flex items-start gap-3">
          <div>
            <p className="text-gray-700 mb-2">
            Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.
            </p>
          </div>
        </div>
      </Modal>
      
      {/* Header del componente */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Brain className="text-blue-600" size={24} />
              {title}
            </h2>
            {predictionData.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Período: {predictionData[0]?.period_time} {predictionData[0]?.period_time === 1 ? 'mes' : 'meses'} - 
                Generado: {predictionData[0]?.created_at ? new Date(predictionData[0].created_at).toLocaleDateString('es-ES') : 'N/A'}
              </p>
            )}
          </div>
          
          <div className="flex gap-3 items-center">
            {/* Selector de período */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                disabled={isLoading || isGenerating}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Información del lote */}
            {lotId && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm">
                <span className="font-medium">Lote: {lotId}</span>
              </div>
            )}
            
            {/* Botón de generar predicciones - MODIFICADO: Solo visible cuando no hay datos */}
            {shouldShowGenerateButton && (
              <button
                onClick={onGeneratePredictions}
                disabled={!canGenerate || isGenerating || isLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Brain size={16} />
                    Generar Predicción
                  </>
                )}
              </button>
            )}
            
            {/* Indicador de estado cuando hay datos */}
            {predictionData.length > 0 && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Predicciones Activas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {/* Estados de carga */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
              <p className="text-gray-600">Cargando predicciones...</p>
              <p className="text-sm text-gray-500 mt-1">Período: {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}</p>
            </div>
          </div>
        )}

        {/* Estado de generación */}
        {isGenerating && !isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Brain className="animate-pulse text-blue-600 mx-auto mb-3" size={32} />
              <p className="text-gray-600 font-medium">Generando predicciones con IA...</p>
              <p className="text-sm text-gray-500 mt-1">Esto puede tomar unos momentos</p>
            </div>
          </div>
        )}

        {/* Estado de error */}
        {error && !isLoading && !isGenerating && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-red-600">
              <AlertTriangle className="mx-auto mb-3" size={32} />
              <p className="font-medium">Error al cargar predicciones</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Estado sin datos */}
        {!isLoading && !isGenerating && !error && (processedData.length === 0 || showNoDataMessage) && (
          <NoDataMessage />
        )}

        {/* Gráfica y estadísticas */}
        {!isLoading && !isGenerating && !error && processedData.length > 0 && (
          <>
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplet className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Consumo Total</p>
                    <p className="font-bold text-gray-800 text-sm">{stats.totalPredicted} L</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Promedio Mensual</p>
                    <p className="font-bold text-gray-800 text-sm">{stats.avgConsumption} L/mes</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUp className="text-red-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Consumo Máximo</p>
                    <p className="font-bold text-gray-800 text-sm">{stats.maxConsumption} L</p>
                  </div>
                </div>
              </div>
              <div className="bg-cyan-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowDown className="text-cyan-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Consumo Mínimo</p>
                    <p className="font-bold text-gray-800 text-sm">{stats.minConsumption} L</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfica */}
            <div className="h-96" ref={actualChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ 
                      value: 'Consumo (L/mes)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Línea de promedio */}
                  <ReferenceLine 
                    y={parseFloat(stats.avgConsumption)} 
                    stroke="#10b981" 
                    strokeDasharray="8 8"
                    label={{ value: "Promedio", position: "topRight" }}
                  />
                  
                  {/* Línea principal de predicciones */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
                    name="Consumo Predicho (L/mes)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Indicador de tendencia */}
            {stats.trend !== 'stable' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp 
                    className={`${stats.trend === 'increasing' ? 'text-red-500' : 'text-green-500'}`} 
                    size={16} 
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Tendencia: 
                    <span className={`ml-1 ${stats.trend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.trend === 'increasing' ? 'Aumento en el consumo' : 'Disminución en el consumo'}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Nota informativa - MODIFICADA para explicar predicciones futuras */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Nota:</strong> Las predicciones muestran el consumo mensual estimado para los próximos {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'} basado en modelos de IA entrenados con datos históricos. 
                Cada punto representa el consumo estimado por mes futuro. 
                El consumo total predicho para los próximos {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'} es de {stats.totalPredicted} L.
              </p>
              {predictionData[0]?.code_prediction && (
                <p className="text-xs text-gray-500 mt-2">
                  Código de predicción: {predictionData[0].code_prediction}
                </p>
              )}
            </div>

            {/* Banner informativo sobre la funcionalidad automática - MODIFICADO */}
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Brain className="text-purple-600 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-semibold text-purple-800 mb-1">Predicciones de Meses Futuros</h4>
                  <p className="text-xs text-purple-700 mb-2">
                    La gráfica muestra predicciones para los meses venideros desde la fecha actual:
                  </p>
                  <ul className="text-xs text-purple-600 space-y-1">
                    <li>• <strong>1 mes:</strong> Predicción del próximo mes únicamente</li>
                    <li>• <strong>3 meses:</strong> Predicciones de los próximos 3 meses consecutivos</li>
                    <li>• <strong>6 meses:</strong> Predicciones de los próximos 6 meses consecutivos</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

PredictionLotChartComponent.propTypes = {
  predictionData: PropTypes.array,
  isLoading: PropTypes.bool,
  error: PropTypes.any,
  onPeriodChange: PropTypes.func,
  onGeneratePredictions: PropTypes.func,
  selectedPeriod: PropTypes.string,
  lotId: PropTypes.string,
  title: PropTypes.string,
  chartRef: PropTypes.any,
  isGenerating: PropTypes.bool,
  canGenerate: PropTypes.bool,
  showNoDataMessage: PropTypes.bool
};

export default PredictionLotChartComponent;