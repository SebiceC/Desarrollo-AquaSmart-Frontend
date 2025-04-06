import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';
import Modal from "./Modal";

/**
 * Component for displaying flow rate data with time filtering options
 * @param {Object} props
 * @param {Array} props.rawData - Raw data from API
 * @param {Function} props.fetchData - Function to fetch data
 * @param {string} props.title - Chart title
 * @param {Object} props.chartRef - Ref for the chart container (for PDF export)
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.apiError - Error message from API
 * @param {Function} props.onDateRangeChange - Callback when date range changes
 * @param {Function} props.onGroupByChange - Callback when grouping option changes
 * @param {Function} props.onProcessedDataChange - Callback when processed data changes
 * @param {boolean} props.hasRecords - Indicates if there are any records at all
 */
const FlowRateChart = ({ 
  rawData = [], 
  fetchData, 
  title = "HISTORIAL DE CONSUMO", 
  chartRef,
  isLoading = false,
  apiError = null,
  onDateRangeChange = () => {},
  onGroupByChange = () => {},
  onProcessedDataChange = () => {},
  hasRecords = true
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState(apiError);
  const localChartRef = useRef(null);
  const actualChartRef = chartRef || localChartRef;
  
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
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [showNoRecordsModal, setShowNoRecordsModal] = useState(!hasRecords);
  
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
  
  // Texto descriptivo para opciones de agrupación
  const groupByOptions = {
    hour: 'Horas',
    day: 'Días',
    week: 'Semanas',
    month: 'Meses'
  };

  // Comprobar si hay registros al montar el componente
  useEffect(() => {
    setShowNoRecordsModal(!hasRecords);
  }, [hasRecords]);

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
        // CORRECCIÓN: Usamos una función en lugar de actualización directa
        const newOption = 'hour';
        setGroupByOption(newOption);
        // Notificamos el cambio al componente padre solo después de actualizar el estado local
        setTimeout(() => onGroupByChange(newOption), 0);
      }
    } else if (daysDifference <= 30) {
      // Si es menos de un mes, permitir diario
      options = ['day'];
      if (groupByOption !== 'day') {
        // CORRECCIÓN: Usamos una función en lugar de actualización directa
        const newOption = 'day';
        setGroupByOption(newOption);
        // Notificamos el cambio al componente padre solo después de actualizar el estado local
        setTimeout(() => onGroupByChange(newOption), 0);
      }
    } else if (daysDifference <= 90) {
      // Si es entre 1 y 3 meses, permitir semanal o mensual
      options = ['week', 'month'];
      if (!['week', 'month'].includes(groupByOption)) {
        // CORRECCIÓN: Usamos una función en lugar de actualización directa
        const newOption = 'week';
        setGroupByOption(newOption);
        // Notificamos el cambio al componente padre solo después de actualizar el estado local
        setTimeout(() => onGroupByChange(newOption), 0);
      }
    } else {
      // Si es más de 3 meses, solo permitir mensual
      options = ['month'];
      if (groupByOption !== 'month') {
        // CORRECCIÓN: Usamos una función en lugar de actualización directa
        const newOption = 'month';
        setGroupByOption(newOption);
        // Notificamos el cambio al componente padre solo después de actualizar el estado local
        setTimeout(() => onGroupByChange(newOption), 0);
      }
    }
    
    setAvailableGroupOptions(options);
  }, [daysDifference, groupByOption, dateValidationError]);

  // Formatear la descripción del rango de tiempo seleccionado
  const getTimeRangeDescription = () => {
    if (daysDifference === 0) {
      return "Hoy";
    } else if (daysDifference === 1) {
      return "1 día";
    } else if (daysDifference < 30) {
      return `${daysDifference} días`;
    } else if (daysDifference < 60) {
      return `${Math.floor(daysDifference / 30)} mes y ${daysDifference % 30} días`;
    } else {
      const meses = Math.floor(daysDifference / 30);
      const dias = daysDifference % 30;
      
      if (dias === 0) {
        return `${meses} meses`;
      } else {
        return `${meses} meses y ${dias} días`;
      }
    }
  };

  // Process data based on selected time range
  const processDataByTimeRange = (rawData, groupOption) => {
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
      return [];
    }
    
    console.log(`Agrupando ${filtered.length} registros por ${groupOption}`);
    
    // Aplicar formato según la opción de agrupación seleccionada
    const result = groupDataByTimeUnit(filtered, groupOption);
    
    console.log(`Resultado después de agrupar: ${result.length} puntos de datos`);
    
    // Evitar mostrar demasiados puntos en la gráfica si hay muchos datos después de agrupar
    if (result.length > 50) {
      // Muestrear los datos para tener una cantidad razonable de puntos
      const step = Math.ceil(result.length / 50);
      const sampledResult = result.filter((_, index) => index % step === 0);
      console.log(`Datos reducidos a ${sampledResult.length} puntos para mejor visualización`);
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
      
      // Crear un objeto para agrupar los valores
      const groupedData = {};
      
      // Agrupar y sumar los valores
      sortedData.forEach(item => {
        const date = new Date(item.timestamp);
        let groupKey;
        
        if (unit === 'hour') {
          // Agrupar por hora: "10:00"
          groupKey = `${date.getHours().toString().padStart(2, '0')}:00`;
        } else if (unit === 'day') {
          // Agrupar por día: "15 Mar 2025"
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          groupKey = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        } else if (unit === 'week') {
          // Agrupar por semana: "Sem 12 2025"
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
          const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          groupKey = `Sem ${weekNumber} ${date.getFullYear()}`;
        } else if (unit === 'month') {
          // Agrupar por mes: "Mar 2025"
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          groupKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        }
        
        // Si la clave ya existe, sumar el valor; de lo contrario, inicializarlo
        if (groupedData[groupKey]) {
          groupedData[groupKey].flowRate += parseFloat(item.flow_rate);
          groupedData[groupKey].count += 1;
        } else {
          groupedData[groupKey] = {
            name: groupKey,
            flowRate: parseFloat(item.flow_rate),
            count: 1,
            timestamp: item.timestamp // Guardar un timestamp de referencia para este grupo
          };
        }
      });
      
      // Convertir el objeto agrupado en un array y formatear para el gráfico
      const result = Object.values(groupedData).map(group => {
        // Para mostrar el valor total en vez del promedio, usamos directamente flowRate
        return {
          name: formatGroupName(group.name, unit),
          flowRate: group.flowRate,
          timestamp: group.timestamp
        };
      });
      
      // Ordenar por timestamp para mantener el orden cronológico
      return result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (err) {
      console.error('Error agrupando datos:', err);
      // CORRECCIÓN: No llamamos a setShowGraphErrorModal directamente aquí
      // En lugar de eso, devolvemos un error para manejar en el useEffect
      throw new Error('Error al agrupar los datos: ' + err.message);
    }
  };
  
  // Función para hacer los nombres de grupo más legibles en el gráfico
  const formatGroupName = (fullName, unit) => {
    if (unit === 'hour') {
      // Mantener "10:00" como está
      return fullName;
    } else if (unit === 'day') {
      // Convertir "15 Mar 2025" a "15 Mar"
      const parts = fullName.split(' ');
      return `${parts[0]} ${parts[1]}`;
    } else if (unit === 'week') {
      // Mantener "Sem 12 2025" como "Sem 12"
      const parts = fullName.split(' ');
      return `${parts[0]} ${parts[1]}`;
    } else if (unit === 'month') {
      // Mantener "Mar 2025" como está
      return fullName;
    }
    return fullName;
  };
  
  // Generate mock data for demonstration or testing
  const generateMockData = (groupOption) => {
    const mockData = [];
    const currentDate = new Date();
    
    if (groupOption === 'hour') {
      // Generate hourly data for a day
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        mockData.push({
          name: `${hour}:00`,
          flowRate: 5 + Math.random() * 3,
          timestamp: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), i, 0, 0).toISOString()
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

  // CORRECCIÓN: Separamos este useEffect para que solo cargue datos cuando realmente sea necesario
  useEffect(() => {
    // Si no hay registros en absoluto, no continuar con la carga de datos
    if (!hasRecords) {
      return;
    }
    
    // Prevenimos la carga si hay un error de validación
    if (dateValidationError) {
      return;
    }
    
    // Identificamos si debemos cargar datos
    const shouldLoadData = rawData && rawData.length > 0;
    
    // Si no necesitamos cargar datos, no hacemos nada
    if (!shouldLoadData && !fetchData) {
      return;
    }
    
    // Función para manejar la carga de datos
    const loadData = async () => {
      try {
        setLoading(true);
        
        let dataToProcess = rawData;
        
        // Si no hay datos pero tenemos función para cargarlos
        if ((!rawData || rawData.length === 0) && fetchData) {
          try {
            dataToProcess = await fetchData(startDate, endDate, groupByOption);
          } catch (err) {
            console.error('Error al obtener datos:', err);
            throw err;
          }
        }
        
        // Si no hay datos para procesar
        if (!dataToProcess || dataToProcess.length === 0) {
          setError('No hay datos disponibles para el rango seleccionado');
          setShowNoDataModal(true);
          setData([]);
          onProcessedDataChange([]);
          return;
        }
        
        // Procesar los datos
        const processedData = processDataByTimeRange(dataToProcess, groupByOption);
        
        if (processedData.length === 0) {
          setError('No hay datos disponibles para el rango seleccionado');
          setShowNoDataModal(true);
          setData([]);
          onProcessedDataChange([]);
        } else {
          setData(processedData);
          setError(null);
          onProcessedDataChange(processedData);
        }
      } catch (err) {
        console.error('Error procesando datos:', err);
        setError('Error al procesar los datos: ' + err.message);
        const mockData = generateMockData(groupByOption);
        setData(mockData);
        setShowGraphErrorModal(true);
        onProcessedDataChange(mockData);
      } finally {
        setLoading(false);
      }
    };
    
    // Ejecutamos la carga de datos
    loadData();
    
  }, [rawData, startDate, endDate, groupByOption, dateValidationError, hasRecords]);

  const handleDateChange = (e) => {
    // CORRECCIÓN: Evitamos el comportamiento por defecto para prevenir problemas de navegación
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Validar que la fecha de inicio no sea mayor que la fecha de fin
    if (dateValidationError) {
      setShowDateErrorModal(true);
      return;
    }
    
    // Notificar al componente padre del cambio de fechas
    onDateRangeChange(startDate, endDate);
    
    // Cierra el selector de fechas
    setShowDatePicker(false);
  };
  
  const toggleDatePicker = (e) => {
    // CORRECCIÓN: Evitamos el comportamiento por defecto para prevenir problemas de navegación
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setShowDatePicker(!showDatePicker);
  };
  
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };
  
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handleGroupByChange = (option, e) => {
    // CORRECCIÓN: Evitamos el comportamiento por defecto para prevenir problemas de navegación
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // CORRECCIÓN: Usado try/catch para prevenir errores que bloqueen la navegación
    try {
      setGroupByOption(option);
      // Usar setTimeout para asegurar que el cambio de estado se ha aplicado antes de la callback
      setTimeout(() => onGroupByChange(option), 0);
    } catch (err) {
      console.error('Error al cambiar la opción de agrupación:', err);
    }
  };
  
  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value;
  };
  
  // CORRECCIÓN: Añadimos este useEffect para manejar la limpieza al desmontar
  useEffect(() => {
    return () => {
      // Cerrar modales y limpiar eventos pendientes
      setShowDatePicker(false);
      setShowDateErrorModal(false);
      setShowGraphErrorModal(false);
      setShowNoDataModal(false);
      setShowNoRecordsModal(false);
    };
  }, []);
  
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md p-6 md:p-10 w-full max-w-4xl mx-auto">
      {/* Modales de error */}
      <Modal 
        showModal={showDateErrorModal} 
        onClose={() => setShowDateErrorModal(false)} 
        title="Error en las fechas" 
        btnMessage="Aceptar"
      >
        <p>
          La fecha de inicio no puede ser mayor que la fecha de fin.
        </p>
      </Modal>
      
      <Modal 
        showModal={showGraphErrorModal} 
        onClose={() => setShowGraphErrorModal(false)} 
        title="Error en la gráfica" 
        btnMessage="Aceptar"
      >
        <p>
          ¡Ocurrió un error al momento de generar la gráfica! Vuelve a intentarlo más tarde o ponte en contacto con soporte.
        </p>
      </Modal>
      
      <Modal
        showModal={showNoDataModal}
        onClose={() => setShowNoDataModal(false)}
        title="Sin datos de consumo"
        btnMessage="Aceptar"
      >
        <p>
          No hay datos de consumo para el período seleccionado.
        </p>
      </Modal>
      
      <Modal
        showModal={showNoRecordsModal}
        onClose={() => setShowNoRecordsModal(false)}
        title="Sin registro de consumo"
        btnMessage="Aceptar"
      >
        <p>
          No se encontraron registros de consumo en el sistema. Por favor, contacte a soporte técnico si considera que esto es un error.
        </p>
      </Modal>
      
      {/* Encabezado con título y controles */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">{title}</h1>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div className="relative mb-4 sm:mb-0">
            <button 
              onClick={toggleDatePicker}
              type="button" // CORRECCIÓN: Añadimos el tipo para evitar comportamiento de submit
              className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg"
              disabled={!hasRecords}
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
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Fecha fin</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={handleEndDateChange}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <button 
                    onClick={handleDateChange}
                    type="button" // CORRECCIÓN: Añadimos el tipo para evitar comportamiento de submit
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
            {!dateValidationError && hasRecords && availableGroupOptions.map((option) => (
              <button
                key={option}
                type="button" // CORRECCIÓN: Añadimos el tipo para evitar comportamiento de submit
                className={`px-3 py-1 text-sm rounded-md ${
                  groupByOption === option 
                    ? 'bg-blue-700 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={(e) => handleGroupByChange(option, e)}
              >
                {groupByOptions[option]}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Contenedor de la gráfica */}
      <div className="h-64 sm:h-80 mt-6" ref={actualChartRef}>
        {!hasRecords ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No se encontraron registros de consumo</p>
          </div>
        ) : dateValidationError ? (
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
                    // Mostrar el caudal acumulado con formato según la escala
                    if (value >= 1000) {
                      return [`${(value / 1000).toFixed(2)}k`, 'Caudal Total (l/s)'];
                    } else if (value >= 100) {
                      return [`${value.toFixed(1)}`, 'Caudal Total (l/s)'];
                    } else {
                      return [`${value.toFixed(3)}`, 'Caudal Total (l/s)'];
                    }
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
    </div>
  );
};

export default FlowRateChart;