import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../../components/NavBar'
import Modal from "../../components/Modal";
import axios from 'axios';
import { PDFDownloadButton } from '../../components/PdfGenerator';
import { CSVDownloadButton } from '../../components/CsvGenerator';
import FlowRateChart from "../../components/FlowRateChart"; // Importamos el componente FlowRateChart

const HistorialLoteDetail = () => {
    const { id_lot } = useParams();
    const [rawData, setRawData] = useState([]);
    const [processedData, setProcessedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);

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

    // Función para obtener datos
    const fetchData = async (startDate, endDate, groupOption) => {
        try {
            setLoading(true);
            
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

            {/* Contenedor principal con margen superior para separarlo del navbar */}
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
                </div>
            </div>
        </div>
    );
};

export default HistorialLoteDetail;