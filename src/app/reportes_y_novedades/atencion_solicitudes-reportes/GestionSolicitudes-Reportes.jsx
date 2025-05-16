import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "../../../components/Modal";
import DataTable from "../../../components/DataTable";
import { Eye } from "lucide-react";
import InputFilterGestionSolRep from "../../../components/InputFilterGestionSolRep";
import GestionSolicitudModal from "./GestionSolicitudModal";
// Importar los nuevos modales
import CancelacionDefinitivaModal from "./CancelacionDefinitivaModal";
import FallaSuministroModal from "./FallaSuministroModal";
import FallaAplicativoModal from "./FallaAplicativoModal";

const GestionSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState(null); // Inicialmente null para que no muestre datos
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("error"); // 'error' o 'success'
  const [filters, setFilters] = useState({
    id: "",
    createdBy: "",  // Campo para filtrar por ID de usuario (created_by)
    solicitudType: "", // 'solicitud' o 'reporte'
    subType: "",       // Tipo específico de solicitud o reporte
    status: "", // 'pendiente', 'en proceso', 'a espera de aprobacion', 'finalizado', 'rechazada'
    startDate: "",
    endDate: "",
  });
  
  // Estado para el objeto de solicitud/reporte seleccionado
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  
  // Estados para controlar la visibilidad de cada modal
  const [showGestionModal, setShowGestionModal] = useState(false);
  const [showCancelacionDefinitivaModal, setShowCancelacionDefinitivaModal] = useState(false);
  const [showFallaSuministroModal, setShowFallaSuministroModal] = useState(false);
  const [showFallaAplicativoModal, setShowFallaAplicativoModal] = useState(false);

  const API_URL = import.meta.env.VITE_APP_API_URL;

  // Mapa de estados aceptados para normalización
  const statusNormalizeMap = {
    "pendiente": "pendiente",
    "en proceso": "en proceso", 
    "a espera de aprobacion": "a espera de aprobacion",
    "a espera de aprobación": "a espera de aprobacion", // Variante con tilde
    "finalizado": "finalizado",
    "rechazada": "rechazada"
  };

  // Estados aceptados y sus correspondientes visualizaciones
  const statusDisplayMap = {
    'pendiente': 'Pendiente',
    'en proceso': 'En Proceso',
    'a espera de aprobacion': 'A Espera de Aprobación',
    'finalizado': 'Finalizado',
    'rechazada': 'Rechazada'
  };

  // Colores para los estados
  const statusClasses = {
    "pendiente": "bg-yellow-100 text-yellow-800 border border-yellow-300",
    "en proceso": "bg-blue-100 text-blue-800 border border-blue-300",
    "a espera de aprobacion": "bg-orange-100 text-orange-800 border border-orange-300",
    "finalizado": "bg-green-100 text-green-800 border border-green-300",
    "rechazada": "bg-red-100 text-red-800 border border-red-200"
  };

  // Mapa de tipos de solicitud/reporte para visualización
  const typeMap = {
    // Solicitudes
    'cambio_caudal': 'Cambio de Caudal',
    'cancelacion definitiva de caudal': 'Cancelación Definitiva',
    'cancelacion temporal de caudal': 'Cancelación Temporal',
    'activacion': 'Activación',
    // Reportes
    'falla_suministro': 'Falla en Suministro',
    'falla_aplicativo': 'Falla en Aplicativo'
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Función para normalizar un estado para comparación
  const normalizeStatus = (status) => {
    if (!status) return "";
    
    // Convertir a minúsculas y quitar espacios extra
    const cleanStatus = status.toLowerCase().trim();
    
    // Usar el mapa de normalización para convertir a formato estándar
    return statusNormalizeMap[cleanStatus] || cleanStatus;
  };

  // Función para obtener el tipo específico del item según si es solicitud o reporte
  const getItemSpecificType = (item) => {
    if (item.reportType === 'solicitud') {
      return item.flow_request_type;
    } else if (item.reportType === 'reporte') {
      return item.failure_type;
    }
    return "";
  };

  // Función para aplicar filtros a datos específicos
  const applyFiltersToData = (dataToFilter) => {
    try {
      // Verificamos si hay al menos un filtro aplicado
      const hasActiveFilters = 
        filters.id.trim() !== "" || 
        filters.createdBy.trim() !== "" || 
        filters.solicitudType !== "" || 
        filters.subType !== "" ||
        filters.status !== "" ||
        filters.startDate !== "" || 
        filters.endDate !== "";

      // Si no hay filtros activos, mostramos todos los datos
      if (!hasActiveFilters) {
        setFilteredData(dataToFilter);
        return;
      }

      // Preparar el estado del filtro normalizado
      const filterStatusNormalized = normalizeStatus(filters.status);

      // Filtrado de datos
      const filtered = dataToFilter.filter((item) => {
        // Filtro por ID de reporte/solicitud
        const matchesId = filters.id.trim() === "" ||
          (item.id && item.id.toString().includes(filters.id.trim()));

        // Filtro por ID de usuario (created_by)
        const matchesCreatedBy = filters.createdBy.trim() === "" ||
          (item.created_by && item.created_by.toString().includes(filters.createdBy.trim()));

        // Filtro por tipo de solicitud/reporte
        const matchesSolicitudType = filters.solicitudType === "" ||
          item.reportType === filters.solicitudType;
          
        // Obtener el tipo específico según si es solicitud o reporte
        const specificType = getItemSpecificType(item);
          
        // Filtro por subtipo específico
        const matchesSubType = filters.subType === "" || specificType === filters.subType;

        // Filtro por estado - normalizar para hacer la comparación más robusta
        const itemStatusNormalized = normalizeStatus(item.status);
        
        // Verificar si el estado del item coincide con el filtro de estado
        const matchesStatus = filterStatusNormalized === "" || 
                             itemStatusNormalized === filterStatusNormalized;

        // Manejo de fechas
        let matchesDate = true;
        
        if (filters.startDate !== "" || filters.endDate !== "") {
          const itemDate = new Date(item.created_at);
          const itemDateStr = itemDate.toISOString().split('T')[0];
          
          if (filters.startDate !== "") {
            const startDateStr = new Date(filters.startDate).toISOString().split('T')[0];
            if (itemDateStr < startDateStr) {
              matchesDate = false;
            }
          }
          
          if (matchesDate && filters.endDate !== "") {
            const endDateStr = new Date(filters.endDate).toISOString().split('T')[0];
            if (itemDateStr > endDateStr) {
              matchesDate = false;
            }
          }
        }

        return matchesId && matchesCreatedBy && matchesSolicitudType && matchesSubType && matchesStatus && matchesDate;
      });

      setFilteredData(filtered);
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
      setFilteredData([]);
    }
  };

  const applyFilters = () => {
    try {
      // Verificamos si hay al menos un filtro aplicado
      const hasActiveFilters = 
        filters.id.trim() !== "" || 
        filters.createdBy.trim() !== "" || 
        filters.solicitudType !== "" || 
        filters.subType !== "" ||
        filters.status !== "" ||
        filters.startDate !== "" || 
        filters.endDate !== "";

      // Si no hay filtros activos, mostramos todos los datos
      if (!hasActiveFilters) {
        setFilteredData(allData);
        return;
      }

      // Validación: solo números en ID de usuario y de solicitud
      if (filters.id.trim() !== "" && !/^\d+$/.test(filters.id.trim())) {
        setModalMessage("El campo de filtrado de ID de reporte/solicitud contiene caracteres no válidos.");
        setModalType("error");
        setShowModal(true);
        return;
      }

      if (filters.createdBy.trim() !== "" && !/^\d+$/.test(filters.createdBy.trim())) {
        setModalMessage("El campo de filtrado por ID de usuario contiene caracteres no válidos.");
        setModalType("error");
        setShowModal(true);
        return;
      }

      // Validación de fechas
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
        setModalType("error");
        setShowModal(true);
        setFilteredData([]);
        return;
      }

      // Preparar el estado del filtro normalizado
      const filterStatusNormalized = normalizeStatus(filters.status);

      // Filtrado de datos
      const filtered = allData.filter((item) => {
        // Filtro por ID de reporte/solicitud
        const matchesId = filters.id.trim() === "" ||
          (item.id && item.id.toString().includes(filters.id.trim()));

        // Filtro por ID de usuario (created_by)
        const matchesCreatedBy = filters.createdBy.trim() === "" ||
          (item.created_by && item.created_by.toString().includes(filters.createdBy.trim()));

        // Filtro por tipo de solicitud/reporte
        const matchesSolicitudType = filters.solicitudType === "" ||
          item.reportType === filters.solicitudType;
          
        // Obtener el tipo específico según si es solicitud o reporte
        const specificType = getItemSpecificType(item);
          
        // Filtro por subtipo específico
        const matchesSubType = filters.subType === "" || specificType === filters.subType;

        // Filtro por estado - normalizar para hacer la comparación más robusta
        const itemStatusNormalized = normalizeStatus(item.status);
        
        // Verificar si el estado del item coincide con el filtro de estado
        const matchesStatus = filterStatusNormalized === "" || 
                             itemStatusNormalized === filterStatusNormalized;

        // Manejo de fechas
        let matchesDate = true;
        
        if (filters.startDate !== "" || filters.endDate !== "") {
          const itemDate = new Date(item.created_at);
          const itemDateStr = itemDate.toISOString().split('T')[0];
          
          if (filters.startDate !== "") {
            const startDateStr = new Date(filters.startDate).toISOString().split('T')[0];
            if (itemDateStr < startDateStr) {
              matchesDate = false;
            }
          }
          
          if (matchesDate && filters.endDate !== "") {
            const endDateStr = new Date(filters.endDate).toISOString().split('T')[0];
            if (itemDateStr > endDateStr) {
              matchesDate = false;
            }
          }
        }

        return matchesId && matchesCreatedBy && matchesSolicitudType && matchesSubType && matchesStatus && matchesDate;
      });

      if (filtered.length === 0) {
        // Mostrar siempre un mensaje genérico cuando no hay resultados
        setModalMessage("No se encontraron solicitudes/reportes con los filtros aplicados.");
        setModalType("error");
        setShowModal(true);
        setFilteredData([]);
        return;
      }

      setFilteredData(filtered);
    } catch (error) {
      setModalMessage("Error al aplicar filtros. Por favor, intente más tarde.");
      setModalType("error");
      setShowModal(true);
      setFilteredData([]);
    }
  };

  // Configuración de columnas para DataTable
  const columns = [
    { key: "created_by", label: "ID del usuario" },
    { key: "id", label: "ID del reporte" },
    { 
      key: "reportType", 
      label: "Tipo",
      render: (item) => item.reportType === 'solicitud' ? 'Solicitud' : 'Reporte'
    },
    { 
      key: "specificationType", 
      label: "Especificación",
      render: (item) => {
        // Determinar qué campo usar según el tipo de registro
        let specificType = "";
        
        if (item.reportType === 'solicitud') {
          specificType = item.flow_request_type;
        } else if (item.reportType === 'reporte') {
          specificType = item.failure_type;
        }
        
        // Obtener el nombre de visualización del mapa de tipos
        return typeMap[specificType] || specificType || "-";
      }
    },
    { 
      key: "status", 
      label: "Estado",
      render: (item) => {
        // Normalizar el estado para la comparación
        const normalizedStatus = normalizeStatus(item.status);
        
        // Obtener la clase de estilo correspondiente al estado
        const statusClass = statusClasses[normalizedStatus] || "bg-gray-100 text-gray-800 border border-gray-200";
        
        // Obtener el texto a mostrar
        const displayStatus = statusDisplayMap[normalizedStatus] || item.status || "Desconocido";
        
        // Para debug: mostrar el estado original y normalizado en la consola
        if (!statusClasses[normalizedStatus]) {
          console.log("Estado no reconocido:", {
            original: item.status,
            normalizado: normalizedStatus
          });
        }
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {displayStatus}
          </span>
        );
      }
    },
    { 
      key: "created_at", 
      label: "Fecha",
      render: (item) => {
        const date = new Date(item.created_at);
        return date.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
    },
    {
      key: "action",
      label: "Acción",
      render: (item) => {
        // Normalizar el estado para hacer la comparación más robusta
        const normalizedStatus = normalizeStatus(item.status);
        const isPendiente = ['pendiente', 'en proceso', 'a espera de aprobacion'].includes(normalizedStatus);
        
        return (
          <button
            onClick={() => handleGestionar(item)}
            className={`font-bold py-2 px-4 rounded transition-colors ${
              isPendiente 
                ? 'bg-[#365486] hover:bg-blue-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            disabled={!isPendiente}
          >
            Gestionar
          </button>
        );
      }
    }
  ];

  // Manejador para el botón Gestionar - MODIFICADO para abrir modal específico
  const handleGestionar = (item) => {
    // Normalizar el estado para hacer la comparación más robusta
    const normalizedStatus = normalizeStatus(item.status);
    const isPendiente = ['pendiente', 'en proceso', 'a espera de aprobacion'].includes(normalizedStatus);
    
    if (isPendiente) {
      // Pasar el objeto completo incluyendo el tipo como se muestra en la tabla
      const solicitudConTipo = {
        ...item,
        displayType: item.reportType === 'solicitud' ? item.flow_request_type : item.failure_type
      };
      setSelectedSolicitud(solicitudConTipo);
      
      // AQUÍ ES LA LÓGICA PRINCIPAL DEL CAMBIO:
      // Determinar qué modal mostrar basado en el tipo de solicitud o reporte
      if (item.reportType === 'solicitud') {
        // Para solicitudes
        if (['cambio_caudal', 'cancelacion temporal de caudal', 'activacion'].includes(item.flow_request_type)) {
          setShowGestionModal(true);
        } else if (item.flow_request_type === 'cancelacion definitiva de caudal') {
          setShowCancelacionDefinitivaModal(true);
        }
      } else if (item.reportType === 'reporte') {
        // Para reportes
        if (item.failure_type === 'falla_suministro') {
          setShowFallaSuministroModal(true);
        } else if (item.failure_type === 'falla_aplicativo') {
          setShowFallaAplicativoModal(true);
        }
      }
    }
  };

  // Manejadores para el resultado del modal
  const handleModalSuccess = (message) => {
    setModalMessage(message);
    setModalType("success");
    setShowModal(true);
    
    // Cerrar todos los modales de gestión
    setShowGestionModal(false);
    setShowCancelacionDefinitivaModal(false);
    setShowFallaSuministroModal(false);
    setShowFallaAplicativoModal(false);
    
    setSelectedSolicitud(null);
    // No llamamos fetchData aquí, lo haremos al cerrar el modal
  };

  const handleModalError = (message) => {
    setModalMessage(message);
    setModalType("error");
    setShowModal(true);
  };

  // Función para recargar datos - MODIFICADA para usar el nuevo endpoint unificado
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
        setModalType("error");
        setShowModal(true);
        return;
      }
      
      // Opciones para la solicitud HTTP
      const options = {
        headers: { Authorization: `Token ${token}` }
      };
      
      // Realizar una única solicitud al nuevo endpoint unificado
      const response = await axios.get(`${API_URL}/communication/admin/requests-and-reports`, options);
      
      // Procesar los datos recibidos
      if (response.data) {
        // Procesamos las solicitudes (flow_requests)
        const solicitudesData = response.data.flow_requests ? response.data.flow_requests.map(item => {
          // Normalizar el subtipo
          let specificType = item.flow_request_type;
          // Convertir "Cancelación Temporal de Caudal" a "cancelacion temporal de caudal"
          if (specificType === "Cancelación Temporal de Caudal") {
            specificType = "cancelacion temporal de caudal";
          } else if (specificType === "Cambio de Caudal") {
            specificType = "cambio_caudal";
          } else if (specificType === "Cancelación Definitiva de Caudal") {
            specificType = "cancelacion definitiva de caudal";
          } else if (specificType === "Activación de Caudal") {
            specificType = "activacion";
          }
          
          return {
            ...item,
            reportType: 'solicitud',
            // Asegurarnos de que se guarda el tipo normalizado para la lógica de filtros
            flow_request_type: specificType,
            // Normalizamos el estado para que coincida con la lógica existente
            status: item.status ? item.status.toLowerCase() : "",
          };
        }) : [];
        
        // Procesamos los reportes (failure_reports)
        const reportesData = response.data.failure_reports ? response.data.failure_reports.map(item => {
          // Normalizar el subtipo
          let specificType = item.failure_type;
          // Convertir "Fallo en el Suministro del Agua" a "falla_suministro"
          if (specificType === "Fallo en el Suministro del Agua") {
            specificType = "falla_suministro";
          } else if (specificType === "Fallo en el Aplicativo") {
            specificType = "falla_aplicativo";
          }
          
          return {
            ...item,
            reportType: 'reporte',
            // Asegurarnos de que se guarda el tipo normalizado para la lógica de filtros
            failure_type: specificType,
            // Normalizamos el estado para que coincida con la lógica existente
            status: item.status ? item.status.toLowerCase() : "",
          };
        }) : [];
        
        // Combinamos ambos arrays
        const allDataCombined = [...solicitudesData, ...reportesData];
        
        // Actualizar estados
        setSolicitudes(solicitudesData);
        setReportes(reportesData);
        setAllData(allDataCombined);
        
        // IMPORTANTE: Mantener filteredData como null para que la tabla esté vacía inicialmente
        // Solo se actualizan los datos filtrados si ya había un filtro aplicado anteriormente
        if (filteredData !== null) {
          applyFiltersToData(allDataCombined);
        }
      }
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      setModalMessage("Error al cargar los datos. Por favor, intente más tarde.");
      setModalType("error");
      setShowModal(true);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Atención de solicitudes y reportes
        </h1>

        <InputFilterGestionSolRep
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          showStatusFilter={true}
          solicitudTypes={[
            { value: "", label: "Todos" },
            { value: "solicitud", label: "Solicitud" },
            { value: "reporte", label: "Reporte" }
          ]}
          subTypes={{
            solicitud: [
              { value: "", label: "Todos" },
              { value: "cambio_caudal", label: "Cambio de Caudal" },
              { value: "cancelacion definitiva de caudal", label: "Cancelación Definitiva" },
              { value: "cancelacion temporal de caudal", label: "Cancelación Temporal" },
              { value: "activacion", label: "Activación" }
            ],
            reporte: [
              { value: "", label: "Todos" },
              { value: "falla_suministro", label: "Falla en Suministro" },
              { value: "falla_aplicativo", label: "Falla en Aplicativo" }
            ]
          }}
        />

        {/* Modal de mensajes (error o éxito) */}
        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              const wasSuccess = modalType === "success";
              setShowModal(false);
              
              // Si fue exitoso, recargar los datos después de cerrar el modal
              if (wasSuccess) {
                fetchData();
              }
            }}
            title={modalType === "success" ? "Éxito" : "Error"}
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Modal de Gestión de Solicitud (para cambio_caudal, cancelacion temporal de caudal, activacion) */}
        <GestionSolicitudModal
          showModal={showGestionModal}
          onClose={() => {
            setShowGestionModal(false);
            setSelectedSolicitud(null);
          }}
          solicitudBasica={selectedSolicitud}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />

        {/* Modal para Cancelación Definitiva */}
        <CancelacionDefinitivaModal
          showModal={showCancelacionDefinitivaModal}
          onClose={() => {
            setShowCancelacionDefinitivaModal(false);
            setSelectedSolicitud(null);
          }}
          solicitudBasica={selectedSolicitud}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />

        {/* Modal para Falla en Suministro */}
        <FallaSuministroModal
          showModal={showFallaSuministroModal}
          onClose={() => {
            setShowFallaSuministroModal(false);
            setSelectedSolicitud(null);
          }}
          solicitudBasica={selectedSolicitud}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />

        {/* Modal para Falla en Aplicativo */}
        <FallaAplicativoModal
          showModal={showFallaAplicativoModal}
          onClose={() => {
            setShowFallaAplicativoModal(false);
            setSelectedSolicitud(null);
          }}
          solicitudBasica={selectedSolicitud}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />

        {/* Uso del componente DataTable */}
        {filteredData !== null && (
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No se encontraron solicitudes/reportes con los filtros aplicados."
            actions={false}
          />
        )}
        
        {filteredData === null && (
          <div className="text-center my-10 text-gray-600">
            No hay solicitudes/reportes para mostrar. Aplica filtros para ver resultados.
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionSolicitudes;