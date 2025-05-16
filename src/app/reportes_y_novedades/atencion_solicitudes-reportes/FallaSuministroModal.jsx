import React from "react";
import BaseAsignacionModal from "../../../components/BaseAsignacionModal";
/**
 * Modal para la asignación de reportes de Falla en el Suministro
 */
const FallaSuministroModal = ({ showModal, onClose, solicitudBasica, onSuccess, onError }) => {
  // Función para renderizar los detalles específicos del reporte
  const renderDetallesFallaSuministro = (solicitudBasica, detalleSolicitud) => (
    <>
      <h3 className="text-lg font-semibold mb-3 text-blue-800 border-b border-gray-200 pb-2">
        Información del Reporte
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
            <span className="font-medium text-gray-600 w-30">Tipo de reporte:</span>
            <span className="text-gray-800">{solicitudBasica.failure_type || "No especificado"}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-14">Estado:</span>
            <span className="text-gray-800">{solicitudBasica.status || "No especificado"}</span>
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-30">Fecha de envío:</span>
            <span className="text-gray-800">{solicitudBasica.created_at || "No especificada"}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-600 w-26">ID del predio:</span>
            <span className="text-gray-800">{detalleSolicitud?.plot || "No especificado"}</span>
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
    return solicitudBasica.type === "flow_request" 
      ? `${API_URL}/communication/assignments/flow-request/${solicitudBasica.id}`
      : `${API_URL}/communication/assignments/failure-report/${solicitudBasica.id}`;
  };

  // Función para crear los datos de asignación
  const crearDataAsignacion = (solicitudId, tecnicoId) => {
    return {
      failure_report: solicitudId,
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
      titulo="Asignación de Reporte de falla en el suministro"
      tipoAsignacion="failure_report"
      renderDetallesSolicitud={renderDetallesFallaSuministro}
      getEndpointDetalle={getEndpointDetalle}
      dataAsignacion={crearDataAsignacion}
      mensajeExito="Solicitud asignada correctamente"
    />
  );
};

export default FallaSuministroModal;