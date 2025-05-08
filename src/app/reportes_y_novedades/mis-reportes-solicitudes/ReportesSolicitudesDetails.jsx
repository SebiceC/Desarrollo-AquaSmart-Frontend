import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import NavBar from '../../../components/NavBar';
import Modal from '../../../components/Modal';
import BackButton from '../../../components/BackButton';
import axios from 'axios';

function ReportesSolicitudesDetails() {
  // Estados para la funcionalidad
  const [loading, setLoading] = useState(true);
  const [reporteSolicitud, setReporteSolicitud] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estados para modales de error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [errorModalTitle, setErrorModalTitle] = useState('ERROR');

  // Obtener el ID del reporte/solicitud de la URL
  const { id_reportes_solicitudes } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Verificación de depuración
  console.log("ID de reporte/solicitud recibido (params):", id_reportes_solicitudes);
  console.log("URL completa:", location.pathname);

  // URL de la API
  const API_URL = import.meta.env.VITE_APP_API_URL;

  // Función para mostrar modal de error
  const showError = (message, title = 'ERROR') => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setShowErrorModal(true);
  };

  // Función para obtener el perfil del usuario
  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showError('No hay una sesión activa. Por favor, inicie sesión.', 'Error de autenticación');
        return null;
      }
      
      const userResponse = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      setCurrentUser(userResponse.data);
      return userResponse.data;
    } catch (err) {
      console.error("Error al obtener los datos del usuario:", err);
      let errorMessage = "Error al obtener los datos del usuario.";
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Su sesión ha expirado. Por favor, inicie sesión nuevamente.";
          navigate("/login");
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      }
      
      showError(errorMessage, 'Error de autenticación');
      return null;
    }
  }, [API_URL, navigate]);

  // Función para obtener los datos del reporte/solicitud
  const fetchReporteData = useCallback(async (userData) => {
    try {
      // Verificar que id_reportes_solicitudes no sea undefined
      if (!id_reportes_solicitudes || id_reportes_solicitudes === 'undefined') {
        showError(`ID de reporte/solicitud no válido o no especificado.`);
        return;
      }

      // Asegurarnos de que id_reportes_solicitudes sea un número entero
      const reporteIdNumerico = parseInt(id_reportes_solicitudes, 10);
      
      if (isNaN(reporteIdNumerico)) {
        showError(`ID de reporte/solicitud inválido: ${id_reportes_solicitudes}`);
        return;
      }

      const token = localStorage.getItem('token');
      console.log("Realizando petición a:", `${API_URL}/reportes/solicitudes/${reporteIdNumerico}`);
      
      // Mock data para desarrollo - Quitar en producción
      const mockResponse = {
        data: {
          id: reporteIdNumerico,
          id_reportes_solicitudes: id_reportes_solicitudes,
          code: `SOL${reporteIdNumerico.toString().padStart(3, '0')}`,
          type: reporteIdNumerico % 2 === 0 ? "Fallo en Suministro" : "Fallo en Aplicativo",
          description: "Descripción detallada del problema reportado. Este es un texto de ejemplo para mostrar la información del reporte o solicitud.",
          status: ["pendiente", "en proceso", "a espera de aprobacion", "finalizado"][reporteIdNumerico % 4],
          creation_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
          client_document: "123456789",
          technical_notes: reporteIdNumerico % 2 === 0 ? "Notas técnicas sobre este caso. Se requiere revisión por parte del equipo especializado." : "",
          address: "Calle Principal #123-45",
          priority: ["Alta", "Media", "Baja"][reporteIdNumerico % 3],
          assigned_technician: reporteIdNumerico % 3 === 0 ? "Carlos Rodríguez" : "",
          resolution_date: reporteIdNumerico % 4 === 0 ? new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString() : null
        }
      };

      // Comentar esta línea y descomentar el código de axios para producción
      const response = mockResponse;
      
      // Endpoint para obtener el reporte/solicitud específica por ID
      // const response = await axios.get(`${API_URL}/reportes/solicitudes/${reporteIdNumerico}`, {
      //   headers: { Authorization: `Token ${token}` },
      // });

      // Verificar si hay datos del reporte/solicitud
      if (!response.data) {
        showError(`No se encontró el reporte/solicitud con ID ${id_reportes_solicitudes}.`);
        setReporteSolicitud(null);
        return;
      }
      
      // Validar si el reporte/solicitud pertenece al usuario logueado
      if (userData && userData.document && response.data.client_document) {
        if (userData.document !== response.data.client_document) {
          throw {
            response: {
              status: 403,
              data: { detail: "No tiene permisos para acceder a este reporte/solicitud. Este reporte/solicitud pertenece a otro usuario." }
            }
          };
        }
      }
      
      setReporteSolicitud(response.data);
      
    } catch (err) {
      console.error("Error al obtener los datos del reporte/solicitud:", err);
      
      let errorMessage = "Error al obtener los datos del reporte/solicitud.";

      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = "No tiene permisos para acceder a este reporte/solicitud.";
          if (err.response.data?.detail) {
            errorMessage = err.response.data.detail;
          }
          // Redirigir en caso de acceso no autorizado
          navigate('/reportes-y-novedades/mis-reportes-solicitudes');
        } else if (err.response.status === 404) {
          errorMessage = `No se encontró el reporte/solicitud con ID ${id_reportes_solicitudes}.`;
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet.";
      } else {
        errorMessage = `Error de configuración: ${err.message}`;
      }
      
      showError(errorMessage, err.response?.status === 403 ? 'Acceso denegado' : 'ERROR');
      setReporteSolicitud(null);
    }
  }, [API_URL, id_reportes_solicitudes, navigate]);

  // Función para cargar todos los datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await fetchUserData();
      if (user) {
        await fetchReporteData(user);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, fetchReporteData]);

  // Cargar usuario y reporte/solicitud al montar el componente
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener el color de estado para la UI
  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'en proceso':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'a espera de aprobacion':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'finalizado':
        return 'bg-green-100 text-green-800 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  // Obtener el color de prioridad para la UI
  const getPriorityStyle = (priority) => {
    const priorityLower = priority?.toLowerCase() || '';
    
    switch (priorityLower) {
      case 'alta':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'media':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'baja':
        return 'bg-green-100 text-green-800 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  // Función para capitalizar la primera letra
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16 md:py-20">
      <NavBar />
      
      <div className="w-full px-4 mx-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-center my-6 sm:my-8 md:my-10 text-base sm:text-lg md:text-xl font-semibold">
            {reporteSolicitud ? (
              <>
                {reporteSolicitud.type} - {reporteSolicitud.code}
              </>
            ) : (
              `Reporte/Solicitud ${id_reportes_solicitudes}`
            )}
          </h1>

          {/* Modal de errores unificado */}
          <Modal
            showModal={showErrorModal}
            onClose={() => {
              setShowErrorModal(false);
              // Si hay error de permisos, redirigir a la lista de reportes
              if (errorModalTitle === 'Acceso denegado') {
                navigate('/reportes-y-novedades/mis-reportes-solicitudes');
              }
            }}
            title={errorModalTitle}
            btnMessage="Entendido"
          >
            <p>{errorModalMessage}</p>
          </Modal>
          
          {/* Estado de carga */}
          {loading && (
            <div className="flex justify-center items-center py-8 sm:py-10 md:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-sm sm:text-base text-gray-600">Cargando datos del reporte/solicitud...</span>
            </div>
          )}

          {/* Detalles del reporte/solicitud */}
          {!loading && reporteSolicitud && (
            <div className="flex flex-col space-y-4">
              {/* Tarjeta de información principal */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-0">
                    {reporteSolicitud.code} - {reporteSolicitud.type}
                  </h3>
                  <span className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full ${getStatusStyle(reporteSolicitud.status)}`}>
                    {capitalizeFirstLetter(reporteSolicitud.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* Columna 1 */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">ID de la solicitud</h4>
                      <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.id_reportes_solicitudes}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Fecha de creación</h4>
                      <p className="text-sm sm:text-base text-gray-800 mt-1">{formatDate(reporteSolicitud.creation_date)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Prioridad</h4>
                      <span className={`inline-flex mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityStyle(reporteSolicitud.priority)}`}>
                        {reporteSolicitud.priority || 'No asignada'}
                      </span>
                    </div>
                    
                    {reporteSolicitud.address && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Dirección</h4>
                        <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.address}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Columna 2 */}
                  <div className="space-y-4">
                    {reporteSolicitud.assigned_technician && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Técnico asignado</h4>
                        <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.assigned_technician}</p>
                      </div>
                    )}
                    
                    {reporteSolicitud.resolution_date && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Fecha de resolución</h4>
                        <p className="text-sm sm:text-base text-gray-800 mt-1">{formatDate(reporteSolicitud.resolution_date)}</p>
                      </div>
                    )}
                    
                    {reporteSolicitud.status === 'finalizado' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Tiempo de resolución</h4>
                        <p className="text-sm sm:text-base text-gray-800 mt-1">
                          {reporteSolicitud.resolution_date ? 
                            `${Math.ceil((new Date(reporteSolicitud.resolution_date) - new Date(reporteSolicitud.creation_date)) / (1000 * 60 * 60 * 24))} días` : 
                            'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Descripción del problema */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Descripción del problema</h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded border border-gray-200">
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                    {reporteSolicitud.description || 'No se proporcionó una descripción.'}
                  </p>
                </div>
              </div>
              
              {/* Notas técnicas (si existen) */}
              {reporteSolicitud.technical_notes && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Notas técnicas</h3>
                  <div className="bg-blue-50 p-3 sm:p-4 rounded border border-blue-200">
                    <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                      {reporteSolicitud.technical_notes}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Línea de tiempo / Historial (opcional, se puede implementar en el futuro) */}
              
              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <BackButton 
                  to="/reportes-y-novedades/mis-reportes-solicitudes" 
                  text="Regresar a mis reportes y solicitudes" 
                  className="hover:bg-blue-50 mb-3 sm:mb-0 w-full sm:w-auto" 
                />
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  {/* Botón de seguimiento (solo visible si no está finalizado) */}
                  {reporteSolicitud.status.toLowerCase() !== 'finalizado' && (
                    <button
                      onClick={() => showError("Funcionalidad de seguimiento en desarrollo", "Próximamente")}
                      className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-600 hover:scale-105 w-full sm:w-auto"
                    >
                      Seguimiento
                    </button>
                  )}
                  
                  {/* Botón para cancelar solicitud (solo visible en ciertos estados) */}
                  {['pendiente', 'a espera de aprobacion'].includes(reporteSolicitud.status.toLowerCase()) && (
                    <button
                      onClick={() => showError("¿Está seguro de cancelar esta solicitud? Esta acción no se puede deshacer.", "Confirmar cancelación")}
                      className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-red-600 hover:scale-105 w-full sm:w-auto"
                    >
                      Cancelar solicitud
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Mensaje cuando no hay datos */}
          {!loading && !reporteSolicitud && (
            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">No se encontró el reporte/solicitud</h2>
              <p className="text-gray-500 text-center mb-6">No pudimos encontrar el reporte o solicitud con el ID especificado.</p>
              <BackButton 
                to="/reportes-y-novedades/mis-reportes-solicitudes" 
                text="Volver a mis reportes y solicitudes" 
                className="bg-blue-500 text-white hover:bg-blue-600" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportesSolicitudesDetails;