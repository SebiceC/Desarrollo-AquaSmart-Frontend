import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "../../../components/Modal";
import DataTable from "../../../components/DataTable";
import InputFilterGestionSolRep from "../../../components/InputFilterGestionSolRep";
// Importar los nuevos modales

import SolicitudInfoModal from "./SolicitudInfoModal";
//para cancelacion definitiva
import CancelacionDefinitivaF from "./Cancelacion_definitiva/CancelacionDefinitivaF";
import CancelacionDefinitivaP from "./Cancelacion_definitiva/CancelacionDefinitivaP";
import CancelacionDefinitivaE from "./Cancelacion_definitiva/CancelacionDefinitivaE";
//para falla aplicativo
import FallaAplicativoF from "./Falla_aplicativo/FallaAplicativoF";
import FallaAplicativoP from "./Falla_aplicativo/FallaAplicativoP";
import FallaAplicativoE from "./Falla_aplicativo/FallaAplicativoE";

import GestionSolicitudModal from "./GestionSolicitudModal";
import Footer from "../../../components/Footer";

const GestionSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [allData, setAllData] = useState([]);
  const [maintenanceReports, setMaintenanceReports] = useState([]); // Nuevo estado para informes de mantenimiento
  const [filteredData, setFilteredData] = useState(null); // Inicialmente null para que no muestre datos
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("error"); // 'error' o 'success'
  const [filters, setFilters] = useState({
    id: "",
    createdBy: "",  // Campo para filtrar por ID de usuario (created_by)
    solicitudType: "", // 'solicitud' o 'reporte'
    subType: "",       // Tipo específico de solicitud o reporte
    specification: "", // Nuevo filtro de especificación
    status: "", // 'pendiente', 'en proceso', 'a espera de aprobacion', 'finalizado', 'rechazada'
    startDate: "",
    endDate: "",
  });
  
  // Estado para el objeto de solicitud/reporte seleccionado
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  
  // Estados para controlar la visibilidad de cada modal
  const [showGestionModal, setShowGestionModal] = useState(false);
  const [showCancelacionDefinitivaFModal, setShowCancelacionDefinitivaFModal] = useState(false);
  const [showCancelacionDefinitivaPModal, setShowCancelacionDefinitivaPModal] = useState(false);
  const [showCancelacionDefinitivaEModal, setShowCancelacionDefinitivaEModal] = useState(false);
  const [showFallaAplicativoFModal, setShowFallaAplicativoFModal] = useState(false);
  const [showFallaAplicativoPModal, setShowFallaAplicativoPModal] = useState(false);
  const [showFallaAplicativoEModal, setShowFallaAplicativoEModal] = useState(false);
  const [showSolicitudInfoModal, setShowSolicitudInfoModal] = useState(false);
  const API_URL = import.meta.env.VITE_APP_API_URL;

  // Mapa de estados aceptados para normalización
  const statusNormalizeMap = {
    "pendiente": "pendiente",
    "en proceso": "en proceso", 
    "a espera de aprobacion": "a espera de aprobacion",
    "a espera de aprobación": "a espera de aprobacion", // Variante con tilde
    "finalizado": "finalizado",
  };

  // Estados aceptados y sus correspondientes visualizaciones
  const statusDisplayMap = {
    'pendiente': 'Pendiente',
    'en proceso': 'En Proceso',
    'a espera de aprobacion': 'A Espera de Aprobación',
    'finalizado': 'Finalizado',
  };

  // Colores para los estados
  const statusClasses = {
    "pendiente": "bg-yellow-100 text-yellow-800 border border-yellow-300",
    "en proceso": "bg-blue-100 text-blue-800 border border-blue-300",
    "a espera de aprobacion": "bg-orange-100 text-orange-800 border border-orange-300",
    "finalizado": "bg-green-100 text-green-800 border border-green-300",
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
      // Normalizar para que coincida con las keys de typeMap
      let specificType = item.flow_request_type;
      if (specificType === "Cancelación Temporal de Caudal") return "cancelacion temporal de caudal";
      if (specificType === "Cambio de Caudal") return "cambio_caudal";
      if (specificType === "Cancelación Definitiva de Caudal") return "cancelacion definitiva de caudal";
      if (specificType === "Activación de Caudal") return "activacion";
      return specificType;
    } else if (item.reportType === 'reporte') {
      let specificType = item.failure_type;
      if (specificType === "Fallo en el Suministro del Agua") return "falla_suministro";
      if (specificType === "Fallo en el Aplicativo") return "falla_aplicativo";
      return specificType;
    }
    return "";
  };

  // Nueva función para obtener informes de mantenimiento
  const fetchMaintenanceReports = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/communication/maintenance-reports/list`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      console.log("Informes de mantenimiento obtenidos:", response.data);
      setMaintenanceReports(response.data);
      return response.data;
    } catch (error) {
      console.error("Error al obtener informes de mantenimiento:", error);
      return [];
    }
  };

  // Función para encontrar el ID del informe de mantenimiento correspondiente
  const findMaintenanceReportId = (item, maintenanceReportsData) => {
    const itemId = item.id;
    
    // Buscar en los informes de mantenimiento
    const matchingReport = maintenanceReportsData.find(report => {
      // Verificar si coincide con flow_request
      if (item.reportType === 'solicitud' && report.assignment_details?.flow_request) {
        // Si flow_request es un objeto, comparar su id
        if (typeof report.assignment_details.flow_request === 'object') {
          return report.assignment_details.flow_request.id === itemId;
        }
        // Si flow_request es un ID directo, comparar directamente
        return report.assignment_details.flow_request === itemId;
      }
      
      // Verificar si coincide con failure_report
      if (item.reportType === 'reporte' && report.assignment_details?.failure_report) {
        // Si failure_report es un objeto, comparar su id
        if (typeof report.assignment_details.failure_report === 'object') {
          return report.assignment_details.failure_report.id === itemId;
        }
        // Si failure_report es un ID directo, comparar directamente
        return report.assignment_details.failure_report === itemId;
      }
      
      return false;
    });
    
    return matchingReport?.id || null;
  };

  // Función para aplicar filtros a datos específicos
  const applyFiltersToData = (dataToFilter) => {
    try {
      const hasActiveFilters = 
        filters.id.trim() !== "" || 
        filters.createdBy.trim() !== "" || 
        filters.solicitudType !== "" || 
        filters.subType !== "" ||
        filters.specification !== "" ||
        filters.status !== "" ||
        filters.startDate !== "" || 
        filters.endDate !== "";

      if (!hasActiveFilters) {
        setFilteredData(dataToFilter);
        return;
      }

      const filterStatusNormalized = normalizeStatus(filters.status);

      const filtered = dataToFilter.filter((item) => {
        const matchesId = filters.id.trim() === "" ||
          (item.id && item.id.toString().includes(filters.id.trim()));
        const matchesCreatedBy = filters.createdBy.trim() === "" ||
          (item.created_by && item.created_by.toString().includes(filters.createdBy.trim()));
        const matchesSolicitudType = filters.solicitudType === "" ||
          item.reportType === filters.solicitudType;
        const specificType = getItemSpecificType(item);
        const matchesSubType = filters.subType === "" || specificType === filters.subType;
        // Filtrado por especificación usando la key normalizada
        const matchesSpecification = filters.specification === "" || specificType === filters.specification;
        const itemStatusNormalized = normalizeStatus(item.status);
        const matchesStatus = filterStatusNormalized === "" || 
                             itemStatusNormalized === filterStatusNormalized;
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
        return matchesId && matchesCreatedBy && matchesSolicitudType && matchesSubType && matchesSpecification && matchesStatus && matchesDate;
      });
      setFilteredData(filtered);
    } catch {
      setFilteredData([]);
    }
  };

  const applyFilters = () => {
    try {
      const hasActiveFilters = 
        filters.id.trim() !== "" || 
        filters.createdBy.trim() !== "" || 
        filters.solicitudType !== "" || 
        filters.subType !== "" ||
        filters.specification !== "" ||
        filters.status !== "" ||
        filters.startDate !== "" || 
        filters.endDate !== "";
      if (!hasActiveFilters) {
        setFilteredData(allData);
        return;
      }
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
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
        setModalType("error");
        setShowModal(true);
        setFilteredData([]);
        return;
      }
      const filterStatusNormalized = normalizeStatus(filters.status);
      const filtered = allData.filter((item) => {
        const matchesId = filters.id.trim() === "" ||
          (item.id && item.id.toString().includes(filters.id.trim()));
        const matchesCreatedBy = filters.createdBy.trim() === "" ||
          (item.created_by && item.created_by.toString().includes(filters.createdBy.trim()));
        const matchesSolicitudType = filters.solicitudType === "" ||
          item.reportType === filters.solicitudType;
        const specificType = getItemSpecificType(item);
        const matchesSubType = filters.subType === "" || specificType === filters.subType;
        // Filtrado por especificación usando la key normalizada
        const matchesSpecification = filters.specification === "" || specificType === filters.specification;
        const itemStatusNormalized = normalizeStatus(item.status);
        const matchesStatus = filterStatusNormalized === "" || 
                             itemStatusNormalized === filterStatusNormalized;
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
        return matchesId && matchesCreatedBy && matchesSolicitudType && matchesSubType && matchesSpecification && matchesStatus && matchesDate;
      });
      if (filtered.length === 0) {
        setModalMessage("No se encontraron solicitudes/reportes con los filtros aplicados.");
        setModalType("error");
        setShowModal(true);
        setFilteredData([]);
        return;
      }
      setFilteredData(filtered);
    } catch {
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
        
        let buttonLabel = "";
        
        if (item.reportType === 'solicitud') {
          if (['cambio_caudal', 'cancelacion temporal de caudal', 'cancelacion definitiva de caudal'].includes(item.flow_request_type)) {
            if (normalizedStatus === 'finalizado') {
              buttonLabel = "Ver Información";
            } else if (normalizedStatus === 'pendiente') {
              buttonLabel = "Gestionar";
            } else if (normalizedStatus === 'a espera de aprobacion') {
              buttonLabel = "Gestionar";
            } else if (normalizedStatus === 'en proceso') {
              buttonLabel = "Ver Información";
            }
          } else if (['activacion'].includes(item.flow_request_type)) {
            if (normalizedStatus === 'finalizado') {
              buttonLabel = "Ver Información";
            } else {
              buttonLabel = "Gestionar";
            }
          } else {
            buttonLabel = "Ver Información";
          }
        } else if (item.reportType === 'reporte') {
          if (normalizedStatus === 'pendiente') {
            buttonLabel = "Gestionar";
          } else if (normalizedStatus === 'a espera de aprobacion') {
            buttonLabel = "Gestionar";
          } else {
            buttonLabel = "Ver Información";
          }
        }
        
        return (
          <button
            onClick={() => handleGestionar(item)}
            className="font-bold py-2 px-4 rounded transition-colors bg-[#365486] hover:bg-blue-700 text-white"
          >
            {buttonLabel}
          </button>
        );
      }
    }
  ];

  // Manejador para el botón Gestionar - MODIFICADO para usar el mapeo de informes de mantenimiento
  const handleGestionar = (item) => {
    // Normalizar el estado para hacer la comparación más robusta
    const normalizedStatus = normalizeStatus(item.status);
    
    // Pasar el objeto completo incluyendo el tipo como se muestra en la tabla
    const solicitudConTipo = {
      ...item,
      displayType: item.reportType === 'solicitud' ? item.flow_request_type : item.failure_type
    };
    setSelectedSolicitud(solicitudConTipo);
    
    // Verificar si necesitamos navegar a la página de aprobación
    const shouldNavigateToApproval = normalizedStatus === 'a espera de aprobacion';
    
    if (shouldNavigateToApproval) {
      // Buscar el ID del informe de mantenimiento correspondiente
      const maintenanceReportId = findMaintenanceReportId(item, maintenanceReports);
      
      if (maintenanceReportId) {
        console.log(`Navegando a gestionar informe con ID: ${maintenanceReportId}`);
        navigate(`/reportes-y-novedades/gestionar-informe/${maintenanceReportId}`);
        return;
      } else {
        // Si no se encuentra el informe de mantenimiento, mostrar error o usar la navegación por defecto
        console.warn(`No se encontró informe de mantenimiento para el item con ID: ${item.id}`);
        navigate('/reportes-y-novedades/control-reportes-intervenciones');
        return;
      }
    }
    
    // Para otros estados, continuar con la lógica original de modales
    // Determinar qué modal mostrar basado en el tipo de solicitud o reporte
    if (item.reportType === 'solicitud') {
      // Para solicitudes
      if (['cambio_caudal', 'cancelacion temporal de caudal', 'activacion'].includes(item.flow_request_type)) {
        if (normalizedStatus === 'finalizado') {
          // Mostrar modal con datos y fotos del técnico
          setShowSolicitudInfoModal(true);
        } else {
          setShowGestionModal(true);
          // Mostrar modal con datos de la solicitud
        } 
      } else if (item.flow_request_type === 'cancelacion definitiva de caudal') {
        if (normalizedStatus === 'finalizado') {
          // Mostrar modal con datos y fotos del técnico
          setShowCancelacionDefinitivaFModal(true);
        } else if (normalizedStatus === 'pendiente') {
          // Mostrar modal con datos de la solicitud
          setShowCancelacionDefinitivaPModal(true);
        } else if (normalizedStatus === 'en proceso') {
          // Mostrar modal con información y técnico asignado
          setShowCancelacionDefinitivaEModal(true);
        }
      }
    } else if (item.reportType === 'reporte') {
      // Para reportes
      if (item.failure_type === 'falla_suministro') {
        if (normalizedStatus === 'finalizado') {
          // Mostrar modal con datos y fotos del técnico
          setShowFallaAplicativoFModal(true);
        } else if (normalizedStatus === 'pendiente') {
          // Mostrar modal con datos del reporte
          setShowFallaAplicativoPModal(true);
        } else if (normalizedStatus === 'en proceso') {
          // Mostrar modal con información y técnico asignado
          setShowFallaAplicativoEModal(true);
        }
      } else if (item.failure_type === 'falla_aplicativo') {
        if (normalizedStatus === 'finalizado') {
          // Mostrar modal con datos y fotos del técnico
          setShowFallaAplicativoFModal(true);
        } else if (normalizedStatus === 'pendiente') {
          // Mostrar modal con datos del reporte
          setShowFallaAplicativoPModal(true);
        } else if (normalizedStatus === 'en proceso') {
          // Mostrar modal con información y técnico asignado
          setShowFallaAplicativoEModal(true);
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
    setShowCancelacionDefinitivaFModal(false);
    setShowCancelacionDefinitivaPModal(false);
    setShowCancelacionDefinitivaEModal(false);
    setShowFallaAplicativoFModal(false);
    setShowFallaAplicativoPModal(false);
    setShowFallaAplicativoEModal(false);
    setShowSolicitudInfoModal(false);
    setSelectedSolicitud(null);
    // No llamamos fetchData aquí, lo haremos al cerrar el modal
  };

  const handleModalError = (message) => {
    setModalMessage(message);
    setModalType("error");
    setShowModal(true);
  };

  // Función para recargar datos - MODIFICADA para incluir informes de mantenimiento
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
      
      // Realizar solicitudes a ambos endpoints de forma paralela
      const [requestsResponse, maintenanceResponse] = await Promise.all([
        axios.get(`${API_URL}/communication/admin/requests-and-reports`, options),
        fetchMaintenanceReports(token)
      ]);
      
      // Procesar los datos recibidos
      if (requestsResponse.data) {
        // Procesamos las solicitudes (flow_requests)
        const solicitudesData = requestsResponse.data.flow_requests ? requestsResponse.data.flow_requests.map(item => {
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
        const reportesData = requestsResponse.data.failure_reports ? requestsResponse.data.failure_reports.map(item => {
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
        
        // Los informes de mantenimiento ya se actualizaron en fetchMaintenanceReports
        
        // IMPORTANTE: Mantener filteredData como null para que la tabla esté vacía inicialmente
        // Solo se actualizan los datos filtrados si ya había un filtro aplicado anteriormente
        if (filteredData !== null) {
          applyFiltersToData(allDataCombined);
        }
        
        console.log("Datos combinados:", allDataCombined);
        console.log("Informes de mantenimiento:", maintenanceResponse);
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


        {/* Modal de Gestión de Solicitud - CORREGIDO */}
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
       <CancelacionDefinitivaF
        showModal={showCancelacionDefinitivaFModal}
        onClose={() => {
          setShowCancelacionDefinitivaFModal(false);
          setSelectedSolicitud(null);
        }}
        solicitudBasica={selectedSolicitud}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />

      {/* Modal para Cancelación Definitiva */}
      <CancelacionDefinitivaP
        showModal={showCancelacionDefinitivaPModal}
        onClose={() => {
          setShowCancelacionDefinitivaPModal(false);
          setSelectedSolicitud(null);
        }}
        solicitudBasica={selectedSolicitud}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />

      {/* Modal para Cancelación Definitiva */}
      <CancelacionDefinitivaE
        showModal={showCancelacionDefinitivaEModal}
        onClose={() => {
          setShowCancelacionDefinitivaEModal(false);
          setSelectedSolicitud(null);
        }}
        solicitudBasica={selectedSolicitud}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />

      {/* Modal para Falla en Aplicativo */}
      <FallaAplicativoF
        showModal={showFallaAplicativoFModal}
        onClose={() => {
          setShowFallaAplicativoFModal(false);
          setSelectedSolicitud(null);
        }}
        solicitudBasica={selectedSolicitud}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />

      {/* Modal para Falla en Aplicativo */}
      <FallaAplicativoP
        showModal={showFallaAplicativoPModal}
        onClose={() => {
          setShowFallaAplicativoPModal(false);
          setSelectedSolicitud(null);
        }}
        solicitudBasica={selectedSolicitud}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />


      {/* Modal para Falla en Aplicativo */}
      <FallaAplicativoE
        showModal={showFallaAplicativoEModal}
        onClose={() => {
          setShowFallaAplicativoEModal(false);
          setSelectedSolicitud(null);
        }}
        solicitudBasica={selectedSolicitud}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />


      {/* Modal para Solicitud Info */}
      <SolicitudInfoModal
        showModal={showSolicitudInfoModal}
        onClose={() => {
          setShowSolicitudInfoModal(false);
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
      <Footer />
    </div>
  );
};

export default GestionSolicitudes;