import React, { useState, useEffect, useRef } from 'react';
import NavBar from '../../../components/NavBar';
import Modal from "../../../components/Modal";
import PredictionDistritoChartComponent from '../../../components/PredictionDistritoChartComponent';
import axios from 'axios';
import { Brain, RefreshCw, AlertTriangle, Building } from 'lucide-react';

const PredictionDistrito = () => {
    const [predictionData, setPredictionData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('3');
    const [isGenerating, setIsGenerating] = useState(false);
    const [canGenerate, setCanGenerate] = useState(true);
    const chartRef = useRef(null);

    // Estados para modales
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const API_URL = import.meta.env.VITE_APP_API_URL;

    // Función helper para extraer mensajes de error
    const extractErrorMessage = (err) => {
        // console.log('Error completo:', err);
        // console.log('Error response:', err.response);
        // console.log('Error response data:', err.response?.data);
        
        // Si hay respuesta del servidor
        if (err.response?.data) {
            const errorData = err.response.data;
            
            // Estructura del backend: { status: "error", code: 400, errors: { detail: "mensaje" } }
            if (errorData.errors?.detail) {
                return errorData.errors.detail;
            }
            
            // Otros campos en errors
            if (errorData.errors && typeof errorData.errors === 'object') {
                const errorMessages = Object.values(errorData.errors)
                    .filter(msg => msg && typeof msg === 'string' && msg.trim())
                    .join('. ');
                if (errorMessages) {
                    return errorMessages;
                }
            }
            
            // Campo message directo
            if (errorData.message) {
                return errorData.message;
            }
            
            // Campo error directo
            if (errorData.error) {
                return errorData.error;
            }
        }
        
        // Si no hay respuesta del servidor (error de red)
        if (err.message) {
            return err.message;
        }
        
        // Mensaje por defecto
        return 'Fallo en la conexión, intente de nuevo más tarde o contacte con soporte técnico';
    };

    // Configurar axios con el token de autenticación
    const getAxiosConfig = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    // Función para obtener predicciones existentes del distrito (GET)
    const fetchExistingPredictions = React.useCallback(async (periodTime = null) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(
                `${API_URL}/ia/prediction-bocatoma`,
                getAxiosConfig()
            );

            console.log('Predicciones del distrito obtenidas:', response.data);
            
            if (Array.isArray(response.data) && response.data.length > 0) {
                // Filtrar por período si se especifica
                let filteredData = response.data;
                if (periodTime) {
                    filteredData = response.data.filter(
                        item => item.period_time?.toString() === periodTime.toString()
                    );
                }
                
                setPredictionData(filteredData);
                
                // Si no hay datos para el período actual, limpiar
                if (filteredData.length === 0) {
                    setPredictionData([]);
                }
            } else {
                setPredictionData([]);
            }
            
        } catch (err) {
            console.error('Error al obtener predicciones del distrito:', err);
            // Usar la función helper para extraer el error
            const errorMessage = extractErrorMessage(err);
            setError(errorMessage);
            setPredictionData([]);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    // Función para generar nuevas predicciones del distrito (POST)
    const generateNewPredictions = async (periodTime) => {
        try {
            setIsGenerating(true);
            setError(null);
            setCanGenerate(false);
            
            const requestData = {
                period_time: parseInt(periodTime)
            };

            console.log('Generando predicciones del distrito con:', requestData);
            
            const response = await axios.post(
                `${API_URL}/ia/prediction-bocatoma`,
                requestData,
                getAxiosConfig()
            );

            console.log('Respuesta de generación del distrito:', response.data);
            
            // Mostrar modal de éxito
            setShowSuccessModal(true);
            
            // Automáticamente cargar las nuevas predicciones
            await fetchExistingPredictions(periodTime);
            
        } catch (err) {
            console.error('Error al generar predicciones del distrito:', err);
            // Usar la función helper para extraer el error
            const errorMessage = extractErrorMessage(err);
            setError(errorMessage);
            setShowErrorModal(true);
        } finally {
            setIsGenerating(false);
            setCanGenerate(true);
        }
    };

    // Cargar predicciones al montar el componente
    useEffect(() => {
        const fetchOnMount = async () => {
            await fetchExistingPredictions(selectedPeriod);
        };
        fetchOnMount();
    }, [fetchExistingPredictions, selectedPeriod]);

    // Mostrar modal de error cuando cambie el error
    useEffect(() => {
        if (error) {
            setShowErrorModal(true);
        }
    }, [error]);

    // Cargar predicciones cuando cambie el período seleccionado
    useEffect(() => {
        if (selectedPeriod) {
            fetchExistingPredictions(selectedPeriod);
        }
    }, [selectedPeriod, fetchExistingPredictions]);

    // Manejar cambio de período de predicción
    const handlePeriodChange = (newPeriod) => {
        console.log('Cambiando período a:', newPeriod);
        setSelectedPeriod(newPeriod);
    };

    // Manejar generación de nuevas predicciones
    const handleGeneratePredictions = () => {
        generateNewPredictions(selectedPeriod);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />

            {/* Modal de éxito */}
            <Modal
                showModal={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Predicciones del distrito generadas exitosamente"
                btnMessage="Aceptar"
            >
                <div className="flex items-start gap-3">
                    <Brain className="text-green-500 mt-1" size={20} />
                    <div>
                        <p className="text-gray-700 mb-2">
                            Las predicciones del distrito para <strong>{selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}</strong> han sido generadas exitosamente.
                        </p>
                        <p className="text-sm text-gray-600">
                            Los datos se han actualizado automáticamente en la gráfica.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Modal de error */}
            <Modal
                showModal={showErrorModal}
                onClose={() => {
                    setShowErrorModal(false);
                    setError(null); // Limpiar el error al cerrar el modal
                }}
                title="Error en la conexión o en la predicción"
                btnMessage="Cerrar"
            >
                <div className="flex items-start gap-3">
                    {/* <AlertTriangle className="text-red-500 mt-1" size={20} /> */}
                    <div>
                        <p className="text-gray-700 mb-2">
                            {error || 'Fallo en la conexión, intente de nuevo más tarde o contacte con soporte técnico'}
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Contenedor principal */}
            <div className="flex-1 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Header con información del distrito */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                    <Building className="text-blue-600" size={32} />
                                    Predicciones IA - Distrito de Riego
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Predicciones de consumo del distrito generadas con inteligencia artificial
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fetchExistingPredictions(selectedPeriod)}
                                    disabled={loading || isGenerating}
                                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
                                >
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                    Actualizar
                                </button>
                            </div>
                        </div>
                        
                        {/* Indicadores de estado */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {predictionData.length > 0 && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Predicciones para {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}
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

                    {/* Componente de gráfica de predicciones del distrito */}
                    <div className="mb-6">
                        <PredictionDistritoChartComponent
                            predictionData={predictionData}
                            isLoading={loading}
                            error={error}
                            onPeriodChange={handlePeriodChange}
                            onGeneratePredictions={handleGeneratePredictions}
                            selectedPeriod={selectedPeriod}
                            title="PREDICCIÓN DE CONSUMO - DISTRITO DE RIEGO"
                            chartRef={chartRef}
                            isGenerating={isGenerating}
                            canGenerate={canGenerate}
                        />
                    </div>

                    {/* Información adicional */}
                    {predictionData.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-6 mt-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">
                                Información de las Predicciones del Distrito
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p><strong>Sistema:</strong> Distrito de Riego</p>
                                    <p><strong>Predicción a:</strong> {predictionData[0]?.name}</p>
                                    <p><strong>Período de predicción:</strong> {predictionData[0]?.period_time} {predictionData[0]?.period_time === '1' ? 'mes' : 'meses'}</p>
                                </div>
                                <div>
                                    <p><strong>Código de predicción:</strong> {predictionData[0]?.code_prediction}</p>
                                    <p><strong>Fecha de generación:</strong> {
                                        predictionData[0]?.created_at 
                                            ? new Date(predictionData[0].created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'No disponible'
                                    }</p>
                                    <p><strong>Fecha final:</strong> {
                                        predictionData[0]?.final_date 
                                            ? new Date(predictionData[0].final_date).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'No disponible'
                                    }</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionDistrito;