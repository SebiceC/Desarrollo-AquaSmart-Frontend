// BaseSolicitudModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "./Modal";

const BaseSolicitudModal = ({
  showModal,
  onClose,
  solicitudBasica,
  onSuccess,
  onError,
  readOnly = false, // Determina si es modo solo lectura o no
  renderExtraButtons = null, // Función que renderiza botones adicionales
}) => {
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConnectionErrorModal, setShowConnectionErrorModal] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const API_URL = import.meta.env.VITE_APP_API_URL;

  // Limpiar mensajes cuando cambia la solicitud o se cierra el modal
  useEffect(() => {
    if (solicitudBasica || !showModal) {
      setError("");
      setSuccessMessage("");
      setIsSubmitting(false);
      setShowConnectionErrorModal(false);
      setShowRejectConfirmation(false);
      setRejectReason("");
      setRejectReasonError("");
    }
  }, [solicitudBasica, showModal]);

  useEffect(() => {
    const fetchSolicitudDetails = async () => {
      if (solicitudBasica && showModal) {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          
          // Usar el endpoint para obtener detalles de solicitud usando axios
          const response = await axios.get(
            `${API_URL}/communication/admin/requests-and-reports/${solicitudBasica.id}`,
            { headers: { Authorization: `Token ${token}` } }
          );
          
          setSolicitud({
            ...response.data,
            type: solicitudBasica.type // Preservar el tipo de la solicitud básica
          });
        } catch (error) {
          console.error("Error al obtener detalles de la solicitud:", error);
          
          // Si es un error de red, mostrar el modal de error de conexión
          if (axios.isAxiosError(error) && !error.response) {
            setShowConnectionErrorModal(true);
          } else {
            onError("Error al cargar los detalles de la solicitud.");
            onClose();
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSolicitudDetails();
  }, [solicitudBasica, showModal, API_URL, onError, onClose]);

  // Función para determinar el tipo de comando según el tipo de solicitud
  const getCommandConfig = (solicitud) => {
    const flowRequestType = solicitud.flow_request_type;
    
    // Normalizar el tipo de solicitud para comparación
    const normalizedType = flowRequestType?.toLowerCase() || "";
    
    if (normalizedType.includes("cancelacion temporal") || normalizedType === "cancelacion temporal de caudal") {
      // Para cancelación temporal, solo enviar comando "cerrar"
      return {
        comando: "cerrar",
        lote_id: solicitud.lot
      };
    } else if (
      normalizedType.includes("cambio") || 
      normalizedType.includes("activacion") ||
      normalizedType === "cambio_caudal" ||
      normalizedType === "activacion"
    ) {
      // Para cambio de caudal y activación, enviar comando "ajustar" con ángulo
      return {
        comando: "ajustar",
        angulo: Number.parseFloat(solicitud.requested_flow),
        lote_id: solicitud.lot
      };
    } else {
      // Para otros tipos, usar el comportamiento por defecto (ajustar)
      return {
        comando: "ajustar",
        angulo: Number.parseFloat(solicitud.requested_flow),
        lote_id: solicitud.lot
      };
    }
  };

  const handleAccept = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");
      
      const token = localStorage.getItem("token");
      
      // Primera solicitud - Aprobar en tu API
      const endpoint = `${API_URL}/communication/flow-request/${solicitud.id}/approve`;
      
      await axios.post(
        endpoint, 
        {}, 
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      // Segunda solicitud - Comando al endpoint externo
      const endpoint2 = "https://mqtt-flask-api-production.up.railway.app/publicar_comando_lote";
      
      // Obtener la configuración del comando según el tipo de solicitud
      const commandConfig = getCommandConfig(solicitud);
      
      console.log("Enviando comando externo:", commandConfig);
      console.log("Tipo de solicitud:", solicitud.flow_request_type);
  
      await axios.post(
        endpoint2,
        commandConfig,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos de timeout
        }
      );
      
      console.log("Comando externo enviado exitosamente");
      
      setSuccessMessage("Solicitud aceptada exitosamente");
      
      setTimeout(() => {
        onSuccess("Solicitud aceptada exitosamente");
        onClose();
      }, 500);
      
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
      
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          setShowConnectionErrorModal(true);
        } else if (error.response.status >= 500) {
          setError("Error en el servidor. Por favor, intente más tarde.");
        } else {
          setError(`Error: ${error.response.data?.message || 'Error desconocido'}`);
        }
      } else {
        setError("Error inesperado. Por favor, intente más tarde.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectConfirmation(true);
  };

  const handleRejectConfirmation = async () => {
    // Validar que el motivo del rechazo tenga al menos 5 caracteres
    if (rejectReason.trim().length < 5) {
      setRejectReasonError("El motivo del rechazo debe tener al menos 5 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setRejectReasonError("");
      setSuccessMessage("");
      
      const token = localStorage.getItem("token");
      
      // Usar el endpoint de rechazo con axios
      const endpoint = `${API_URL}/communication/flow-request/${solicitud.id}/reject`;
      
      // Enviar solicitud para rechazar con el motivo usando axios
      await axios.post(
        endpoint,
        { observations: rejectReason },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccessMessage("Solicitud rechazada exitosamente");
      setShowRejectConfirmation(false);
      
      // Esperar un momento para mostrar el mensaje antes de cerrar
      setTimeout(() => {
        onSuccess("Solicitud rechazada exitosamente");
        onClose();
      }, 500);
      
    } catch (error) {
      console.error("Error al rechazar la solicitud:", error);
      
      // Si es un error de red, mostrar el modal de error de conexión
      if (axios.isAxiosError(error) && !error.response) {
        setShowConnectionErrorModal(true);
      } else {
        setError("Error al rechazar la solicitud. Por favor, intente más tarde.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Determinar qué campos mostrar
  const renderFields = () => {
    if (!solicitud) return null;

    const leftColumnFields = (
      <div className="flex flex-col space-y-2 sm:space-y-4">
        <div className="text-left">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Usuario que envía la solicitud:
          </label>
          <input
            type="text"
            value={solicitud.created_by}
            disabled
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="text-left">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Tipo de solicitud:
          </label>
          <input
            type="text"
            value={solicitud.flow_request_type}
            disabled
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="text-left">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Fecha de envío de la solicitud:
          </label>
          <input
            type="text"
            value={formatDate(solicitud.created_at)}
            disabled
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
          />
        </div>
        
        {readOnly && (
          <div className="text-left">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Estado:
            </label>
            <input
              type="text"
              value={solicitud.is_approved ? "Aprobada" : solicitud.is_approved === false ? "Rechazada" : "Pendiente"}
              disabled
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
        )}
      </div>
    );

    const rightColumnFields = (
      <div className="flex flex-col space-y-2 sm:space-y-4">
        <div className="text-left">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            ID de la solicitud:
          </label>
          <input
            type="text"
            value={solicitud.id}
            disabled
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="text-left">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            ID del lote:
          </label>
          <input
            type="text"
            value={solicitud.lot}
            disabled
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="text-left">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Caudal solicitado (l/s):
          </label>
          <input
            type="text"
            value={solicitud.requested_flow || "-"}
            disabled
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        {readOnly && (
          <div className="text-left">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Fecha de recepción:
            </label>
            <input
              type="text"
              value={formatDate(solicitud.finalized_at)}
              disabled
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
        )}
      </div>
    );

    // Campo de observaciones que ocupa todo el ancho
    const observationsField = (
      <div className="mt-4 text-left col-span-1 sm:col-span-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Observaciones:
        </label>
        <textarea
          value={solicitud.observations || "-"}
          disabled
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-gray-100"
          rows={3}
        />
      </div>
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {leftColumnFields}
        {rightColumnFields}
        {observationsField}
      </div>
    );
  };

  if (!showModal) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center w-full max-w-[700px] max-h-[90vh] overflow-y-auto">
          {/* Título */}
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">GESTIÓN DE SOLICITUD</h2>

          {loading ? (
            <div className="flex justify-center items-center h-32 sm:h-64">
              <div className="text-gray-500 text-xs sm:text-sm">Cargando información de la solicitud...</div>
            </div>
          ) : (
            <>
              {/* Campos del formulario */}
              <div className="mb-4 sm:mb-6">
                {renderFields()}
              </div>

              {/* Mensajes de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md mb-3 sm:mb-4 text-xs sm:text-sm text-left">
                  <p className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Mensajes de éxito */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md mb-3 sm:mb-4 text-xs sm:text-sm text-left">
                  <p className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto order-3 sm:order-1"
                  disabled={isSubmitting}
                >
                  Volver a la lista
                </button>
                
                {/* Renderizamos botones adicionales solo si no es modo solo lectura y si se proporciona la función renderExtraButtons */}
                {!readOnly && renderExtraButtons && (
                  <div className="flex gap-3 sm:gap-4 order-1 sm:order-2">
                    {renderExtraButtons({
                      handleRejectClick,
                      handleAccept,
                      isSubmitting,
                      successMessage
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de rechazo */}
      {showRejectConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-[60] p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-[500px]">
            <h3 className="text-lg font-bold mb-4 text-center">Rechazar Solicitud</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                Motivo del rechazo:
              </label>
              <textarea 
                className={`w-full px-3 py-2 border ${rejectReasonError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Escribe aquí el motivo del rechazo (mínimo 5 caracteres)..."
              />
              {rejectReasonError && (
                <p className="mt-1 text-red-500 text-xs">{rejectReasonError}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectConfirmation(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectConfirmation}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Procesando..." : "Confirmar rechazo"}
              </button>
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

export default BaseSolicitudModal;

