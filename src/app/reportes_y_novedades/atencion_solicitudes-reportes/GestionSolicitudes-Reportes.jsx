import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "../../../components/Modal";
import DataTable from "../../../components/DataTable";
import { Eye } from "lucide-react";
import InputFilterGestionSolRep from "../../../components/InputFilterGestionSolRep";
import GestionSolicitudModal from "./GestionSolicitudModal";

const GestionSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("error"); // 'error' o 'success'
  const [filters, setFilters] = useState({
    id: "",
    userId: "",
    solicitudType: "", // 'solicitud' o 'reporte'
    status: "", // 'pendiente', 'aprobada', 'rechazada'
    startDate: "",
    endDate: "",
  });
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [showGestionModal, setShowGestionModal] = useState(false);

  const API_URL = import.meta.env.VITE_APP_API_URL;

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Nueva función para aplicar filtros a datos específicos
  const applyFiltersToData = (dataToFilter) => {
    try {
      // Verificamos si hay al menos un filtro aplicado
      const hasActiveFilters = 
        filters.id.trim() !== "" || 
        filters.userId.trim() !== "" || 
        filters.solicitudType !== "" || 
        filters.status !== "" ||
        filters.startDate !== "" || 
        filters.endDate !== "";

      // Si no hay filtros activos, mostramos todos los datos
      if (!hasActiveFilters) {
        setFilteredData(dataToFilter);
        return;
      }

      // Filtrado de datos
      const filtered = dataToFilter.filter((item) => {
        // Filtro por ID de reporte/solicitud
        const matchesId = filters.id.trim() === "" ||
          (item.id && item.id.toString().includes(filters.id.trim()));

        // Filtro por ID de usuario
        const matchesUserId = filters.userId.trim() === "" ||
          (item.user && item.user.toString().includes(filters.userId.trim()));

        // Filtro por tipo de solicitud/reporte
        const matchesSolicitudType = filters.solicitudType === "" ||
          item.reportType === filters.solicitudType;

        // Filtro por estado
        const matchesStatus = filters.status === "" ||
          item.status === filters.status;

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

        return matchesId && matchesUserId && matchesSolicitudType && matchesStatus && matchesDate;
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
        filters.userId.trim() !== "" || 
        filters.solicitudType !== "" || 
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

      if (filters.userId.trim() !== "" && !/^\d+$/.test(filters.userId.trim())) {
        setModalMessage("El campo de filtrado por ID contiene caracteres no válidos.");
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

      // Filtrado de datos
      const filtered = allData.filter((item) => {
        // Filtro por ID de reporte/solicitud
        const matchesId = filters.id.trim() === "" ||
          (item.id && item.id.toString().includes(filters.id.trim()));

        // Filtro por ID de usuario
        const matchesUserId = filters.userId.trim() === "" ||
          (item.user && item.user.toString().includes(filters.userId.trim()));

        // Filtro por tipo de solicitud/reporte
        const matchesSolicitudType = filters.solicitudType === "" ||
          item.reportType === filters.solicitudType;

        // Filtro por estado
        const matchesStatus = filters.status === "" ||
          item.status === filters.status;

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

        return matchesId && matchesUserId && matchesSolicitudType && matchesStatus && matchesDate;
      });

      if (filtered.length === 0) {
        // Determinar si es un caso de ID inexistente o simplemente no hay resultados
        if (filters.id.trim() !== "" || filters.userId.trim() !== "") {
          // Verificar si es específicamente por ID inexistente
          const idNotFound = filters.id.trim() !== "" && 
            !allData.some(item => item.id.toString() === filters.id.trim());
          
          const userIdNotFound = filters.userId.trim() !== "" && 
            !allData.some(item => item.user.toString() === filters.userId.trim());
          
          if (idNotFound && userIdNotFound) {
            setModalMessage("El ID de reporte/solicitud y el ID de usuario ingresados no existen.");
          } else if (idNotFound) {
            setModalMessage("El ID de reporte/solicitud ingresado no existe.");
          } else if (userIdNotFound) {
            setModalMessage("El ID de usuario ingresado no existe.");
          } else {
            setModalMessage("No se encontraron solicitudes/reportes con los filtros aplicados.");
          }
        } else {
          setModalMessage("No se encontraron solicitudes/reportes con los filtros aplicados.");
        }
        
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
    { key: "user", label: "ID del usuario" },
    { key: "id", label: "ID del reporte" },
    { 
      key: "reportType", 
      label: "Tipo",
      render: (item) => item.reportType === 'solicitud' ? 'Solicitud' : 'Reporte'
    },
    { 
      key: "type", 
      label: "Especificación",
      render: (item) => item.type || "-"
    },
    { 
      key: "status", 
      label: "Estado",
      render: (item) => {
        const statusMap = {
          'pendiente': 'Pendiente',
          'aprobada': 'Aprobada',
          'rechazada': 'Rechazada'
        };
        
        const statusClass = item.status?.toLowerCase() === "pendiente" 
          ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
          : item.status?.toLowerCase() === "aprobada"
          ? "bg-green-100 text-green-800 border border-green-200"
          : item.status?.toLowerCase() === "rechazada"
          ? "bg-red-100 text-red-800 border border-red-200"
          : "bg-gray-100 text-gray-800 border border-gray-200";
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {statusMap[item.status] || item.status}
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
      render: (item) => (
        <button
          onClick={() => handleGestionar(item)}
          className={`font-bold py-2 px-4 rounded transition-colors ${
            item.status === 'pendiente' 
              ? 'bg-[#365486] hover:bg-blue-700 text-white'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
          disabled={item.status !== 'pendiente'}
        >
          Gestionar
        </button>
      )
    }
  ];

  // Manejador para el botón Gestionar
  const handleGestionar = (item) => {
    if (item.status === 'pendiente') {
      // Pasar el objeto completo incluyendo el tipo como se muestra en la tabla
      const solicitudConTipo = {
        ...item,
        displayType: item.type // Guardar el tipo tal como se muestra en la tabla
      };
      setSelectedSolicitud(solicitudConTipo);
      setShowGestionModal(true);
    }
  };

  // Manejadores para el resultado del modal
  const handleModalSuccess = (message) => {
    setModalMessage(message);
    setModalType("success");
    setShowModal(true);
    setShowGestionModal(false);
    setSelectedSolicitud(null);
    // No llamamos fetchData aquí, lo haremos al cerrar el modal
  };

  const handleModalError = (message) => {
    setModalMessage(message);
    setModalType("error");
    setShowModal(true);
  };

  // Función para recargar datos
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
        setModalType("error");
        setShowModal(true);
        return;
      }
      
      // Obtener solicitudes
      const solicitudesResponse = await axios.get(`${API_URL}/communication/flow-requests`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      const solicitudesData = solicitudesResponse.data.map(item => ({
        ...item,
        reportType: 'solicitud'
      }));
      
      setSolicitudes(solicitudesData);
      setAllData(solicitudesData);
      
      // Si hay filtros activos, aplicarlos directamente sobre los nuevos datos
      if (filteredData !== null) {
        applyFiltersToData(solicitudesData);
      } else {
        // Si no hay filtros, mostrar todos los datos
        setFilteredData(solicitudesData);
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
          showPersonTypeFilter={false}
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

        {/* Modal de Gestión de Solicitud */}
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