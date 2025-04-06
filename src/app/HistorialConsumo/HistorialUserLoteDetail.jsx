import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import Modal from "../../components/Modal";
import BackButton from '../../components/BackButton';
import axios from 'axios';
import { PDFDownloadButton } from '../../components/PdfGenerator';
import { CSVDownloadButton } from '../../components/CsvGenerator';
import FlowRateChart from "../../components/FlowRateChart"; // Importamos el componente FlowRateChart

const HistorialUserLoteDetail = () => {
    const { id_plot, id_lot } = useParams();
    const navigate = useNavigate();
    
    const [rawData, setRawData] = useState([]);
    const [processedData, setProcessedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);
    
    // Estado para la validación de propiedad
    const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(true);
    
    // Estado para las fechas seleccionadas
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Estado para opciones de agrupación
    const [groupByOption, setGroupByOption] = useState('day');
    
    // Estado para los modales
    const [showNoDataModal, setShowNoDataModal] = useState(false);

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

    // Validar propiedad del lote
    useEffect(() => {
        const validateLoteOwnership = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("Token no disponible");
                }

                // Obtener datos del usuario
                const userRes = await axios.get(
                    `${API_URL}/users/profile`, 
                    getAxiosConfig()
                );

                // Obtener datos del predio
                const predioRes = await axios.get(
                    `${API_URL}/plot-lot/plots/${id_plot}`, 
                    getAxiosConfig()
                );

                const loteEncontrado = predioRes.data.lotes.find((l) => l.id_lot === id_lot);

                const predioEsDelUsuario = predioRes.data.owner === userRes.data.document;

                if (!loteEncontrado || !predioEsDelUsuario) {
                    setShowUnauthorizedModal(true);
                    setIsAuthorized(false);
                    setTimeout(() => {
                        navigate(`/mispredios/historial-consumoList/${userRes.data.document}`);
                    }, 3000);
                } else {
                    setIsAuthorized(true);
                }
            } catch (err) {
                console.error("Error en validación de lote y predio:", err);
                setShowUnauthorizedModal(true);
                setIsAuthorized(false);
            }
        };

        validateLoteOwnership();
    }, [id_plot, id_lot, navigate, API_URL]);

    // Función para obtener datos
    const fetchData = async (startDate, endDate, groupOption) => {
        try {
            setLoading(true);
            
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            const response = await axios.get(
                `${API_URL}/caudal/flow-measurements/lote/${id_lot}`,
                getAxiosConfig()
            );

            const responseData = response.data;
            console.log('Datos recibidos de la API:', responseData);
            
            if (!Array.isArray(responseData) || responseData.length === 0) {
                setShowNoDataModal(true);
                throw new Error('No existe consumo del lote');
            }
            
            setRawData(responseData);
            return responseData;
        } catch (err) {
            console.error('Error en la carga de datos:', err);
            setError(err.response?.data?.message || 'Error al cargar los datos del lote');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Manejadores de eventos para sincronización con FlowRateChart
    const handleDateRangeChange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
    };

    const handleGroupByChange = (option) => {
        setGroupByOption(option);
    };

    const handleProcessedDataChange = (data) => {
        setProcessedData(data);
    };

    // Si el usuario no es propietario, mostrar solo el mensaje modal y esperar la redirección
    if (!isAuthorized && showUnauthorizedModal) {
        return (
            <div className="flex flex-col min-h-screen">
                <NavBar />
                <Modal
                    showModal={showUnauthorizedModal}
                    onClose={() => navigate(`/mispredios/historial-consumoList/${id_plot}`)}
                    title="Acceso no autorizado"
                    btnMessage="Volver"
                >
                    <p>
                        No tienes autorización para acceder a este lote. Serás redirigido automáticamente.
                    </p>
                </Modal>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />

            {/* Modal de ausencia de datos */}
            <Modal
                showModal={showNoDataModal}
                onClose={() => setShowNoDataModal(false)}
                title="Sin datos de consumo"
                btnMessage="Aceptar"
            >
                <p>
                    Error al cargar los datos, no existe consumo del lote.
                </p>
            </Modal>

            <div className="flex-1 py-20">
                <div className="flex flex-col bg-white rounded-lg shadow-md p-6 md:p-10 w-full max-w-4xl mx-auto">
                    {/* Implementamos el componente FlowRateChart en lugar de la versión anterior */}
                    <FlowRateChart 
                        rawData={rawData}
                        fetchData={fetchData}
                        title={`HISTORIAL DE CONSUMO LOTE ${id_lot}`}
                        chartRef={chartRef}
                        isLoading={loading}
                        apiError={error}
                        onDateRangeChange={handleDateRangeChange}
                        onGroupByChange={handleGroupByChange}
                        onProcessedDataChange={handleProcessedDataChange}
                    />

                    <div className="mt-6 flex justify-center gap-4">
                        {chartRef && (
                            <PDFDownloadButton 
                                data={processedData} 
                                startDate={startDate} 
                                endDate={endDate} 
                                chartRef={chartRef}
                                disabled={!processedData || processedData.length === 0 || !startDate || !endDate || loading || error}
                            />
                        )}
                        <CSVDownloadButton 
                            data={processedData} 
                            startDate={startDate} 
                            endDate={endDate} 
                            disabled={!processedData || processedData.length === 0 || !startDate || !endDate || loading || error}
                        />
                    </div>
                    
                    <div className="flex justify-start mt-5">
                        <BackButton
                            to={`/mispredios/historial-consumoPredio/${id_plot}`}
                            text="Regresar a mi predio"
                            className="hover:bg-blue-50"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistorialUserLoteDetail;