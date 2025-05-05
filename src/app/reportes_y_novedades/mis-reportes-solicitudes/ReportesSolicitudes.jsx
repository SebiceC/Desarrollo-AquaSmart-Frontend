import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../../components/NavBar';
import ReportFailureModal from '../reportar_fallos/ReportFailureModal';
import ReportSupplyModal from '../reportar_fallos/ReportSupplyModal';
import Modal from '../../../components/Modal';
import DataTable from '../../../components/DataTable';
import InputFilterReporteSolicitudes from '../../../components/InputFilterReporteSolicitudes';
import axios from 'axios';

function ReportesSolicitudes() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_APP_API_URL;
    
    // State variables
    const [reportesSolicitudes, setReportesSolicitudes] = useState([]);
    const [filteredReporteSolicitudes, setFilteredReporteSolicitudes] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states consolidated into a single object
    const [modal, setModal] = useState({
        show: false,
        message: "",
        type: "error", // "error", "success", "warning"
        reportFailure: false,
        reportSupply: false
    });
    
    // Filter states
    const [filters, setFilters] = useState({
        id: "",
        startDate: "",
        endDate: "",
        status: "",
    });

    // Mock data for development
    const MOCK_USER = {
        document: "123456789",
        name: "Usuario de Prueba"
    };
    
    const MOCK_REPORTES_SOLICITUDES = [
        {
            id: 1,
            id_reportes_solicitudes: "1001",
            code: "SOL001",
            type: "Fallo en Aplicativo",
            status: "pendiente",
            creation_date: "2025-05-01T10:00:00Z",
            client_document: "123456789"
        },
        {
            id: 2,
            id_reportes_solicitudes: "1002",
            code: "SOL002",
            type: "Fallo en Suministro",
            status: "En proceso",
            creation_date: "2025-04-25T12:30:00Z",
            client_document: "123456789"
        },
        {
            id: 3,
            id_reportes_solicitudes: "1003",
            code: "SOL003",
            type: "Otro tipo",
            status: "A espera de aprobacion",
            creation_date: "2024-03-15T09:15:00Z",
            client_document: "987654321"
        },
    ];
    
    // Helper function to show modal messages
    const showModalMessage = (message, type = "error") => {
        setModal(prev => ({
            ...prev,
            show: true,
            message,
            type
        }));
    };
    
    // Success handler for requests
    const handleRequestSuccess = (message) => {
        showModalMessage(message, "success");
    };
    
    // Close all modals
    const closeAllModals = () => {
        setModal({
            show: false,
            message: "",
            type: "error",
            reportFailure: false,
            reportSupply: false
        });
    };

    // Fetch user and reports data
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
                showModalMessage("Error al cargar. Por favor, intente de nuevo o contacte al soporte técnico");
                setLoading(false);
            }
        };
    
        fetchUserAndReportesSolicitudes();
        
        // Uncomment below for real API implementation
        /*
        const fetchUserAndReportesSolicitudes = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    showModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
                    setLoading(false);
                    return;
                }
                
                // Obtener información del usuario actual
                const userResponse = await axios.get(`${API_URL}/users/profile`, {
                    headers: { Authorization: `Token ${token}` },
                });
                
                setCurrentUser(userResponse.data);
                
                // Obtener la lista de Reportes/solicitudes desde el endpoint
                const reportesSolicitudesResponse = await axios.get(`${API_URL}/billing/bills`, {
                    headers: { Authorization: `Token ${token}` },
                });
                
                // Filtrar las Reportes/solicitudes para mostrar solo las del usuario logueado
                const userReportesSolicitudes = reportesSolicitudesResponse.data.filter(
                    (reportesSolicitudes) => reportesSolicitudes.client_document === userResponse.data.document
                );
                
                setReportesSolicitudes(userReportesSolicitudes);
                console.log("Reportes/solicitudes del usuario:", userReportesSolicitudes);
                setLoading(false);
            } catch (error) {
                console.error("Error al obtener la lista de Reportes/solicitudes:", error);
                showModalMessage("Error al cargar. Por favor, intente de nuevo o contacte al soporte técnico");
                setLoading(false);
            }
        };
        
        fetchUserAndReportesSolicitudes();
        */
    }, []);

    // Update filters
    const handleFilterChange = (name, value) => {
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    // Apply filters function (memoized with useCallback to prevent unnecessary recreations)
    const applyFilters = useCallback(() => {
        try {
            // Check if any filter is applied
            const hasActiveFilters = 
                filters.id.trim() !== "" || 
                filters.startDate !== "" || 
                filters.endDate !== "" || 
                filters.status !== "";
                
            // ID validation
            if (filters.id.trim() !== "" && !/^[A-Za-z0-9]+$/.test(filters.id.trim())) {
                showModalMessage("El ID de reporte/solicitud contiene caracteres no válidos");
                setFilteredReporteSolicitudes([]);
                return;
            }
        
            // Date validation
            if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
                showModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
                setFilteredReporteSolicitudes([]);
                return;
            }
        
            // Filter reports
            const filtered = reportesSolicitudes.filter((reportesSolicitudes) => {
                // Filter by report code
                const matchesId = filters.id.trim() === "" ||
                    (reportesSolicitudes.code?.toLowerCase().includes(filters.id.trim().toLowerCase()));
        
                // Filter by status
                const matchesStatus =
                    filters.status === "" ||
                    reportesSolicitudes.status?.toLowerCase() === filters.status.toLowerCase();
                
                // Date filtering
                let matchesDate = true;
        
                if (filters.startDate || filters.endDate) {
                    try {
                        const facturaDate = new Date(reportesSolicitudes.creation_date);
                        const facturaDateOnly = new Date(
                            facturaDate.getFullYear(), 
                            facturaDate.getMonth(), 
                            facturaDate.getDate()
                        );
        
                        // Start date filter
                        if (filters.startDate) {
                            const startDate = new Date(filters.startDate);
                            const startDateOnly = new Date(
                                startDate.getFullYear(), 
                                startDate.getMonth(), 
                                startDate.getDate()
                            );
                            
                            if (facturaDateOnly < startDateOnly) {
                                matchesDate = false;
                            }
                        }
        
                        // End date filter
                        if (matchesDate && filters.endDate) {
                            const endDate = new Date(filters.endDate);
                            const endDateOnly = new Date(
                                endDate.getFullYear(), 
                                endDate.getMonth(), 
                                endDate.getDate()
                            );
                            
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
            
            // Show specific messages for no results
            if (filters.id.trim() !== "" && filtered.length === 0) {
                showModalMessage("El ID de reporte/solicitud no se encuentra.");
                setFilteredReporteSolicitudes([]);
                return;
            }

            if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
                showModalMessage("No hay reportes o solicitudes en el periodo especificado.");
                setFilteredReporteSolicitudes([]);
                return;
            }
        
            if (filters.status !== "" && filtered.length === 0) {
                showModalMessage("No hay reportes o solicitudes con el estado seleccionado.");
                setFilteredReporteSolicitudes([]);
                return;
            }
        
            setFilteredReporteSolicitudes(filtered);
        } catch (error) {
            showModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.");
            setFilteredReporteSolicitudes([]);
        }
    }, [filters, reportesSolicitudes]);

    // DataTable configuration
    const customStyles = {
        tableStyles: "",
        tableHeadStyles: "",
        tableBodyStyles: "",
        tableRowStyles: "",
        tableCellStyles: "",
        actionCellStyles: "flex justify-center items-center"
    };

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
                    "a espera de aprobacion": "bg-orange-100 text-orange-800 border border-orange-300",
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

    // Navigate to detail view
    const handleViewReporteSolicitudes = (reportesSolicitudes) => {
        navigate(`/reportes-y-novedades/mis-reportes-solicitudes/detalle/${reportesSolicitudes.id_reportes_solicitudes}`);
    };

    // Open report modals
    const openReportFailureModal = () => {
        setModal(prev => ({ ...prev, reportFailure: true }));
    };

    const openReportSupplyModal = () => {
        setModal(prev => ({ ...prev, reportSupply: true }));
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

                {loading ? (
                    <div className="text-center my-10">
                        <p>Cargando datos...</p>
                    </div>
                ) : (
                    <>
                        {/* DataTable with reports */}
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
                    </>
                )}

                {/* Modals */}
                {modal.show && (
                    <Modal
                        showModal={modal.show}
                        onClose={() => setModal(prev => ({ ...prev, show: false }))}
                        title={
                            modal.type === "success" ? "Éxito" : 
                            modal.type === "warning" ? "Advertencia" : "Error"
                        }
                        btnMessage="Cerrar"
                    >
                        <p>{modal.message}</p>
                    </Modal>
                )}

                {/* Report failure modal */}
                <ReportFailureModal
                    showModal={modal.reportFailure}
                    onClose={() => setModal(prev => ({ ...prev, reportFailure: false }))}
                    onSuccess={handleRequestSuccess}
                    API_URL={API_URL}
                />
                
                {/* Report supply modal */}
                <ReportSupplyModal
                    showModal={modal.reportSupply}
                    onClose={() => setModal(prev => ({ ...prev, reportSupply: false }))}
                    onSuccess={handleRequestSuccess}
                    API_URL={API_URL}
                />
            </div>
        </div>
    );
}

export default ReportesSolicitudes;