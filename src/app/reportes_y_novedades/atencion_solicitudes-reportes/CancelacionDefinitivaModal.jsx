import React from "react";
import BaseAsignacionModal from "../../../components/BaseAsignacionModal";

/**
 * Modal para la asignación de solicitudes de Cancelación Definitiva de Caudal
 */
const CancelacionDefinitivaModal = ({ showModal, onClose, solicitudBasica, onSuccess, onError }) => {
  // Función para renderizar los detalles específicos de la solicitud
  const renderDetallesCancelacion = (solicitudBasica, detalleSolicitud) => (
    <>
      <h3 className="text-lg font-semibold mb-3 text-blue-800 border-b border-gray-200 pb-2">
        Información de la Solicitud de Caudal
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-32">ID:</span>
            <span className="text-gray-800">{solicitudBasica.id}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-16">Usuario:</span>
            <span className="text-gray-800">{solicitudBasica.created_by || "No especificado"}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-27">Tipo solicitud:</span>
            <span className="text-gray-800">{solicitudBasica.flow_request_type || "No especificado"}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-14">Estado:</span>
            <span className="text-gray-800">{solicitudBasica.status || "No especificado"}</span>
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-32">Fecha de envío:</span>
            <span className="text-gray-800">{solicitudBasica.created_at || "No especificada"}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-21">ID del lote:</span>
            <span className="text-gray-800">{detalleSolicitud?.lot || "No especificado"}</span>
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
  );

  // Función para obtener el endpoint de detalles
  const getEndpointDetalle = (solicitudBasica, API_URL) => {
    return `${API_URL}/communication/admin/requests-and-reports/${solicitudBasica.id}`;
  };

  // Función para crear los datos de asignación
  const crearDataAsignacion = (solicitudId, tecnicoId) => {
    return {
      flow_request: solicitudId,
      assigned_to: tecnicoId,
      reassigned: false // Agregamos este campo para manejar casos de reasignación
    };
  };

  return (
    <BaseAsignacionModal
      showModal={showModal}
      onClose={onClose}
      solicitudBasica={solicitudBasica}
      onSuccess={onSuccess}
      onError={onError}
      titulo="Asignación de Cancelación Definitiva de Caudal"
      tipoAsignacion="flow_request"
      renderDetallesSolicitud={renderDetallesCancelacion}
      getEndpointDetalle={getEndpointDetalle}
      dataAsignacion={crearDataAsignacion}
      mensajeExito="Solicitud de caudal asignada correctamente"
    />
  );
};

export default CancelacionDefinitivaModal;