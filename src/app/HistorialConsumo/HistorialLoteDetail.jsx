import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../../components/NavBar'
import Modal from "../../components/Modal";
import axios from 'axios';
import { PDFDownloadButton } from '../../components/PdfGenerator';
import { CSVDownloadButton } from '../../components/CsvGenerator';
import FlowRateChart from "../../components/FlowRateChart";

const HistorialLoteDetail = () => {
    const { id_lot } = useParams();
    const [rawData, setRawData] = useState([]);
    const [processedData, setProcessedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);

    // Estado para información del predio y lote específico
    const [predioInfo, setPredioInfo] = useState({
        id_plot: 'N/A',
        owner: 'N/A',
        plot_name: 'N/A',
        owner_name: 'N/A',
        plot_extension: 'N/A',
        loading: true
    });

    const [currentLote, setCurrentLote] = useState({
        id_lot: id_lot,
        crop_name: 'N/A',
        crop_variety: 'N/A',
        soil_type_name: 'N/A',
        crop_type_name: 'N/A',
        is_activate: false
    });

    // Estado para las fechas seleccionadas
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Estado para opciones de agrupación
    const [groupByOption, setGroupByOption] = useState('day');
    
    // Estado para los modales
    const [showNoDataModal, setShowNoDataModal] = useState(false);

    const API_URL = import.meta.env.VITE_APP_API_URL;

    // Mapeo de tipos de suelo
    const soilTypeMap = {
        1: "Arcilla",
        2: "Franco arcilloso",
        3: "Franco",
        4: "Franco arenoso",
        5: "Arena",
        6: "Arcilla arenosa",
        7: "Franco arcilloarenoso",
        8: "Limo",
        9: "Arcilla limosa",
        10: "Franco arcillolimoso",
        11: "Franco limoso",
    };

    const cropTypeMap = {
        1: "Piscicultura",
        2: "Agricultura"
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

    // Función para extraer el ID del predio desde el ID del lote
    const extractPredioId = (loteId) => {
        // Formato esperado: "1564782-001" -> "PR-1564782"
        if (loteId && loteId.includes('-')) {
            const predioNumber = loteId.split('-')[0];
            return `PR-${predioNumber}`;
        }
        return null;
    };

    // Función para obtener información completa del predio y lote
    const fetchPredioAndLoteInfo = async (loteId) => {
        try {
            setPredioInfo(prev => ({ ...prev, loading: true }));
            
            // Extraer ID del predio desde el ID del lote
            const predioId = extractPredioId(loteId);
            
            if (!predioId) {
                throw new Error('No se pudo extraer el ID del predio desde el ID del lote');
            }

            console.log(`Obteniendo información del predio: ${predioId} para el lote: ${loteId}`);
            
            const response = await axios.get(
                `${API_URL}/plot-lot/plots/${predioId}`, 
                getAxiosConfig()
            );
            
            if (response.data) {
                console.log('Información del predio completa:', response.data);
                
                // Establecer información del predio
                setPredioInfo({
                    id_plot: response.data.id_plot || predioId,
                    owner: response.data.owner || 'N/A',
                    plot_name: response.data.plot_name || 'N/A',
                    owner_name: response.data.owner_name || 'N/A',
                    plot_extension: response.data.plot_extension || 'N/A',
                    latitud: response.data.latitud || 'N/A',
                    longitud: response.data.longitud || 'N/A',
                    is_activate: response.data.is_activate || false,
                    registration_date: response.data.registration_date || null,
                    loading: false
                });

                // Buscar el lote específico en la lista de lotes
                const loteEspecifico = response.data.lotes?.find(lote => lote.id_lot === loteId);
                
                if (loteEspecifico) {
                    console.log('Lote específico encontrado:', loteEspecifico);
                    setCurrentLote({
                        id_lot: loteEspecifico.id_lot,
                        crop_name: loteEspecifico.crop_name || 'N/A',
                        crop_variety: loteEspecifico.crop_variety || 'N/A',
                        crop_type: loteEspecifico.crop_type || 0,
                        soil_type: loteEspecifico.soil_type || 0,
                        soil_type_name: soilTypeMap[loteEspecifico.soil_type] || 'N/A',
                        crop_type_name: cropTypeMap[loteEspecifico.crop_type] || 'N/A',
                        is_activate: loteEspecifico.is_activate || false,
                        registration_date: loteEspecifico.registration_date || null
                    });
                } else {
                    console.warn(`Lote ${loteId} no encontrado en el predio ${predioId}`);
                    // Mantener valores por defecto
                }
            }
            
        } catch (err) {
            console.error('Error al obtener información del predio y lote:', err);
            setPredioInfo(prev => ({ 
                ...prev, 
                loading: false 
            }));
            
            // Mostrar error específico si no se encuentra el predio
            if (err.response?.status === 404) {
                console.error('Predio no encontrado. Verifique el formato del ID del lote.');
            }
        }
    };

    // Obtener información del predio y lote al montar el componente
    useEffect(() => {
        if (id_lot) {
            fetchPredioAndLoteInfo(id_lot);
        }
    }, [id_lot]);

    // Función para obtener datos de consumo
    const fetchData = async (startDate, endDate, groupOption) => {
        try {
            setLoading(true);
            
            const response = await axios.get(
                `${API_URL}/caudal/flow-measurements/lote/${id_lot}`,
                getAxiosConfig()
            );

            const responseData = response.data;
            console.log('Datos de consumo recibidos:', responseData);
            
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
                    

                    {/* Componente de gráfico */}
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

                    {/* Botones de descarga */}
                    <div className="mt-6 flex justify-center gap-4">
                        {chartRef && (
                            <PDFDownloadButton 
                                data={processedData} 
                                startDate={startDate} 
                                endDate={endDate} 
                                chartRef={chartRef}
                                disabled={!processedData || processedData.length === 0 || !startDate || !endDate || loading || error}
                                reportType="lote"
                                entityInfo={{
                                    // Información del lote
                                    loteId: currentLote.id_lot,
                                    loteName: `${currentLote.crop_name} - Lote ${currentLote.id_lot}`,
                                    
                                    // Información del propietario
                                    ownerId: predioInfo.owner, // Documento del propietario
                                    ownerName: predioInfo.owner_name, // Nombre del propietario
                                    
                                    // Información del predio
                                    predioId: predioInfo.id_plot,
                                    predioName: predioInfo.plot_name,
                                    
                                    // Información adicional para el PDF
                                    cropType: currentLote.crop_name,
                                    cropVariety: currentLote.crop_variety,
                                    soilType: currentLote.soil_type_name,
                                    plotExtension: predioInfo.plot_extension
                                }}
                                title={`HISTORIAL DE CONSUMO LOTE ${id_lot}`}
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