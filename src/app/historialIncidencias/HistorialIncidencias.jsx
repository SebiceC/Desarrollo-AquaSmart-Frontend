import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NavBar from '../../components/NavBar';
import InputFilterIncidencias from '../../components/InputFilterIncidencias';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import axios from 'axios';

function HistorialIncidencias() {
    const API_URL = import.meta.env.VITE_APP_API_URL;
    
    // State variables
    const [incidencias, setIncidencias] = useState([]);
    const [filteredIncidencias, setFilteredIncidencias] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
        nextUrl: null,
        previousUrl: null
    });

    // Modal states consolidated into a single object
    const [modal, setModal] = useState({
        show: false,
        message: "",
        tipo_falla: "error", // "error", "success", "warning"
    });

    // Filter states
    const [filters, setFilters] = useState({
        id: "",
        startDate: "",
        endDate: "",
        accion: "",
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

    // Update filters
    const handleFilterChange = (name, value) => {
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    // Fetch incidencias with filters and pagination
    const fetchIncidencias = async (page = 1, applyFilters = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                showModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
                setLoading(false);
                return;
            }

            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('ordering', '-timestamp'); // Ordenar por fecha descendente

            // Apply filters only when explicitly requested
            if (applyFilters) {
                if (filters.id.trim()) {
                    params.append('actor', filters.id.trim());
                }
                if (filters.startDate) {
                    params.append('start_date', filters.startDate);
                }
                if (filters.endDate) {
                    params.append('end_date', filters.endDate);
                }
                if (filters.accion) {
                    // Mapear las acciones del filtro a los valores del API
                    const actionMap = {
                        'Crear': 'create',
                        'Actualizar': 'update', 
                        'Eliminar': 'delete'
                    };
                    const mappedAction = actionMap[filters.accion] || filters.accion.toLowerCase();
                    params.append('action', mappedAction);
                }
            }

            console.log("Token usado:", token);
            console.log("URL final:", `${API_URL}/auditlog/logs?${params.toString()}`);
            const response = await axios.get(`${API_URL}/auditlog/logs?${params.toString()}`, {
                headers: { Authorization: `Token ${token}` },
            });

            const data = response.data;
            
            // Transform data to match our component structure
            const transformedData = data.results.map(item => ({
                id: item.id,
                actor: item.actor,
                accion: item.action,
                content_type: item.content_type,
                object_repr: item.object_repr,
                fecha: item.created || item.timestamp, // Usar created o timestamp según disponibilidad
                changes_summary: item.changes_summary || []
            }));

            setIncidencias(transformedData);
            
            // Update pagination info
            setPagination({
                currentPage: page,
                totalPages: Math.ceil(data.count / 40), // 40 registros por página
                totalCount: data.count,
                hasNext: !!data.next,
                hasPrevious: !!data.previous,
                nextUrl: data.next,
                previousUrl: data.previous
            });

            // Set filtered data if filters were applied
            if (applyFilters) {
                setFilteredIncidencias(transformedData);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching incidencias:', error);
            showModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte con soporte técnico");
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchIncidencias(1, false);
    }, []);

    // Apply filters function
    const applyFilters = useCallback(() => {
        try {
            // ID validation
            if (filters.id.trim() !== "" && !/^[A-Za-z0-9]+$/.test(filters.id.trim())) {
                showModalMessage("El ID de usuario contiene caracteres no válidos");
                return;
            }

            // Date validation
            if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
                showModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
                return;
            }

            // Reset to first page when applying filters
            fetchIncidencias(1, true);
        } catch {
            showModalMessage("Error al aplicar filtros, intente de nuevo más tarde o contacte a soporte técnico.");
        }
    }, [filters, showModalMessage]);

    // Clear filters
    const clearFilters = () => {
        setFilters({
            id: "",
            startDate: "",
            endDate: "",
            accion: "",
        });
        setFilteredIncidencias(null);
        fetchIncidencias(1, false);
    };

    // Pagination handlers
    const handleNextPage = () => {
        if (pagination.hasNext) {
            const nextPage = pagination.currentPage + 1;
            const hasActiveFilters = Object.values(filters).some(value => value.trim() !== "");
            fetchIncidencias(nextPage, hasActiveFilters);
        }
    };

    const handlePreviousPage = () => {
        if (pagination.hasPrevious) {
            const prevPage = pagination.currentPage - 1;
            const hasActiveFilters = Object.values(filters).some(value => value.trim() !== "");
            fetchIncidencias(prevPage, hasActiveFilters);
        }
    };

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
        { key: "id", label: "ID de la incidencia" },
        {
            key: "actor",
            label: "Usuario",
            render: (item) => item.actor || "Sistema"
        },
        {
            key: "accion",
            label: "Acción",
            render: (item) => {
                const accion = item.accion?.toLowerCase();
                const actionStyles = {
                    "create": "bg-green-100 text-green-800 border border-green-300",
                    "update": "bg-blue-100 text-blue-800 border border-blue-300",
                    "delete": "bg-red-100 text-red-800 border border-red-300",
                };

                const actionLabels = {
                    "create": "Crear",
                    "update": "Actualizar",
                    "delete": "Eliminar"
                };

                const actionClass = actionStyles[accion] || "bg-gray-100 text-gray-800 border border-gray-300";
                const actionLabel = actionLabels[accion] || item.accion;

                return (
                    <span className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionClass} w-24 text-center`}>
                        {actionLabel}
                    </span>
                );
            }
        },
        {
            key: "content_type",
            label: "Modelo afectado",
            responsive: "hidden md:table-cell",
            render: (item) => item.content_type || "N/A"
        },
        {
            key: "object_repr",
            label: "Objeto",
            responsive: "hidden lg:table-cell",
            render: (item) => (
                <span className="truncate max-w-xs" title={item.object_repr}>
                    {item.object_repr || "N/A"}
                </span>
            )
        },
        {
            key: "fecha",
            label: "Fecha",
            responsive: "hidden sm:table-cell",
            render: (item) => new Date(item.fecha).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
    ];

    // Show detailed view (could navigate to detail page)
    const handleViewIncidencia = (item) => {
        // For now, show details in modal
        const changesText = item.changes_summary.length > 0 
            ? item.changes_summary.map(change => `${change.field}: ${change.old} → ${change.new}`).join('\n')
            : 'No hay cambios registrados';
            
        showModalMessage(
            `Detalles de la incidencia:\n\nID: ${item.id}\nUsuario: ${item.actor}\nAcción: ${item.accion}\nObjeto: ${item.object_repr}\nFecha: ${new Date(item.fecha).toLocaleString('es-CO')}\n\nCambios:\n${changesText}`,
            "success"
        );
    };

    const displayData = filteredIncidencias !== null ? filteredIncidencias : incidencias;

    return (
        <div>
            <NavBar />
            <div className="container mx-auto p-4 md:p-8 lg:p-20">
                <h1 className="text-center my-10 text-lg md:text-2xl font-bold mb-6">
                    HISTORIAL DE INCIDENCIAS
                </h1>

                <InputFilterIncidencias
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={applyFilters}
                />

                {/* Clear filters button */}
                {filteredIncidencias !== null && (
                    <div className="mb-4 text-center">
                        <button
                            onClick={clearFilters}
                            className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-600"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center my-10">
                        <p>Cargando incidencias...</p>
                    </div>
                ) : (
                    <>
                        {/* Results info */}
                        <div className="mb-4 text-sm text-gray-600 text-center">
                            Mostrando {displayData.length} de {pagination.totalCount} incidencias
                            {filteredIncidencias !== null && " (filtradas)"}
                        </div>

                        {/* DataTable with incidencias */}
                        <DataTable
                            columns={columns}
                            data={displayData}
                            emptyMessage="No se encontraron incidencias con los filtros aplicados."
                            onViewReportesSolicitudes={handleViewIncidencia}
                            customStyles={customStyles}
                        />

                        {/* Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center mt-6 space-x-4">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={!pagination.hasPrevious}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                                        pagination.hasPrevious
                                            ? 'bg-[#365486] text-white hover:bg-[#344663]'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <ChevronLeft size={16} className="mr-1" />
                                    Anterior
                                </button>

                                <span className="text-sm text-gray-600">
                                    Página {pagination.currentPage} de {pagination.totalPages}
                                </span>

                                <button
                                    onClick={handleNextPage}
                                    disabled={!pagination.hasNext}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                                        pagination.hasNext
                                            ? 'bg-[#365486] text-white hover:bg-[#344663]'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Siguiente
                                    <ChevronRight size={16} className="ml-1" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Modal for messages */}
                {modal.show && (
                    <Modal
                        showModal={modal.show}
                        onClose={() => setModal(prev => ({ ...prev, show: false }))}
                        title={
                            modal.tipo_falla === "success" ? "Detalles de Incidencia" : 
                            modal.tipo_falla === "warning" ? "Advertencia" : "Error"
                        }
                        btnMessage="Cerrar"
                    >
                        <pre className="whitespace-pre-wrap text-sm">{modal.message}</pre>
                    </Modal>
                )}
            </div>
        </div>
    );
}

export default HistorialIncidencias;