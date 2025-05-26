import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, User, Calendar, FileText, Package, Activity, Info } from 'lucide-react';
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

    // Modal states - Separamos modal de detalles del modal de mensajes
    const [modal, setModal] = useState({
        show: false,
        message: "",
        tipo_falla: "error",
    });

    const [detailModal, setDetailModal] = useState({
        show: false,
        incidencia: null
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
            params.append('ordering', '-timestamp');

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
                    const actionMap = {
                        'Crear': 'create',
                        'Actualizar': 'update', 
                        'Eliminar': 'delete'
                    };
                    const mappedAction = actionMap[filters.accion] || filters.accion.toLowerCase();
                    params.append('action', mappedAction);
                }
            }

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
                fecha: item.created || item.timestamp,
                changes_summary: item.changes_summary || [],
                remote_addr: item.remote_addr
            }));

            setIncidencias(transformedData);
            
            // Update pagination info
            setPagination({
                currentPage: page,
                totalPages: Math.ceil(data.count / 40),
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
        // { key: "id", label: "ID de la incidencia" },
        {
            key: "actor",
            label: "Usuario",
            render: (item) => item.actor || "Sistema"
        },
        {
            key: "accion",
            label: "Tipo de Acción",
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
            key: "remote_addr",
            label: "Direccion IP",
            responsive: "hidden md:table-cell",
            render: (item) => (
                <span className="truncate max-w-xs" title={item.remote_addr}>
                    {item.remote_addr || "N/A"}
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

    // Show detailed view with improved modal
    const handleViewIncidencia = (item) => {
        setDetailModal({
            show: true,
            incidencia: item
        });
    };

    // Componente para el modal de detalles mejorado
    const DetailModal = ({ incidencia, onClose }) => {
        if (!incidencia) return null;

        const getActionColor = (action) => {
            const colors = {
                "create": "text-green-600 bg-green-50 border-green-200",
                "update": "text-blue-600 bg-blue-50 border-blue-200", 
                "delete": "text-red-600 bg-red-50 border-red-200"
            };
            return colors[action?.toLowerCase()] || "text-gray-600 bg-gray-50 border-gray-200";
        };

        const getActionLabel = (action) => {
            const labels = {
                "create": "Crear",
                "update": "Actualizar",
                "delete": "Eliminar"
            };
            return labels[action?.toLowerCase()] || action;
        };

        const getFieldDisplayName = (field) => {
            const fieldNames = {
                "event": "Evento",
                "timestamp": "Marca de tiempo",
                "ip_address": "Dirección IP interna",
                "user_agent": "Navegador/Cliente"
            };
            return fieldNames[field] || field;
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        return (
            <div className="fixed inset-0  bg-white/10 backdrop-blur-sm bg-opacity-20 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#365486] to-[#344663] text-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Info className="w-6 h-6" />
                                <h2 className="text-xl font-bold">Detalles de Incidencia</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        {/* ID Badge */}
                        <div className="mb-6">
                            <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                ID: {incidencia.id}
                            </span>
                        </div>

                        {/* Main Info Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* Usuario */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <User className="w-5 h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-700">Usuario</span>
                                </div>
                                <p className="text-gray-900 font-medium">
                                    {incidencia.actor || "Sistema"}
                                </p>
                            </div>

                            {/* Acción */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Activity className="w-5 h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-700">Acción</span>
                                </div>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(incidencia.accion)}`}>
                                    {getActionLabel(incidencia.accion)}
                                </span>
                            </div>

                            {/* Modelo */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Package className="w-5 h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-700">Modelo afectado</span>
                                </div>
                                <p className="text-gray-900">
                                    {incidencia.content_type || "N/A"}
                                </p>
                            </div>

                            {/* Fecha */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Calendar className="w-5 h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-700">Fecha y hora</span>
                                </div>
                                <p className="text-gray-900 text-sm">
                                    {formatDate(incidencia.fecha)}
                                </p>
                            </div>
                        </div>

                        {/* IP Address */}
                        {incidencia.remote_addr && (
                            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                                <div className="flex items-center space-x-2 mb-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                    </svg>
                                    <span className="font-semibold text-blue-700">Dirección IP</span>
                                </div>
                                <p className="text-blue-900 font-mono text-sm">
                                    {incidencia.remote_addr}
                                </p>
                            </div>
                        )}

                        {/* Objeto */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="flex items-center space-x-2 mb-2">
                                <FileText className="w-5 h-5 text-gray-600" />
                                <span className="font-semibold text-gray-700">Objeto</span>
                            </div>
                            <p className="text-gray-900 break-words">
                                {incidencia.object_repr || "No especificado"}
                            </p>
                        </div>

                        {/* Cambios */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h3 className="font-semibold text-amber-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Registro de cambios
                            </h3>
                            
                            {incidencia.changes_summary && incidencia.changes_summary.length > 0 ? (
                                <div className="space-y-3">
                                    {incidencia.changes_summary.map((change, index) => (
                                        <div key={index} className="bg-white p-3 rounded border border-amber-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-amber-700 capitalize">
                                                    {getFieldDisplayName(change.field)}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                {change.field === 'user_agent' ? (
                                                    <div className="space-y-2">
                                                        <div className="bg-red-50 p-2 rounded border border-red-200">
                                                            <span className="text-red-600 font-medium">Anterior:</span>
                                                            <p className="break-all text-xs mt-1">{change.old || 'N/A'}</p>
                                                        </div>
                                                        <div className="text-center text-gray-400">↓</div>
                                                        <div className="bg-green-50 p-2 rounded border border-green-200">
                                                            <span className="text-green-600 font-medium">Nuevo:</span>
                                                            <p className="break-all text-xs mt-1">{change.new || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2 flex-wrap">
                                                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs break-all">
                                                            Anterior: {change.old || 'N/A'}
                                                        </span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs break-all">
                                                            Nuevo: {change.new || 'N/A'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <svg className="w-12 h-12 mx-auto text-amber-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-amber-600">No hay cambios registrados para esta incidencia</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    {/* <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
                        <button
                            onClick={onClose}
                            className="bg-[#365486] text-white px-6 py-2 rounded-lg hover:bg-[#344663] transition-colors font-medium"
                        >
                            Cerrar
                        </button>
                    </div> */}
                </div>
            </div>
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

                {/* Modal para mensajes de error/éxito */}
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
                        <p className="text-sm">{modal.message}</p>
                    </Modal>
                )}

                {/* Modal de detalles mejorado */}
                {detailModal.show && (
                    <DetailModal
                        incidencia={detailModal.incidencia}
                        onClose={() => setDetailModal({ show: false, incidencia: null })}
                    />
                )}
            </div>
        </div>
    );
}

export default HistorialIncidencias;