import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Calendar, TrendingUp, Droplet, Loader, AlertTriangle, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import PropTypes from 'prop-types';

const PredictionDistritoChartComponent = ({
    predictionData = [],
    isLoading = false,
    error = null,
    onPeriodChange,
    onGeneratePredictions,
    selectedPeriod = '3',
    title = 'PREDICCIÓN DE CONSUMO - DISTRITO DE RIEGO',
    chartRef,
    isGenerating = false,
    canGenerate = true
}) => {
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({
        totalPredicted: 0,
        avgConsumption: 0,
        maxMonth: '',
        minMonth: '',
        maxConsumption: 0,
        minConsumption: 0,
        trend: 'stable'
    });

    // Opciones de período
    const periodOptions = [
        { value: '1', label: '1 mes' },
        { value: '3', label: '3 meses' },
        { value: '6', label: '6 meses' },
        // { value: '12', label: '12 meses' }
    ];

    // Procesar datos para la gráfica
    useEffect(() => {
        if (predictionData && predictionData.length > 0) {
            // Filtrar por período seleccionado
            const filteredData = predictionData.filter(pred => pred.period_time === selectedPeriod);

            if (filteredData.length === 0) {
                setChartData([]);
                setStats({
                    totalPredicted: 0,
                    avgConsumption: 0,
                    maxMonth: '',
                    minMonth: '',
                    maxConsumption: 0,
                    minConsumption: 0,
                    trend: 'stable'
                });
                return;
            }

            // Sumar todos los valores de consumo del período seleccionado
            const totalPredicted = filteredData.reduce((sum, pred) => sum + parseFloat(pred.consumption_prediction || 0), 0);
            const periodMonths = parseInt(selectedPeriod);
            const avgConsumption = totalPredicted / periodMonths;

            // Para la gráfica, distribuir el total entre los meses del período
            const processedData = [];
            const startDate = new Date(filteredData[0].created_at);
            for (let i = 0; i < periodMonths; i++) {
                const currentDate = new Date(startDate);
                currentDate.setMonth(startDate.getMonth() + i);
                const monthName = currentDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                processedData.push({
                    month: monthName,
                    monthIndex: i + 1,
                    predicted: avgConsumption,
                    date: currentDate.toISOString().split('T')[0],
                    fullDate: currentDate.toLocaleDateString('es-ES'),
                    predictionCode: filteredData[0].code_prediction,
                    bocatomaName: filteredData[0].name,
                    totalConsumption: totalPredicted
                });
            }

            setChartData(processedData);

            // Calcular estadísticas
            // Consumo máximo y mínimo de los valores originales del período seleccionado
            const maxOriginal = Math.max(...filteredData.map(pred => parseFloat(pred.consumption_prediction)));
            const minOriginal = Math.min(...filteredData.map(pred => parseFloat(pred.consumption_prediction)));
            const maxConsumption = maxOriginal.toFixed(2);
            const minConsumption = minOriginal.toFixed(2);

            // Tendencia: comparar primer y segundo bloque de la lista
            let trend = 'stable';
            if (filteredData.length > 1) {
                const firstHalf = filteredData.slice(0, Math.ceil(filteredData.length / 2));
                const secondHalf = filteredData.slice(Math.ceil(filteredData.length / 2));
                const firstAvg = firstHalf.reduce((sum, pred) => sum + parseFloat(pred.consumption_prediction), 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((sum, pred) => sum + parseFloat(pred.consumption_prediction), 0) / secondHalf.length;
                if (secondAvg > firstAvg * 1.05) trend = 'increasing';
                else if (secondAvg < firstAvg * 0.95) trend = 'decreasing';
            }

            setStats({
                totalPredicted: totalPredicted.toFixed(2),
                avgConsumption: avgConsumption.toFixed(2),
                maxMonth: '', // Ya no se usa
                minMonth: '', // Ya no se usa
                maxConsumption,
                minConsumption,
                trend
            });
        } else {
            setChartData([]);
            setStats({
                totalPredicted: 0,
                avgConsumption: 0,
                maxMonth: '',
                minMonth: '',
                maxConsumption: 0,
                minConsumption: 0,
                trend: 'stable'
            });
        }
    }, [predictionData, selectedPeriod]);

    // Tooltip personalizado
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
                    <p className="text-gray-500 text-sm">
                        <span className="font-medium">Total del período: </span>
                        {`${data.totalConsumption.toFixed(2)} L`}
                    </p>
                    <p className="text-gray-500 text-sm">{data.fullDate}</p>
                    {data.bocatomaName && (
                        <p className="text-gray-500 text-sm">Bocatoma: {data.bocatomaName}</p>
                    )}
                    {data.predictionCode && (
                        <p className="text-gray-400 text-xs">Código: {data.predictionCode}</p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Manejar cambio de período
    const handlePeriodChange = (event) => {
        const newPeriod = event.target.value;
        onPeriodChange(newPeriod);
    };

    // Función para determinar el color de la tendencia
    const getTrendColor = (trend) => {
        switch (trend) {
            case 'increasing': return 'text-red-600';
            case 'decreasing': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    // Función para obtener el ícono de tendencia
    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'increasing': return <TrendingUp className="rotate-0" size={16} />;
            case 'decreasing': return <TrendingUp className="rotate-180" size={16} />;
            default: return <TrendingUp className="rotate-90" size={16} />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header del componente */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Brain className="text-blue-600" size={24} />
                            {title}
                        </h2>
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
                        
                        {/* Botón de generar predicciones */}
                        <button
                            onClick={onGeneratePredictions}
                            disabled={!canGenerate || isGenerating || isLoading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="p-6">
                {/* Estados de carga y error */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <RefreshCw className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
                            <p className="text-gray-600">Cargando predicciones...</p>
                        </div>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center text-red-600">
                            <AlertTriangle className="mx-auto mb-3" size={32} />
                            <p className="font-medium">Error al cargar predicciones</p>
                            <p className="text-sm text-gray-600 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Estado sin datos */}
                {!isLoading && !error && chartData.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center text-gray-500">
                            <Droplet className="mx-auto mb-3" size={32} />
                            <p className="font-medium">No hay predicciones disponibles</p>
                            <p className="text-sm mt-1">
                                Genera nuevas predicciones para el período de {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Gráfica y estadísticas */}
                {!isLoading && !error && chartData.length > 0 && (
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
                        <div className="h-96" ref={chartRef}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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

                        {/* Nota informativa */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>Nota:</strong> Las predicciones muestran el consumo mensual promedio basado en múltiples predicciones de IA. 
                                Cada punto representa el consumo estimado por mes. 
                                El consumo total predicho para el período de {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'} es de {stats.totalPredicted} L, distribuido uniformemente en {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

PredictionDistritoChartComponent.propTypes = {
    predictionData: PropTypes.array,
    isLoading: PropTypes.bool,
    error: PropTypes.any,
    onPeriodChange: PropTypes.func,
    onGeneratePredictions: PropTypes.func,
    selectedPeriod: PropTypes.string,
    title: PropTypes.string,
    chartRef: PropTypes.any,
    isGenerating: PropTypes.bool,
    canGenerate: PropTypes.bool
};

export default PredictionDistritoChartComponent;