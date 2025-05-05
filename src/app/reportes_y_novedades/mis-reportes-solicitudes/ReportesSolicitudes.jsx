import React, { useEffect, useState } from 'react'
import NavBar from '../../../components/NavBar'
import ReportFailureModal from '../reportar_fallos/ReportFailureModal';
import ReportSupplyModal from '../reportar_fallos/ReportSupplyModal';
import Modal from '../../../components/Modal';
import DataTable from '../../../components/DataTable';
import { useNavigate } from 'react-router-dom';
import InputFilterReporteSolicitudes from '../../../components/InputFilterReporteSolicitudes';
import axios from 'axios';

function ReportesSolicitudes() {
    const navigate = useNavigate();
    const [reportesSolicitudes, setReportesSolicitudes] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showSupplyModal, setShowSupplyModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [filteredReporteSolicitudes, setFilteredReporteSolicitudes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const API_URL = import.meta.env.VITE_APP_API_URL;

    const [filters, setFilters] = useState({
        id: "",
        startDate: "",
        endDate: "",
        status: "",
    });

    // Función para mostrar mensajes de éxito usando el modal
    const handleRequestSuccess = (message) => {
        setModalMessage(message);
        setShowModal(true);
    };

    const MOCK_USER = {
        document: "123456789",
        name: "Usuario de Prueba"
    };
    
    const MOCK_REPORTES_SOLICITUDES = [
        {
            id: 1,
            id_bill: "1001",
            code: "SOL001",
            type: "Fallo en Aplicativo",
            status: "pendiente",
            creation_date: "2024-05-01T10:00:00Z",
            client_document: "123456789"
        },
        {
            id: 2,
            id_bill: "1002",
            code: "SOL002",
            type: "Fallo en Suministro",
            status: "En proceso",
            creation_date: "2024-04-25T12:30:00Z",
            client_document: "123456789"
        },
        {
            id: 3,
            id_bill: "1003",
            code: "SOL003",
            type: "Otro tipo",
            status: "A espera de aprobacion",
            creation_date: "2024-03-15T09:15:00Z",
            client_document: "987654321"
        },
    ];    

    // useEffect(() => {
    //     const fetchUserAndReportesSolicitudes = async () => {
    //       try {
    //         const token = localStorage.getItem("token");
    //         if (!token) {
    //           setModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
    //           setShowModal(true);
    //           setLoading(false);
    //           return;
    //         }
            
    //         // Obtener información del usuario actual
    //         const userResponse = await axios.get(`${API_URL}/users/profile`, {
    //           headers: { Authorization: `Token ${token}` },
    //         });
            
    //         setCurrentUser(userResponse.data);
            
    //         // Obtener la lista de Reportes/solicitudes desde el endpoint
    //         const reportesSolicitudesResponse = await axios.get(`${API_URL}/billing/bills`, {
    //           headers: { Authorization: `Token ${token}` },
    //         });
            
    //         // Filtrar las Reportes/solicitudes para mostrar solo las del usuario logueado
    //         const userReportesSolicitudes = reportesSolicitudesResponse.data.filter(
    //           (reportesSolicitudes) => reportesSolicitudes.client_document === userResponse.data.document
    //         );
            
    //         setReportesSolicitudes(userReportesSolicitudes);
    //         console.log("Reportes/solicitudes del usuario:", userReportesSolicitudes);
    //         setLoading(false);
    //       } catch (error) {
    //         console.error("Error al obtener la lista de Reportes/solicitudes:", error);
    //         setModalMessage("Error al cargar. Por favor, intente de nuevo o contacte al soporte técnico");
    //         setShowModal(true);
    //         setLoading(false);
    //       }
    //     };
    
    //     fetchUserAndReportesSolicitudes();
    //}, [API_URL]);

    useEffect(() => {
        const fetchUserAndReportesSolicitudes = async () => {
            try {
                // Simular delay de carga
                await new Promise((resolve) => setTimeout(resolve, 500));
    
                // Simular usuario autenticado
                const userResponse = { data: MOCK_USER };
                setCurrentUser(userResponse.data);
    
                // Simular datos de reportes/solicitudes
                const reportesSolicitudesResponse = { data: MOCK_REPORTES_SOLICITUDES };
    
                const userReportesSolicitudes = reportesSolicitudesResponse.data.filter(
                    (reportesSolicitudes) =>
                        reportesSolicitudes.client_document === userResponse.data.document
                );
    
                setReportesSolicitudes(userReportesSolicitudes);
                console.log("Reportes/solicitudes del usuario (mock):", userReportesSolicitudes);
                setLoading(false);
            } catch (error) {
                console.error("Error al obtener la lista de Reportes/solicitudes:", error);
                setModalMessage("Error al cargar. Por favor, intente de nuevo o contacte al soporte técnico");
                setShowModal(true);
                setLoading(false);
            }
        };
    
        fetchUserAndReportesSolicitudes();
    }, []);    
    

    const handleFilterChange = (name, value) => {
        setFilters({
          ...filters,
          [name]: value,
        });
    };

    const applyFilters = () => {
        try {
          // Verificamos si hay al menos un filtro aplicado
          const hasActiveFilters = 
            filters.id.trim() !== "" || 
            filters.startDate !== "" || 
            filters.endDate !== "" || 
            filters.status !== "";
            
          // Validación del ID de petición
          if (filters.id.trim() !== "" && !/^[A-Za-z0-9]+$/.test(filters.id.trim())) {
            setModalMessage("El ID de reporte/solicitud contiene caracteres no válidos");
            setShowModal(true);
            setFilteredReporteSolicitudes([]);
            return;
          }
    
          // Validación de fechas
          if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
            setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
            setShowModal(true);
            setFilteredReporteSolicitudes([]);
            return;
          }
    
          // Filtrado de reportesSolicitudes (solo permitiendo filtrar entre las reportesSolicitudes del usuario)
          const filtered = reportesSolicitudes.filter((reportesSolicitudes) => {
            // Filtro por código de reportesSolicitudes
            const matchesId = filters.id.trim() === "" ||
              (filters.id.trim().length > 0 &&
                reportesSolicitudes.code?.toLowerCase().includes(filters.id.trim().toLowerCase()));
    
            // Filtro por estado
            const matchesStatus =
              filters.status === "" ||
              reportesSolicitudes.status?.toLowerCase() === filters.status.toLowerCase();
            
    
            // Manejo de fechas para filtrado (usando creation_date)
            let matchesDate = true;
    
            if (filters.startDate || filters.endDate) {
              try {
                // Obtener la fecha de creación de la reportesSolicitudes como un objeto Date
                const facturaDate = new Date(reportesSolicitudes.creation_date);
                // Convertimos la fecha de la reportesSolicitudes a formato local y eliminamos la hora para la comparación
                const facturaDateOnly = new Date(facturaDate.getFullYear(), facturaDate.getMonth(), facturaDate.getDate());
    
                // Si hay fecha de inicio, verificar que la reportesSolicitudes no sea anterior a la fecha de inicio
                if (filters.startDate) {
                  const startDate = new Date(filters.startDate);
                  // Convertimos la fecha de inicio a la misma zona horaria y eliminamos la hora
                  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                  
                  // Comprobamos si la fecha de la reportesSolicitudes es antes de la fecha de inicio
                  if (facturaDateOnly < startDateOnly) {
                    matchesDate = false;
                  }
                }
    
                // Si hay fecha de fin, verificar que la reportesSolicitudes no sea posterior a la fecha de fin
                if (matchesDate && filters.endDate) {
                  const endDate = new Date(filters.endDate);
                  // Convertimos la fecha de fin a la misma zona horaria y eliminamos la hora
                  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                  
                  // Comprobamos si la fecha de la reportesSolicitudes es después de la fecha de fin
                  if (facturaDateOnly > endDateOnly) {
                    matchesDate = false;
                  }
                }
              } catch (error) {
                console.error("Error al procesar fechas:", error, "para reportesSolicitudes:", reportesSolicitudes.code);
                matchesDate = false;
              }
            }
    
            return matchesId && matchesDate && matchesStatus;
          });
          
          // Validaciones adicionales para mostrar mensajes específicos
          if (filters.id.trim() !== "" && filtered.length === 0) {
            setModalMessage("El ID de reporte/solicitud no se encuentra.");
            setShowModal(true);
            setFilteredReporteSolicitudes([]);
            return;
          }

          if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
            setModalMessage("No hay reportes o solicitudes en el periodo especificado.");
            setShowModal(true);
            setFilteredReporteSolicitudes([]);
            return;
          }
    
          if (filters.status !== "" && filtered.length === 0) {
            setModalMessage("No hay reportes o solicitudes con el estado seleccionado.");
            setShowModal(true);
            setFilteredReporteSolicitudes([]);
            return;
          }
    
          setFilteredReporteSolicitudes(filtered);
        } catch (error) {
          setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.");
          setShowModal(true);
          setFilteredReporteSolicitudes([]);
        }
        
    };

    const customStyles = {
        tableStyles: "",
        tableHeadStyles: "",
        tableBodyStyles: "",
        tableRowStyles: "",
        tableCellStyles: "",
        actionCellStyles: "flex justify-center items-center"
    };

    // Configuración de columnas para DataTable
    const columns = [
        { key: "id", label: "ID de la petición" },
        { key: "type", label: "Tipo de reporte/solicitud"},
        {
        key: "status",
        label: "Estado de la petición",
        render: (reportesSolicitudes) => {
            const status = reportesSolicitudes.status?.toLowerCase();
          
            const statusStyles = {
              "pendiente": "bg-yellow-100 text-yellow-800 border border-yellow-300",
              "en proceso": "bg-blue-100 text-blue-800 border border-blue-300",
              "a espera de aprobación": "bg-orange-100 text-orange-800 border border-orange-300",
              "finalizado": "bg-green-100 text-green-800 border border-green-300",
            };
          
            const statusClass = statusStyles[status] || "bg-gray-100 text-gray-800 border border-gray-300";
          
            return (
              <span className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-18 text-center`}>
                {reportesSolicitudes.status?.charAt(0).toUpperCase() + reportesSolicitudes.status?.slice(1)}
              </span>
            );
          }          
        },
        {
        key: "creation_date",
        label: "Fecha Creación",
        responsive: "hidden sm:table-cell",
        render: (reportesSolicitudes) => new Date(reportesSolicitudes.creation_date).toLocaleDateString('es-CO')
        },
    ];
    // Manejadores para las acciones
    const handleViewReporteSolicitudes = (reportesSolicitudes) => {
        navigate(`/mis-reportes-solicitudes/detalle/${reportesSolicitudes.id_bill}`);
    };

    return (
        <div>
            <NavBar />
            <div className="container mx-auto p-4 md:p-8 lg:p-20">
                <h1 className="text-center my-10 text-lg md:text-2xl font-bold mb-6">
                    MIS REPORTES Y SOLICITUDES
                </h1>

                <InputFilterReporteSolicitudes
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={applyFilters}
                />

                {/* Uso del componente DataTable - Solo mostrar cuando hay filtros aplicados o hay reportes/solicitudes */}
                {/* DataTable con los reportes y solicitudes */}
                {filteredReporteSolicitudes !== null && (
                <DataTable
                    columns={columns}
                    data={filteredReporteSolicitudes}
                    emptyMessage="No se encontraron reportes/solicitudes con los filtros aplicados."
                    onViewReportesSolicitudes={handleViewReporteSolicitudes}
                    customStyles={customStyles}
                />
                )}

                {filteredReporteSolicitudes === null && (
                    <div className="text-center my-10 text-gray-600">
                        {reportesSolicitudes.length > 0 ? 
                            "Aplica filtros para ver resultados específicos." : 
                            "No tienes reportes/solicitudes asociadas a tu documento."}
                </div>
                    )}

                {/* Modal de mensajes (éxito o error) */}
                {showModal && (
                    <Modal
                        showModal={showModal}
                        onClose={() => setShowModal(false)}
                        title={
                            modalMessage.includes("correctamente")
                                ? "Éxito"
                                : modalMessage.includes("inactivo")
                                    ? "Advertencia"
                                    : "Error"
                        }
                        btnMessage="Cerrar"
                    >
                        <p>{modalMessage}</p>
                    </Modal>
                )}

                {/* Modal de reporte de fallos */}
                <ReportFailureModal
                    showModal={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    onSuccess={handleRequestSuccess}
                    API_URL={API_URL}
                />
                 <ReportSupplyModal
                    showModal={showSupplyModal}
                    onClose={() => setShowSupplyModal(false)}
                    onSuccess={handleRequestSuccess}
                    API_URL={API_URL}
                />
            </div>
        </div>
    )
}

export default ReportesSolicitudes