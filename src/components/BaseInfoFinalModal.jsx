import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "./Modal";
import { X, AlertCircle, Info, Camera } from "lucide-react";

/**
 * Componente base para modales de visualización de solicitudes/reportes con su asignación
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.showModal - Controla la visibilidad del modal
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.solicitudBasica - Datos básicos de la solicitud/reporte
 * @param {Function} props.onSuccess - Función a ejecutar en caso de éxito
 * @param {Function} props.onError - Función a ejecutar en caso de error
 * @param {string} props.titulo - Título del modal
 * @param {string} props.tipoAsignacion - Tipo de asignación ('flow_request' o 'failure_report')
 * @param {Function} props.renderDetallesSolicitud - Función para renderizar detalles específicos de la solicitud
 * @param {Function} props.getEndpointDetalle - Función para obtener el endpoint para detalles
 */
const BaseInfoFinalModal = ({ 
  showModal, 
  onClose, 
  solicitudBasica, 
  onSuccess, 
  onError,
  titulo = "Detalle de Solicitud",
  tipoAsignacion = "flow_request",
  renderDetallesSolicitud,
  getEndpointDetalle
}) => {
  const [loading, setLoading] = useState(false);
  const [detalleSolicitud, setDetalleSolicitud] = useState(null);
  const [infoAsignacion, setInfoAsignacion] = useState(null);
  const [informesMantenimiento, setInformesMantenimiento] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [showConnectionErrorModal, setShowConnectionErrorModal] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");

  const API_URL = import.meta.env.VITE_APP_API_URL;

  // Función para extraer el mensaje de error del formato anidado
  const extractErrorMessage = (errorObj) => {
    try {
      // Nuevo formato de error
      if (errorObj && errorObj.status === "error" && errorObj.errors) {
        // Si hay non_field_errors como string
        if (typeof errorObj.errors.non_field_errors === 'string') {
          return errorObj.errors.non_field_errors;
        }
        
        // Si hay non_field_errors como array
        if (Array.isArray(errorObj.errors.non_field_errors) && errorObj.errors.non_field_errors.length > 0) {
          return errorObj.errors.non_field_errors[0];
        }
        
        // Si hay otros campos de error
        const errorFields = Object.keys(errorObj.errors);
        if (errorFields.length > 0) {
          const firstField = errorFields[0];
          const fieldError = errorObj.errors[firstField];
          
          if (typeof fieldError === 'string') {
            return `${firstField}: ${fieldError}`;
          }
          
          if (Array.isArray(fieldError) && fieldError.length > 0) {
            return `${firstField}: ${fieldError[0]}`;
          }
        }
        
        return "Error en la solicitud";
      }
      
      // Casos específicos y otros formatos de error
      if (typeof errorObj === 'string') {
        return errorObj.length < 100 ? errorObj : "Error en el servidor. Por favor, intente más tarde.";
      }
      
      if (errorObj.error && errorObj.error.message) {
        return errorObj.error.message;
      }
      
      if (errorObj.non_field_errors && Array.isArray(errorObj.non_field_errors)) {
        return errorObj.non_field_errors[0];
      }
      
      if (errorObj.message) {
        return errorObj.message;
      }
      
      if (Array.isArray(errorObj) && errorObj.length > 0) {
        return errorObj[0];
      }
      
      const errorKeys = Object.keys(errorObj);
      for (const key of errorKeys) {
        if (Array.isArray(errorObj[key]) && errorObj[key].length > 0) {
          return `${key}: ${errorObj[key][0]}`;
        }
      }
  
      return "Error desconocido. Por favor, intente más tarde.";
    } catch (e) {
      console.error("Error al parsear mensaje de error:", e);
      return "Error al procesar la solicitud.";
    }
  };

  useEffect(() => {
    if (showModal && solicitudBasica) {
      // Resetear alertas cuando se abre el modal
      setAlert({ show: false, type: "", message: "" });
      
      // Cargar datos adicionales específicos de la solicitud
      fetchDetalleSolicitud();
      
      // Cargar información de la asignación
      fetchInfoAsignacion();
    }
  }, [showModal, solicitudBasica]);

  useEffect(() => {
    // Cuando tengamos la información de asignación, buscamos los informes de mantenimiento
    if (infoAsignacion && infoAsignacion.id) {
      fetchInformesMantenimiento();
    }
  }, [infoAsignacion]);

  const showAlert = (type, message) => {
    setAlert({
      show: true,
      type,
      message
    });
    
    // Ocultar la alerta después de 5 segundos si es de éxito
    if (type === "success") {
      setTimeout(() => {
        setAlert({ show: false, type: "", message: "" });
      }, 5000);
    }
  };

  const fetchDetalleSolicitud = async () => {
    if (!solicitudBasica || !solicitudBasica.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Obtener el endpoint dinámicamente
      const endpoint = getEndpointDetalle ? 
        getEndpointDetalle(solicitudBasica, API_URL) : 
        `${API_URL}/communication/admin/requests-and-reports/${solicitudBasica.id}`;
      
      const response = await axios.get(
        endpoint,
        { headers: { Authorization: `Token ${token}` } }
      );
      
      setDetalleSolicitud(response.data);
    } catch (error) {
      console.error("Error al obtener detalles de la solicitud:", error);
      
      if (!error.response) {
        setShowConnectionErrorModal(true);
      } else {
        let errorMessage = "Error al cargar los detalles de la solicitud";
        
        if (error.response?.data) {
          errorMessage = extractErrorMessage(error.response.data);
        }
        
        showAlert("error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInfoAsignacion = async () => {
    if (!solicitudBasica || !solicitudBasica.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Endpoint modificado para incluir parámetro de búsqueda
      const endpoint = `${API_URL}/communication/assignments/list`;
      
      const response = await axios.get(
        endpoint,
        { 
          headers: { Authorization: `Token ${token}` },
          params: { flow_request: solicitudBasica.id } // Enviar parámetro de filtro
        }
      );
      
      // Buscar en los resultados la asignación que corresponda
      if (response.data && response.data.length > 0) {
        // Filtrar por flow_request
        const asignacion = response.data.find(
          item => item.flow_request === solicitudBasica.id
        );
        
        setInfoAsignacion(asignacion || null);
      } else {
        setInfoAsignacion(null);
      }
    } catch (error) {
      console.error("Error al obtener información de la asignación:", error);
      
      if (!error.response) {
        setShowConnectionErrorModal(true);
      } else {
        let errorMessage = "Error al cargar la información de la asignación";
        
        if (error.response?.data) {
          errorMessage = extractErrorMessage(error.response.data);
        }
        
        showAlert("error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInformesMantenimiento = async () => {
    if (!infoAsignacion || !infoAsignacion.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Endpoint para informes de mantenimiento
      const endpoint = `${API_URL}/communication/maintenance-reports/list`;
      
      const response = await axios.get(
        endpoint,
        { 
          headers: { Authorization: `Token ${token}` },
          params: { assignment: infoAsignacion.id } // Filtrar por ID de asignación
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        // Filtrar informes que coincidan con el flujo actual
        const informesFiltrados = response.data.filter(
          informe => informe.assignment_details && 
                    informe.assignment_details.flow_request === solicitudBasica.id
        );
        
        setInformesMantenimiento(informesFiltrados);
      } else {
        setInformesMantenimiento([]);
      }
    } catch (error) {
      console.error("Error al obtener informes de mantenimiento:", error);
      
      if (!error.response) {
        setShowConnectionErrorModal(true);
      } else {
        let errorMessage = "Error al cargar los informes de mantenimiento";
        
        if (error.response?.data) {
          errorMessage = extractErrorMessage(error.response.data);
        }
        
        showAlert("error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return dateString;
    }
  };

  const openImageModal = (imageBase64) => {
    setCurrentImage(imageBase64);
    setImageModalOpen(true);
  };

  // Si no hay datos básicos de la solicitud, no mostrar nada
  if (!solicitudBasica) return null;

  // Componente de alerta interna
  const AlertMessage = ({ type, message }) => {
    const alertStyles = {
      error: "bg-red-50 border-red-200 text-red-700",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
      success: "bg-green-50 border-green-200 text-green-700",
      info: "bg-blue-50 border-blue-200 text-blue-700"
    };

    const iconMap = {
      error: <AlertCircle className="h-5 w-5 mr-2 text-red-500" />,
      warning: <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />,
      success: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      info: <Info className="h-5 w-5 mr-2 text-blue-500" />
    };

    return (
      <div className={`flex items-center p-3 border rounded-md my-3 ${alertStyles[type]}`}>
        {iconMap[type]}
        <span>{message}</span>
        <button 
          onClick={() => setAlert({ show: false, type: "", message: "" })} 
          className="ml-auto text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] sm:w-[700px] md:w-[800px] lg:w-[900px] z-50 max-h-[90vh] flex flex-col">
            {/* Encabezado del modal */}
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-[#365486]">{titulo}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Contenido del modal con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Mostrar alertas internas */}
              {alert.show && (
                <AlertMessage type={alert.type} message={alert.message} />
              )}
              
              {/* Animación de carga */}
              {loading && (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#365486]"></div>
                </div>
              )}
              
              {!loading && (
                <>
                  {/* Sección de información de la solicitud - Contenido personalizable */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {renderDetallesSolicitud ? (
                      renderDetallesSolicitud(solicitudBasica, detalleSolicitud)
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold mb-3 text-blue-800 border-b border-gray-200 pb-2">
                          Información de la Solicitud
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-600 w-32">ID:</span>
                              <span className="text-gray-800">{solicitudBasica.id}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-600 w-32">Usuario:</span>
                              <span className="text-gray-800">{solicitudBasica.created_by || "No especificado"}</span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-600 w-32">Fecha de envío:</span>
                              <span className="text-gray-800">{formatDate(solicitudBasica.created_at)}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-600 w-32">Tipo:</span>
                              <span className="text-gray-800">{solicitudBasica.flow_request_type || tipoAsignacion || "No especificado"}</span>
                            </div>
                          </div>
                        </div>
                        
                        {detalleSolicitud && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-600 mb-1">Observaciones:</h4>
                            <div className="p-3 bg-white rounded-md border border-gray-200 max-h-32 overflow-y-auto">
                              {detalleSolicitud.observations || "No hay observaciones disponibles"}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Sección de información de la asignación */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-blue-800 border-b border-gray-200 pb-2">
                      Información de la Asignación
                    </h3>
                    
                    {infoAsignacion ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">ID de Asignación:</span>
                            <span className="text-gray-800">{infoAsignacion.id}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Asignado por (ID):</span>
                            <span className="text-gray-800">{infoAsignacion.assigned_by}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Asignado por (Nombre):</span>
                            <span className="text-gray-800">{infoAsignacion.assigned_by_name}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Asignado a (ID):</span>
                            <span className="text-gray-800">{infoAsignacion.assigned_to}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Asignado a (Nombre):</span>
                            <span className="text-gray-800">{infoAsignacion.assigned_to_name}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Fecha de asignación:</span>
                            <span className="text-gray-800">{formatDate(infoAsignacion.assignment_date)}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col col-span-1 md:col-span-2">
                          <span className="font-medium text-gray-600">Estado de reasignación:</span>
                          <span className={`mt-1 px-3 py-1 rounded-full text-sm inline-flex items-center justify-center w-fit ${infoAsignacion.reassigned ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {infoAsignacion.reassigned ? 'Reasignado' : 'Asignación original'}
                          </span>
                        </div>
                        
                        {infoAsignacion.failure_report && (
                          <div className="flex flex-col col-span-1 md:col-span-2">
                            <span className="font-medium text-gray-600">ID del reporte de falla:</span>
                            <span className="text-gray-800">{infoAsignacion.failure_report}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                        <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                        <span>No se encontró información de asignación para esta solicitud.</span>
                      </div>
                    )}
                  </div>

                  {/* NUEVA SECCIÓN: Detalles del Informe */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-blue-800 border-b border-gray-200 pb-2">
                      Detalles del Informe
                    </h3>
                    
                    {informesMantenimiento && informesMantenimiento.length > 0 ? (
                      <div className="space-y-4">
                        {informesMantenimiento.map((informe, index) => (
                          <div key={informe.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <h4 className="font-semibold text-blue-700 mb-2">
                              Informe #{index + 1} (ID: {informe.id})
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div className="flex flex-col space-y-2">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-600">Fecha de intervención:</span>
                                  <span className="text-gray-800">{formatDate(informe.intervention_date)}</span>
                                </div>
                                
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-600">Fecha de creación:</span>
                                  <span className="text-gray-800">{formatDate(informe.created_at)}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-600">Estado:</span>
                                  <span className={`mt-1 px-3 py-1 rounded-full text-sm inline-flex items-center justify-center w-fit ${
                                    informe.status === 'Finalizado' ? 'bg-green-100 text-green-800' : 
                                    informe.status === 'En proceso' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {informe.status}
                                  </span>
                                </div>
                                
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-600">Aprobado:</span>
                                  <span className={`mt-1 px-3 py-1 rounded-full text-sm inline-flex items-center justify-center w-fit ${
                                    informe.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {informe.is_approved ? 'Sí' : 'No'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h5 className="font-medium text-gray-600 mb-1">Descripción:</h5>
                              <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-32 overflow-y-auto">
                                {informe.description || "Sin descripción"}
                              </div>
                            </div>
                            
                            {informe.images && (
                              <div>
                                <h5 className="font-medium text-gray-600 mb-2">Imágenes:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {informe.images ? (
                                    <div 
                                      className="relative group cursor-pointer border border-gray-300 rounded-md overflow-hidden"
                                      onClick={() => openImageModal(`data:image/jpeg;base64,${informe.images}`)}
                                    >
                                      <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-gray-100">
                                        {informe.images ? (
                                          <img 
                                            src={`data:image/jpeg;base64,${informe.images}`} 
                                            alt={`Imagen informe ${informe.id}`}
                                            className="max-w-full max-h-full object-contain"
                                          />
                                        ) : (
                                          <Camera size={24} className="text-gray-400" />
                                        )}
                                      </div>
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                          Ver imagen
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center p-2 border border-gray-200 rounded bg-gray-50 text-gray-500">
                                      No hay imágenes disponibles
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
                        <Info className="h-5 w-5 mr-2 text-blue-500" />
                        <span>No se encontraron informes de mantenimiento para esta solicitud.</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Pie del modal con botones */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para visualizar imagen a tamaño completo */}
      {imageModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-70 z-[60]">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-3xl max-h-[90vh] w-[90%] p-1">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md z-10"
            >
              <X size={24} className="text-gray-700" />
            </button>
            <div className="w-full h-full flex items-center justify-center p-2 overflow-auto">
              <img 
                src={currentImage} 
                alt="Imagen ampliada" 
                className="max-w-full max-h-[calc(90vh-40px)] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de error de conexión */}
      <Modal
        showModal={showConnectionErrorModal}
        onClose={() => setShowConnectionErrorModal(false)}
        title="ERROR"
        btnMessage="Entendido"
      >
        <p>Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.</p>
      </Modal>
    </>
  );
};

export default BaseInfoFinalModal;