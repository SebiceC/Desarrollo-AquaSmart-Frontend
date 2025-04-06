import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // Import navigation hooks
import NavBar from "../../components/NavBar";
import { PDFDownloadButton } from "../../components/PdfGenerator"; 
import { CSVDownloadButton } from "../../components/CsvGenerator";
import FlowRateChart from "../../components/FlowRateChart";

const HistorialDistrito = () => {
  const [rawData, setRawData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const navigate = useNavigate(); // Add navigation hook
  const location = useLocation(); // Add location hook
  
  // Estado para las fechas actuales
  const [currentDateRange, setCurrentDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'day'
  });
  
  const API_URL = import.meta.env.VITE_APP_API_URL;
  
  // Use useEffect to fetch data when component mounts or when dependencies change
  useEffect(() => {
    fetchData(currentDateRange.startDate, currentDateRange.endDate, currentDateRange.groupBy);
    
    // Add cleanup function to prevent memory leaks
    return () => {
      // Cleanup code here if needed
    };
  }, [currentDateRange.startDate, currentDateRange.endDate, currentDateRange.groupBy]);
  
  // Función para obtener datos con axios
  const fetchData = async (startDate, endDate, groupBy) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        // Redirect to login if no token is found
        navigate('/login');
        return [];
      }
      
      const response = await axios.get(`${API_URL}/caudal/flow-measurements/bocatoma`, {
        headers: { 
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          start_date: startDate,
          end_date: endDate,
          group_by: groupBy
        }
      });
      
      console.log('Datos recibidos de la API:', response.data);
      
      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('No se recibieron datos válidos');
      }
      
      setRawData(response.data);
      return response.data;
    } catch (err) {
      console.error('Error en la carga de datos:', err);
      
      // Check if the error is due to authentication
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        // Token might be expired, redirect to login
        localStorage.removeItem("token");
        navigate('/login');
      }
      
      setError(`Error al cargar los datos: ${err.response?.data?.message || err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Manejadores de eventos para actualizar el estado en el componente principal
  const handleDateRangeChange = (startDate, endDate) => {
    setCurrentDateRange({
      ...currentDateRange,
      startDate,
      endDate
    });
  };
  
  const handleGroupByChange = (groupBy) => {
    setCurrentDateRange({
      ...currentDateRange,
      groupBy
    });
  };
  
  // Manejador para recibir los datos procesados del componente FlowRateChart
  const handleProcessedDataChange = (data) => {
    setProcessedData(data);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      {/* Contenedor principal con margen superior para separarlo del navbar */}
      <div className="flex-1 py-20">
        {/* Usamos el componente reutilizable de gráfica */}
        <FlowRateChart 
          rawData={rawData}
          fetchData={fetchData}
          title="HISTORIAL DEL CONSUMO DEL DISTRITO"
          chartRef={chartRef}
          isLoading={loading}
          apiError={error}
          onDateRangeChange={handleDateRangeChange}
          onGroupByChange={handleGroupByChange}
          onProcessedDataChange={handleProcessedDataChange}
          key={location.pathname} // Add key based on path to ensure re-render
        />
        
        {/* Botones para exportar los datos procesados */}
        <div className="mt-6 flex justify-center gap-4">
          {chartRef && (
            <PDFDownloadButton 
              data={processedData}
              startDate={currentDateRange.startDate} 
              endDate={currentDateRange.endDate} 
              chartRef={chartRef}
              disabled={!processedData || processedData.length === 0 || loading || error}
            />
          )}
          <CSVDownloadButton 
            data={processedData}
            startDate={currentDateRange.startDate} 
            endDate={currentDateRange.endDate} 
            disabled={!processedData || processedData.length === 0 || loading || error}
          />
        </div>
      </div>
    </div>
  );
};

export default HistorialDistrito;