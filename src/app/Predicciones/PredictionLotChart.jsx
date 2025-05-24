import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import Modal from "../../components/Modal";
import PredictionLotChartComponent from '../../components/PredictionLotChartComponent';
import axios from 'axios';
import { Brain, RefreshCw, AlertTriangle } from 'lucide-react';

const PredictionLotChart = () => {
    const { id_lot } = useParams();
    const [predictionData, setPredictionData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('3');
    const [isGenerating, setIsGenerating] = useState(false);
    const [canGenerate, setCanGenerate] = useState(true); // Controla si se puede generar
    const chartRef = useRef(null);

    // Estados para modales
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const API_URL = import.meta.env.VITE_APP_API_URL;

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

    // Función para obtener predicciones existentes (GET)
    const fetchExistingPredictions = async (lotId, periodTime = null) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(
                `${API_URL}/ia/prediction-lot`,
                {
                    ...getAxiosConfig(),
                    data: {
                        lot: lotId
                    }
                }
            );

            console.log('Predicciones obtenidas:', response.data);
            
            if (Array.isArray(response.data) && response.data.length > 0) {
                // Filtrar por período si se especifica
                let filteredData = response.data;
                if (periodTime) {
                    filteredData = response.data.filter(
                        item => item.period_time.toString() === periodTime.toString()
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
            console.error('Error al obtener predicciones:', err);
            const errorMessage = err.response?.data?.message || 'Error al obtener las predicciones';
            setError(errorMessage);
            setPredictionData([]);
        } finally {
            setLoading(false);
        }
    };

    // Función para generar nuevas predicciones (POST)
    const generateNewPredictions = async (lotId, periodTime) => {
        try {
            setIsGenerating(true);
            setError(null);
            setCanGenerate(false); // Deshabilitar botón durante generación
            
            const requestData = {
                lot: lotId,
                period_time: parseInt(periodTime)
            };

            console.log('Generando predicciones con:', requestData);
            
            const response = await axios.post(
                `${API_URL}/ia/prediction-lot`,
                requestData,
                getAxiosConfig()
            );

            console.log('Respuesta de generación:', response.data);
            
            // Mostrar modal de éxito
            setShowSuccessModal(true);
            
            // Automáticamente cargar las nuevas predicciones
            await fetchExistingPredictions(lotId, periodTime);
            
        } catch (err) {
            console.error('Error al generar predicciones:', err);
            const errorMessage = err.response?.data?.message || 
                               err.response?.data?.error || 
                               'Error al generar las predicciones';
            setError(errorMessage);
            setShowErrorModal(true);
        } finally {
            setIsGenerating(false);
            setCanGenerate(true); // Volver a habilitar botón
        }
    };

    // Cargar predicciones al montar el componente
    useEffect(() => {
        if (id_lot) {
            fetchExistingPredictions(id_lot, selectedPeriod);
        }
    }, [id_lot]);

    // Cargar predicciones cuando cambie el período seleccionado
    useEffect(() => {
        if (id_lot && selectedPeriod) {
            fetchExistingPredictions(id_lot, selectedPeriod);
        }
    }, [selectedPeriod]);

    // Manejar cambio de período de predicción
    const handlePeriodChange = (newPeriod) => {
        console.log('Cambiando período a:', newPeriod);
        setSelectedPeriod(newPeriod);
        // El useEffect se encargará de cargar los datos para el nuevo período
    };

    // Manejar generación de nuevas predicciones
    const handleGeneratePredictions = () => {
        generateNewPredictions(id_lot, selectedPeriod);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />

            {/* Modal de error */}
            <Modal
                showModal={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="Error en predicciones"
                btnMessage="Aceptar"
            >
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-500 mt-1" size={20} />
                    <div>
                        <p className="text-gray-700 mb-2">
                            Ocurrió un error al procesar las predicciones:
                        </p>
                        <p className="text-red-600 font-medium">
                            {error}
                        </p>
                    </div>
                </div>
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
                            Las predicciones para <strong>{selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}</strong> han sido generadas exitosamente.
                        </p>
                        <p className="text-sm text-gray-600">
                            Los datos se han actualizado automáticamente en la gráfica.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Contenedor principal */}
            <div className="flex-1 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Header con información del lote */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                    <Brain className="text-blue-600" size={32} />
                                    Predicciones IA - Lote {id_lot}
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Predicciones de consumo generadas con inteligencia artificial
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fetchExistingPredictions(id_lot, selectedPeriod)}
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

                    {/* Componente de gráfica de predicciones */}
                    <div className="mb-6">
                        <PredictionLotChartComponent
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
                        />
                    </div>


                    {/* Información adicional */}
                    {predictionData.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-6 mt-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">
                                Información de las Predicciones
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p><strong>Predio:</strong> {predictionData[0]?.plot}</p>
                                    <p><strong>Propietario:</strong> {predictionData[0]?.owner}</p>
                                    <p><strong>Período de predicción:</strong> {predictionData[0]?.period_time} meses</p>
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
                                    <p><strong>Total de predicciones:</strong> {predictionData.length} meses</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionLotChart;