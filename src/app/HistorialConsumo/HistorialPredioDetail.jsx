import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown, List } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from "../../components/NavBar";
import Modal from "../../components/Modal";

const HistorialPredioDetail = () => {
  // Extract predio ID from URL
  const { id_plot } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plotDetails, setPlotDetails] = useState(null);
  const [showLotes, setShowLotes] = useState(false);

  // Estado para las fechas seleccionadas
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estado para opciones de agrupación
  const [groupByOption, setGroupByOption] = useState('day'); // 'hour', 'day', 'week', 'month'
  const [availableGroupOptions, setAvailableGroupOptions] = useState(['hour']);

  // Estado para los modales
  const [showDateErrorModal, setShowDateErrorModal] = useState(false);
  const [showGraphErrorModal, setShowGraphErrorModal] = useState(false);

  const API_URL = import.meta.env.VITE_APP_API_URL;

  // Calcular la diferencia en días entre las fechas seleccionadas
  const daysDifference = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  // Determinar si hay un error de validación en las fechas
  const dateValidationError = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start > end;
  }, [startDate, endDate]);

  // Determinar las opciones de agrupación disponibles según el rango de fechas
  useEffect(() => {
    if (dateValidationError) {
      return; // No continuar si hay error de validación
    }

    let options = [];

    if (daysDifference <= 1) {
      // Si es un solo día, solo permitir ver por horas
      options = ['hour'];
      if (groupByOption !== 'hour') {
        setGroupByOption('hour');
      }
    } else if (daysDifference <= 30) {
      // Si es entre 1 día y 1 mes, permitir diario
      options = ['day'];
      if (groupByOption !== 'day') {
        setGroupByOption('day');
      }
    } else if (daysDifference <= 60) {
      // Si es entre 1 y 2 meses, permitir diario o semanal
      options = ['day', 'week'];
      if (!['day', 'week'].includes(groupByOption)) {
        setGroupByOption('day');
      }
    } else {
      // Si es más de 2 meses, permitir todas las opciones
      options = ['day', 'week', 'month'];
      if (!['day', 'week', 'month'].includes(groupByOption)) {
        setGroupByOption('week');
      }
    }

    setAvailableGroupOptions(options);
  }, [daysDifference, groupByOption]);

  // Texto descriptivo para opciones de agrupación
  const groupByOptions = {
    hour: 'Horas',
    day: 'Días',
    week: 'Semanas',
    month: 'Meses'
  };

  // Formatear la descripción del rango de tiempo seleccionado
  const getTimeRangeDescription = () => {
    if (daysDifference === 0) {
      return "Hoy";
    } else if (daysDifference === 1) {
      return "1 día";
    } else if (daysDifference <= 30) {
      return `${daysDifference} días`;
    } else if (daysDifference <= 60) {
      return `${Math.floor(daysDifference / 30)} mes y ${daysDifference % 30} días`;
    } else {
      return `${Math.floor(daysDifference / 30)} meses`;
    }
  };

  console.log(id_plot)
  useEffect(() => {
    // No realizar la petición si hay error de validación en las fechas
    if (dateValidationError || !id_plot) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/caudal/flow-measurements/predio/${id_plot}`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`, // Add this line
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar los datos del predio');
        }

        const rawData = await response.json();
        console.log('Datos recibidos de la API:', rawData);

        if (!Array.isArray(rawData) || rawData.length === 0) {
          throw new Error('No se recibieron datos válidos');
        }

        const filteredData = processDataByTimeRange(rawData, groupByOption);
        console.log('Datos procesados para la gráfica:', filteredData);

        if (filteredData.length === 0) {
          setError('No hay datos disponibles para el rango seleccionado');
        } else {
          setData(filteredData);
          setError(null);
        }
      } catch (err) {
        console.error('Error en la carga de datos:', err);
        setError('Error al cargar los datos: ' + err.message);
        setData(generateMockData(groupByOption));
        setShowGraphErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupByOption, startDate, endDate, dateValidationError, id_plot]);

  useEffect(() => {
    // Modificar el fetch para obtener detalles del predio y lotes
    const fetchPlotDetails = async () => {
      try {
        const token = localStorage.getItem('token'); // Ajusta según tu método de autenticación

        const response = await fetch(`${API_URL}/plot-lot/plots/${id_plot}`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar los detalles del predio');
        }

        const data = await response.json();
        setPlotDetails(data);
      } catch (err) {
        console.error('Error en la carga de detalles:', err);
        // Datos mock en caso de error
        setPlotDetails({
          id: id_plot,
          name: 'Predio de Ejemplo',
          lots: [
            { id: 1, name: 'No hay datos disponibles', area: 1000, crop: 'No hay datos disponibles' }
          ]
        });
      }
    };

    if (id_plot) {
      fetchPlotDetails();
    }
  }, [id_plot]);

  // Process data based on selected time range
  const processDataByTimeRange = (rawData, groupOption) => {
    console.log('Procesando datos con agrupación:', groupOption);
    console.log('Fecha inicio:', startDate, 'Fecha fin:', endDate);

    // Parse dates and filter by selected date range
    const filtered = rawData.filter(item => {
      try {
        const itemDate = new Date(item.timestamp);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include all of end date

        return itemDate >= start && itemDate <= end;
      } catch (err) {
        console.error('Error procesando fecha:', err, item);
        return false;
      }
    });

    if (filtered.length === 0) {
      console.log('No se encontraron datos en el rango de fechas seleccionado');
      return [];
    }

    console.log('Datos filtrados por fecha:', filtered.length, 'registros');

    // Aplicar formato según la opción de agrupación seleccionada
    const result = groupDataByTimeUnit(filtered, groupOption);

    // Evitar mostrar demasiados puntos en la gráfica si hay muchos datos
    if (result.length > 50) {
      // Muestrear los datos para tener una cantidad razonable de puntos
      const step = Math.ceil(result.length / 50);
      const sampledResult = result.filter((_, index) => index % step === 0);
      console.log(`Datos reducidos de ${result.length} a ${sampledResult.length} puntos para mejor visualización`);
      return sampledResult;
    }

    return result;
  };

  const groupDataByTimeUnit = (data, unit) => {
    try {
      // Ordenar datos por timestamp para mantener orden cronológico
      const sortedData = [...data].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });

      // Mapear cada dato a un formato adecuado para la gráfica
      // sin agrupar ni promediar, solo asignando etiquetas para el eje X
      return sortedData.map(item => {
        const date = new Date(item.timestamp);
        let name;

        if (unit === 'hour') {
          // Formato: "10:30"
          name = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (unit === 'day') {
          // Formato: "15 Mar"
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          name = `${date.getDate()} ${months[date.getMonth()]}`;
        } else if (unit === 'week') {
          // Formato: "Sem 12"
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
          const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          name = `Sem ${weekNumber}`;
        } else if (unit === 'month') {
          // Formato: "Mar 2025"
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          name = `${months[date.getMonth()]} ${date.getFullYear()}`;
        }

        return {
          name,
          flowRate: parseFloat(item.flow_rate),
          timestamp: item.timestamp // Mantener el timestamp original para posibles usos
        };
      });
    } catch (err) {
      console.error('Error agrupando datos:', err);
      setShowGraphErrorModal(true);
      return [];
    }
  };

  // Generate mock data for demonstration
  const generateMockData = (groupOption) => {
    const mockData = [];
    const currentDate = new Date();

    if (groupOption === 'hour') {
      // Generate hourly data for a day
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        mockData.push({
          name: `${hour}:00`,
          flowRate: 5 + Math.random() * 3 // Smaller values for better visibility
        });
      }
    } else if (groupOption === 'day') {
      // Generate daily data for a month
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      for (let i = 1; i <= 30; i++) {
        mockData.push({
          name: `${i} ${months[currentDate.getMonth()]}`,
          flowRate: 5 + Math.random() * 3
        });
      }
    } else if (groupOption === 'week') {
      // Generate weekly data
      for (let i = 1; i <= 10; i++) {
        mockData.push({
          name: `Sem ${i}`,
          flowRate: 5 + Math.random() * 3
        });
      }
    } else if (groupOption === 'month') {
      // Generate monthly data
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      for (let i = 0; i < 12; i++) {
        mockData.push({
          name: `${months[i]} ${currentDate.getFullYear()}`,
          flowRate: 5 + Math.random() * 3
        });
      }
    }

    return mockData;
  };

  const handleDateChange = () => {
    // Validar que la fecha de inicio no sea mayor que la fecha de fin
    if (dateValidationError) {
      setShowDateErrorModal(true);
      return;
    }

    // Cierra el selector de fechas
    setShowDatePicker(false);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value;
  };

  const handleLoteClick = (loteId) => {
    navigate(`/historial-consumo/predio/${id_plot}/lote/${loteId}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {/* Modal de error de fechas */}
      <Modal
        showModal={showDateErrorModal}
        onClose={() => setShowDateErrorModal(false)}
        title="Error en las fechas"
        btnMessage="Entendido"
      >
        <p>
          La fecha de inicio no puede ser mayor que la fecha de fin.
        </p>
      </Modal>

      {/* Modal de error en la gráfica */}
      <Modal
        showModal={showGraphErrorModal}
        onClose={() => setShowGraphErrorModal(false)}
        title="Error en la gráfica"
        btnMessage="Entendido"
      >
        <p>
          ¡Ocurrió un error al momento de generar la gráfica! Vuelve a intentarlo más tarde o ponte en contacto con soporte.
        </p>
      </Modal>

      {/* Contenedor principal con margen superior para separarlo del navbar */}
      <div className="flex-1 py-20">
        <div className="flex flex-col bg-white rounded-lg shadow-md p-6 md:p-10 w-full max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">HISTORIAL DE CONSUMO PREDIO {id_plot}</h1>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="relative mb-4 sm:mb-0">
                <button
                  onClick={toggleDatePicker}
                  className={`flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg`}
                >
                  <Calendar size={16} />
                  <span>Intervalo: {getTimeRangeDescription()}</span>
                  <ChevronDown size={16} />
                </button>

                {showDatePicker && (
                  <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-10 border border-gray-200">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha inicio</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={handleStartDateChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha fin</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={handleEndDateChange}
                        />
                      </div>
                      <button
                        onClick={handleDateChange}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de tipo de agrupación */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {!dateValidationError && availableGroupOptions.map((option) => (
                  <button
                    key={option}
                    className={`px-3 py-1 text-sm rounded-md ${groupByOption === option
                        ? 'bg-blue-700 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    onClick={() => setGroupByOption(option)}
                  >
                    {groupByOptions[option]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-80 mt-6">
            {dateValidationError ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">Por favor, corrija las fechas seleccionadas</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Cargando datos...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">{error}</p>
              </div>
            ) : data.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No hay datos disponibles para el rango seleccionado</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#E5E7EB' }}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#E5E7EB' }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#E5E7EB' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'flowRate') {
                        return [`${value.toFixed(3)}`, 'Caudal (m³/s)'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(value) => `${value}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="flowRate"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ stroke: '#3B82F6', strokeWidth: 2, r: 4, fill: 'white' }}
                    activeDot={{ stroke: '#1E40AF', strokeWidth: 2, r: 6, fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button className="flex items-center gap-2 bg-red-200 text-red-700 px-4 py-2 rounded-md text-sm hover:bg-red-300">
              <span>Descargar Historial</span>
            </button>
            <button className="flex items-center gap-2 bg-green-200 text-green-700 px-4 py-2 rounded-md text-sm hover:bg-green-300">
              <span>Descargar Historial</span>
            </button>
          </div>

          {/* Nuevo bloque para lotes asociados */}
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
          </div>
        </div>
      </div>
    </div>
  );
};


export default HistorialPredioDetail;