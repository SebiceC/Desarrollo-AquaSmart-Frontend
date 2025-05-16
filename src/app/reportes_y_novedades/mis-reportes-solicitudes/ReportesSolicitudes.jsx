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
        tipo_falla: "error", // "error", "success", "warning"
        reportFailure: false,
        reportSupply: false
    });
    
    // Filter states
    const [filters, setFilters] = useState({
        id: "",
        startDate: "",
        endDate: "",
        estado: "",
    });
    
    // Helper function to show modal messages
    const showModalMessage = useCallback((message, tipo_falla = "error") => {
        setModal(prev => ({
            ...prev,
            show: true,
            message,
            tipo_falla
        }));
    }, []);
    
    // Success handler for requests
    const handleRequestSuccess = (message) => {
        showModalMessage(message, "success");
    };
    
    // Close all modals
    const closeAllModals = () => {
        setModal({
            show: false,
            message: "",
            tipo_falla: "error",
            reportFailure: false,
            reportSupply: false
        });
    };

    useEffect(() => {
        const fetchUserAndReportesSolicitudes = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    showModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
                    setLoading(false);
                    return;
                }

                const userResponse = await axios.get(`${API_URL}/users/profile`, {
                    headers: { Authorization: `Token ${token}` },
                });

                setCurrentUser(userResponse.data);

                const reportesSolicitudesResponse = await axios.get(`${API_URL}/communication/my/requests-and-reports`, {
                    headers: { Authorization: `Token ${token}` },
                });

                // Combine mis_solicitudes and mis_reportes into a single array with unified keys
                const combinedData = [
                    ...reportesSolicitudesResponse.data.mis_solicitudes.map(solicitud => ({
                        id: solicitud.id,
                        tipo: solicitud.tipo,
                        estado: solicitud.estado,
                        fecha: solicitud.fecha
                    })),
                    ...reportesSolicitudesResponse.data.mis_reportes.map(reporte => ({
                        id: reporte.id,
                        tipo: reporte.tipo_falla,
                        estado: reporte.estado,
                        fecha: reporte.fecha
                    }))
                ];

                setReportesSolicitudes(combinedData);
                // console.log("Reportes/solicitudes del usuario:", combinedData);
                setLoading(false);
            } catch {
                showModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte con soporte técnico");
                setLoading(false);
            }
        };

        fetchUserAndReportesSolicitudes();
    }, [API_URL, showModalMessage]);

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
                const matchesId = filters.id.trim() === "" ||
                    reportesSolicitudes.id.toString().includes(filters.id.trim());
        
                const matchesStatus =
                    filters.estado === "" ||
                    reportesSolicitudes.estado?.toLowerCase() === filters.estado.toLowerCase();
                
                let matchesDate = true;
        
                if (filters.startDate || filters.endDate) {
                    try {
                        const reportDate = new Date(reportesSolicitudes.fecha);
                        const reportDateOnly = new Date(
                            reportDate.getFullYear(), 
                            reportDate.getMonth(), 
                            reportDate.getDate()
                        );
        
                        if (filters.startDate) {
                            const startDate = new Date(filters.startDate);
                            const startDateOnly = new Date(
                                startDate.getFullYear(), 
                                startDate.getMonth(), 
                                startDate.getDate()
                            );
                            
                            if (reportDateOnly < startDateOnly) {
                                matchesDate = false;
                            }
                        }
        
                        if (matchesDate && filters.endDate) {
                            const endDate = new Date(filters.endDate);
                            const endDateOnly = new Date(
                                endDate.getFullYear(), 
                                endDate.getMonth(), 
                                endDate.getDate()
                            );
                            
                            if (reportDateOnly > endDateOnly) {
                                matchesDate = false;
                            }
                        }
                    } catch {
                        matchesDate = false;
                    }
                }
        
                return matchesId && matchesDate && matchesStatus;
            });
            
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
        
            if (filters.estado !== "" && filtered.length === 0) {
                showModalMessage("No hay reportes o solicitudes con el estado seleccionado.");
                setFilteredReporteSolicitudes([]);
                return;
            }
        
            setFilteredReporteSolicitudes(filtered);
        } catch {
            showModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.");
            setFilteredReporteSolicitudes([]);
        }
    }, [filters, reportesSolicitudes, showModalMessage]);

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
        {
            key: "tipo",
            label: "Tipo de reporte/solicitud",
            render: (item) => item.tipo || item.tipo_falla || "N/A"
        },
        {
            key: "estado",
            label: "Estado de la petición",
            render: (item) => {
                const estado = item.estado?.toLowerCase();

                const statusStyles = {
                    "pendiente": "bg-yellow-100 text-yellow-800 border border-yellow-300",
                    "en proceso": "bg-blue-100 text-blue-800 border border-blue-300",
                    "a espera de aprobación": "bg-orange-100 text-orange-800 border border-orange-300",
                    "finalizado": "bg-green-100 text-green-800 border border-green-300",
                };

                const statusClass = statusStyles[estado] || "bg-gray-100 text-gray-800 border border-gray-300";

                return (
                    <span className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-40 text-center`}>
                        {item.estado?.charAt(0).toUpperCase() + item.estado?.slice(1)}
                    </span>
                );
            }
        },
        {
            key: "fecha",
            label: "Fecha Creación",
            responsive: "hidden sm:table-cell",
            render: (item) => new Date(item.fecha).toLocaleDateString('es-CO')
        },
    ];

    // Navigate to detail view
    const handleViewReporteSolicitudes = (item) => {
        navigate(`/reportes-y-novedades/mis-reportes-solicitudes/detalle/${item.id}`);
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
                            modal.tipo_falla === "success" ? "Éxito" : 
                            modal.tipo_falla === "warning" ? "Advertencia" : "Error"
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