import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import Modal from "../../components/Modal";
import PredictionLotChartComponent from '../../components/PredictionLotChartComponent';
import axios from 'axios';
import { Brain, RefreshCw, AlertTriangle, Home } from 'lucide-react';

const PredictionLotChart = () => {
    const { id_lot } = useParams();
    const [predictionData, setPredictionData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('3');
    const [isGenerating, setIsGenerating] = useState(false);
    const [canGenerate, setCanGenerate] = useState(true);
    const [initialLoad, setInitialLoad] = useState(false);
    const chartRef = useRef(null);

    // Estados para modales
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showNoDataModal, setShowNoDataModal] = useState(false);
    const [showPredictionExistsModal, setShowPredictionExistsModal] = useState(false);
    
    // Estados para mensajes de modales
    const [modalErrorMessage, setModalErrorMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    const API_URL = import.meta.env.VITE_APP_API_URL;

    // Función helper para extraer mensajes de error
    const extractErrorMessage = (err) => {
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

    // Función para obtener predicciones existentes (GET) - Modificada para incluir período
    const fetchExistingPredictions = React.useCallback(async (lotId, periodTime = null) => {
        try {
            setLoading(true);
            setError(null);
            
            // URL sin filtro period_time - traer todas las predicciones del lote
            let url = `${API_URL}/ia/prediction-lot?lot=${lotId}`;
            
            
            
            const response = await axios.get(url, getAxiosConfig());
    
            
            
            if (Array.isArray(response.data) && response.data.length > 0) {
                // Si se especificó un período, filtrar en frontend
                let validData = response.data;
                if (periodTime) {
                    validData = response.data.filter(item => 
                        item.period_time === periodTime || item.period_time === parseInt(periodTime)
                    );
                }
                
                if (validData.length > 0) {
                    setPredictionData(validData);
                    setCanGenerate(false);
                } else if (periodTime) {
                    // Si no hay datos para el período específico, generar automáticamente
                    setPredictionData([]);
                    setCanGenerate(true);
                    await generateNewPredictions(lotId, periodTime, true); // true = automática
                } else {
                    setPredictionData([]);
                    setCanGenerate(true);
                }
            } else {
                // Si no hay predicciones en absoluto y se especificó período, generar automáticamente
                if (periodTime) {
                    setPredictionData([]);
                    setCanGenerate(true);
                    await generateNewPredictions(lotId, periodTime, true); // true = automática
                } else {
                    setPredictionData([]);
                    setCanGenerate(true);
                }
            }
            
        } catch (err) {
            console.error('❌ Error al obtener predicciones:', err);
            const errorMessage = extractErrorMessage(err);
            
            // Si es 404 y hay período específico, generar automáticamente
            if (err.response?.status === 404 && periodTime) {
                setPredictionData([]);
                setCanGenerate(true);
                await generateNewPredictions(lotId, periodTime, true); // true = automática
            } else if (err.response?.status === 404) {
                setPredictionData([]);
                setCanGenerate(true);
            } else {
                setError(errorMessage);
                setModalErrorMessage(errorMessage);
                setModalTitle('Error');
                setShowErrorModal(true);
                setCanGenerate(true);
            }
            setPredictionData([]);
        } finally {
            setLoading(false);
            if (!initialLoad) {
                setInitialLoad(true);
            }
        }
    }, [API_URL, initialLoad]);

    // Función para generar nuevas predicciones (POST)
    const generateNewPredictions = async (lotId, periodTime, isAutoGeneration = false) => {
        try {
            setIsGenerating(true);
            setError(null);
            setCanGenerate(false);
            
            const requestData = {
                lot: lotId,
                period_time: parseInt(periodTime)
            };
    
            
            
            const response = await axios.post(
                `${API_URL}/ia/prediction-lot`,
                requestData,
                getAxiosConfig()
            );
    
            
            
            // Solo mostrar modal de éxito si NO es generación automática
            if (!isAutoGeneration) {
                setShowSuccessModal(true);
            }
            
            // Cargar todas las predicciones y filtrar por período
            setTimeout(async () => {
                // Llamar fetchExistingPredictions pero sin auto-generación para evitar bucle
                try {
                    setLoading(true);
                    let url = `${API_URL}/ia/prediction-lot?lot=${lotId}`;
                    const response = await axios.get(url, getAxiosConfig());
                    
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        const validData = response.data.filter(item => 
                            item.period_time === periodTime || item.period_time === parseInt(periodTime)
                        );
                        
                        if (validData.length > 0) {
                            setPredictionData(validData);
                            setCanGenerate(false);
                            
                        }
                    }
                } catch (err) {
                    console.error('Error al cargar predicciones después de generar:', err);
                } finally {
                    setLoading(false);
                }
            }, 2000);
            
        } catch (err) {
            console.error('❌ Error al generar predicciones:', err);
            const errorMessage = extractErrorMessage(err);
            
            // Verificar si el error es porque ya existe la predicción
            if (errorMessage.includes('Ya existe una predicción') || 
                errorMessage.includes('already exists') ||
                errorMessage.includes('ya existe') ||
                err.response?.status === 409) {
                
                
                
                // Cargar todas las predicciones del lote
                try {
                    let url = `${API_URL}/ia/prediction-lot?lot=${lotId}`;
                    
                    
                    const existingResponse = await axios.get(url, getAxiosConfig());
                    
                    
                    if (Array.isArray(existingResponse.data) && existingResponse.data.length > 0) {
                        // Filtrar por período específico en frontend
                        const correctData = existingResponse.data.filter(item => 
                            item.period_time === periodTime || item.period_time === parseInt(periodTime)
                        );
                        
                        
                        
                        if (correctData.length > 0) {
                            // ACTUALIZAR ESTADOS INMEDIATAMENTE
                            setPredictionData(correctData);
                            setCanGenerate(false);
                            setError(null);
                            
                            
                            
                            // Solo mostrar modal si NO es generación automática
                            if (!isAutoGeneration) {
                                setModalErrorMessage(`Se encontraron ${correctData.length} predicciones existentes para ${periodTime} ${periodTime === '1' ? 'mes' : 'meses'}.`);
                                setShowPredictionExistsModal(true);
                            }
                        } else {
                            
                            setPredictionData([]);
                            setCanGenerate(true);
                            if (!isAutoGeneration) {
                                setShowNoDataModal(true);
                            }
                        }
                    } else {
                        setPredictionData([]);
                        setCanGenerate(true);
                        if (!isAutoGeneration) {
                            setShowNoDataModal(true);
                        }
                    }
                    
                } catch (fetchErr) {
                    console.error('❌ Error al cargar predicciones existentes:', fetchErr);
                    if (!isAutoGeneration) {
                        setError('No se pudieron cargar las predicciones existentes');
                        setModalErrorMessage('Error al cargar las predicciones existentes');
                        setModalTitle('Error de carga');
                        setShowErrorModal(true);
                    }
                    setCanGenerate(true);
                }
            } else {
                // Otros errores - solo mostrar modal si NO es generación automática
                if (!isAutoGeneration) {
                    setError(errorMessage);
                    setModalErrorMessage(errorMessage);
                    setModalTitle('Error al generar predicciones');
                    setShowErrorModal(true);
                }
                setCanGenerate(true);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Cargar predicciones al montar el componente
    useEffect(() => {
        const fetchOnMount = async () => {
            if (id_lot) {
                await fetchExistingPredictions(id_lot, selectedPeriod);
            }
        };
        fetchOnMount();
    }, [id_lot, fetchExistingPredictions]);

    // Manejar cambio de período de predicción - MODIFICADO: Generar automáticamente
    const handlePeriodChange = async (newPeriod) => {
        
        setSelectedPeriod(newPeriod);
        
        // Resetear estados inmediatamente
        setPredictionData([]);
        setCanGenerate(true);
        setError(null);
        
        // Cerrar modales abiertos
        setShowErrorModal(false);
        setShowPredictionExistsModal(false);
        setShowNoDataModal(false);
        
        // Buscar TODAS las predicciones del lote
        if (id_lot) {
            try {
                setLoading(true);
                
                // URL sin filtro period_time - traer todas las predicciones del lote
                let url = `${API_URL}/ia/prediction-lot?lot=${id_lot}`;
                
                
                
                const response = await axios.get(url, getAxiosConfig());
                
                
                
                if (Array.isArray(response.data) && response.data.length > 0) {
                    // Filtrar en frontend por period_time que coincida con el período seleccionado
                    const correctPeriodData = response.data.filter(item => 
                        item.period_time === newPeriod || item.period_time === parseInt(newPeriod)
                    );
                    
                    
                    
                    if (correctPeriodData.length > 0) {
                        
                        setPredictionData(correctPeriodData);
                        setCanGenerate(false);
                    } else {
                        
                        setPredictionData([]);
                        setCanGenerate(true);
                        
                        // GENERAR AUTOMÁTICAMENTE si no hay datos para este período
                        
                        await generateNewPredictions(id_lot, newPeriod, true); // true = automática
                    }
                } else {
                    
                    setPredictionData([]);
                    setCanGenerate(true);
                    
                    // GENERAR AUTOMÁTICAMENTE si no hay datos en absoluto
                    
                    await generateNewPredictions(id_lot, newPeriod, true); // true = automática
                }
                
            } catch (err) {
                
                
                // Si es 404 (no existe), generar automáticamente
                if (err.response?.status === 404) {
                    
                    setPredictionData([]);
                    setCanGenerate(true);
                    await generateNewPredictions(id_lot, newPeriod, true); // true = automática
                } else {
                    // Otros errores
                    setPredictionData([]);
                    setCanGenerate(true);
                    const errorMessage = extractErrorMessage(err);
                    setError(errorMessage);
                    setModalErrorMessage(errorMessage);
                    setModalTitle('Error al cargar predicciones');
                    setTimeout(() => {
                        setShowErrorModal(true);
                    }, 500);
                }
            } finally {
                setLoading(false);
            }
        }
    };
    // Manejar generación manual de nuevas predicciones
    const handleGeneratePredictions = () => {
        generateNewPredictions(id_lot, selectedPeriod, false); // false = no es automática
    };
    // Función para refrescar datos
    const handleRefresh = () => {
        fetchExistingPredictions(id_lot, selectedPeriod);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />

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
                            Las predicciones del lote para <strong>{selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}</strong> han sido generadas exitosamente.
                        </p>
                        <p className="text-sm text-gray-600">
                            Los datos se han actualizado automáticamente en la gráfica.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Modal de error general */}
            <Modal
                showModal={showErrorModal}
                onClose={() => {
                    setShowErrorModal(false);
                    setError(null);
                    setModalErrorMessage('');
                }}
                title={modalTitle || "Error"}
                btnMessage="Cerrar"
            >
                <div className="flex items-start gap-3">
                    <div>
                        <p className="text-gray-700 mb-2">
                            {'Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico'}
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Modal de predicción ya existente */}
            <Modal
    showModal={showPredictionExistsModal}
    onClose={() => {
        setShowPredictionExistsModal(false);
        setModalErrorMessage('');
        // Forzar re-render después de cerrar modal
    }}
    title="Predicciones encontradas"
    btnMessage="Ver gráfica"
>
    <div className="flex items-start gap-3">
        <Brain className="text-green-500 mt-1" size={20} />
        <div>
            <p className="text-gray-700 mb-2">
                ✅ Ya existen predicciones para este lote con el período de {selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}.
            </p>
            <p className="text-sm text-gray-600 mb-2">
                {modalErrorMessage}
            </p>
            <p className="text-sm text-green-600 font-medium">
                Las predicciones se han cargado y están listas para visualizar.
            </p>
            {predictionData.length > 0 && (
                <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                    <p>📊 Datos cargados: {predictionData.length} registros</p>
                    <p>📅 Período: {predictionData[0]?.period_time} {predictionData[0]?.period_time === 1 ? 'mes' : 'meses'}</p>
                </div>
            )}
        </div>
    </div>
</Modal>

            {/* Modal de sin datos - invitar a generar predicciones */}
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
                            No se encontraron predicciones para este período ({selectedPeriod} {selectedPeriod === '1' ? 'mes' : 'meses'}).
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                            Se generará automáticamente una nueva predicción al seleccionar un período, 
                            o puedes usar el botón "Generar Predicción" cuando esté habilitado.
                        </p>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-700">
                                <strong>Tip:</strong> Las predicciones se generan utilizando modelos de 
                                inteligencia artificial basados en datos históricos de consumo.
                            </p>
                        </div>
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
                                    <Home className="text-blue-600" size={32} />
                                    Predicciones IA - Lote {id_lot}
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Predicciones de consumo del lote generadas con inteligencia artificial
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRefresh}
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
                            showNoDataMessage={predictionData.length === 0 && initialLoad && !loading}
                        />
                    </div>

                    {/* Información adicional */}
                    {predictionData.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-6 mt-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">
                                Información de las Predicciones del Lote
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p><strong>Predio:</strong> {predictionData[0]?.plot || 'No disponible'}</p>
                                    <p><strong>Propietario:</strong> {predictionData[0]?.owner || 'No disponible'}</p>
                                    <p><strong>Período de predicción:</strong> {predictionData[0]?.period_time} {predictionData[0]?.period_time === 1 ? 'mes' : 'meses'}</p>
                                </div>
                                <div>
                                    <p><strong>Código de predicción:</strong> {predictionData[0]?.code_prediction || 'No disponible'}</p>
                                    <p><strong>Fecha de generación:</strong> {
                                        predictionData[0]?.created_at 
                                            ? new Date(predictionData[0].created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'No disponible'
                                    }</p>
                                    <p><strong>Total de predicciones:</strong> {predictionData.length} registros</p>
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