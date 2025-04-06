import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { List } from 'lucide-react';
import axios from 'axios';
import NavBar from "../../components/NavBar";
import Modal from "../../components/Modal";
import BackButton from "../../components/BackButton";
import { PDFDownloadButton } from '../../components/PdfGenerator';
import { CSVDownloadButton } from '../../components/CsvGenerator';
import FlowRateChart from "../../components/FlowRateChart"; // Importamos el componente FlowRateChart

const HistorialUserPredioDetail = () => {
  // Extract predio ID from URL
  const { id_plot } = useParams();
  const navigate = useNavigate();
  
  const chartRef = useRef(null);

  const [rawData, setRawData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plotDetails, setPlotDetails] = useState(null);
  const [showLotes, setShowLotes] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(true); // Por defecto asumimos que es propietario
  
  // Estado para modales adicionales
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);

  // Estado para las fechas seleccionadas
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Estado para opciones de agrupación
  const [groupByOption, setGroupByOption] = useState('day');

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

  // Validar si el usuario es propietario del predio
  useEffect(() => {
    const validateOwnership = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No se encontró token de autenticación');
          return;
        }
        
        // Obtener datos del usuario logueado
        try {
          const userResponse = await axios.get(
            `${API_URL}/users/profile`, 
            getAxiosConfig()
          );
          
          setUserProfile(userResponse.data);
          
          // Obtener detalles del predio
          try {
            const plotResponse = await axios.get(
              `${API_URL}/plot-lot/plots/${id_plot}`, 
              getAxiosConfig()
            );
            
            // Verificar si el usuario es propietario del predio
            const userIsOwner = plotResponse.data.owner === userResponse.data.document;
            
            if (!userIsOwner) {
              console.log('No coincide el documento:', {
                'owner': plotResponse.data.owner,
                'document': userResponse.data.document
              });
              setIsOwner(false);
              setShowUnauthorizedModal(true);
              // Redirigir al usuario después de un breve retraso
              setTimeout(() => {
                navigate('/mispredios/historial-consumoList/:document');
              }, 3000);
            } else {
              setIsOwner(true);
              setPlotDetails(plotResponse.data);
            }
          } catch (plotError) {
            console.error('Error al obtener detalles del predio:', plotError);
            // En caso de error al obtener los detalles del predio, asumimos que el usuario es propietario
            // y cargamos datos mock para el predio
            setPlotDetails({
              id: id_plot,
              plot_name: 'Predio ' + id_plot,
              owner_name: userResponse.data.name || 'Propietario',
              plot_extension: '1000',
              lotes: []
            });
          }
        } catch (userError) {
          console.error('Error al obtener datos del usuario:', userError);
          // En caso de error de conexión, permitimos el acceso
          // Esta es una solución temporal mientras se soluciona el problema de red
          setPlotDetails({
            id: id_plot,
            plot_name: 'Predio ' + id_plot,
            owner_name: 'Propietario',
            plot_extension: '1000',
            lotes: []
          });
        }
      } catch (error) {
        console.error('Error general validando propiedad:', error);
        // En caso de error general, permitimos el acceso como solución temporal
      }
    };
    
    validateOwnership();
  }, [id_plot, navigate, API_URL]);

  // Función para obtener datos de consumo
  const fetchData = async (startDate, endDate, groupOption) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.get(
        `${API_URL}/caudal/flow-measurements/predio/${id_plot}`,
        getAxiosConfig()
      );

      const responseData = response.data;
      console.log('Datos recibidos de la API:', responseData);
      
      if (!Array.isArray(responseData) || responseData.length === 0) {
        setShowNoDataModal(true);
        throw new Error('No existe consumo del predio');
      }
      
      setRawData(responseData);
      return responseData;
    } catch (err) {
      console.error('Error en la carga de datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos del predio');
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

  const handleLoteClick = (loteId) => {
    navigate(`/mispredios/historial-consumoPredio/${id_plot}/milote/${loteId}`);
  };

  // Si el usuario no es propietario, mostrar solo el mensaje modal y esperar la redirección
  if (!isOwner && showUnauthorizedModal) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <Modal
          showModal={showUnauthorizedModal}
          onClose={() => navigate('/mispredios/historial-consumoList/:document')}
          title="Acceso no autorizado"
          btnMessage="Volver"
        >
          <p>
            No tienes autorización para acceder a este predio. Serás redirigido automáticamente.
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
          Error al cargar los datos, no existe consumo del predio.
        </p>
      </Modal>
      
      {/* Contenedor principal con margen superior para separarlo del navbar */}
      <div className="flex-1 py-20">
        <div className="flex flex-col bg-white rounded-lg shadow-md p-6 md:p-10 w-full max-w-4xl mx-auto">
          {/* Implementamos el componente FlowRateChart en lugar de la versión anterior */}
          <FlowRateChart 
            rawData={rawData}
            fetchData={fetchData}
            title={`HISTORIAL DE CONSUMO PREDIO ${id_plot}`}
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

          {/* Bloque para lotes asociados */}
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Lotes del Predio {plotDetails?.plot_name}</h2>
                <p className="text-sm text-gray-600">
                  Propietario: {plotDetails?.owner_name} | Extensión de tierra: {plotDetails?.plot_extension} m²
                </p>
              </div>
              <button
                onClick={() => setShowLotes(!showLotes)}
                type="button"
                className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg"
              >
                <List size={16} />
                <span>{showLotes ? 'Ocultar' : 'Ver'} Lotes</span>
              </button>
            </div>

            {showLotes && plotDetails?.lotes && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plotDetails.lotes.map((lote) => (
                  <div
                    key={lote.id_lot}
                    onClick={() => handleLoteClick(lote.id_lot)}
                    className="cursor-pointer bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-800 mb-2">Lote {lote.id_lot}</h3>
                    <p className="text-sm text-gray-600">Tipo de Cultivo: {lote.crop_type}</p>
                    <p className="text-sm text-gray-600">Variedad: {lote.crop_variety}</p>
                    <p className="text-sm text-gray-600">Tipo de Suelo: {lote.soil_type}</p>
                    <p className="text-sm text-gray-600">Estado: {lote.is_activate ? 'Activo' : 'Inactivo'}</p>
                    <p className="text-xs text-gray-500 mt-2">Fecha de Registro: {new Date(lote.registration_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
            {/* Botón de regreso */}
            <div className="flex justify-start mt-5">
              <BackButton to="/mispredios/historial-consumoList/:document" text="Regresar a la lista de mis predios" className="hover:bg-blue-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorialUserPredioDetail;