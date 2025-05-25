import React from "react";
import BaseInfoFinalModalR from "../../../../components/BaseInfoFinalModalR";

/**
 * Modal para la asignación de solicitudes de Cancelación Definitiva de Caudal
 */
const FallaAplicativoF = ({ showModal, onClose, solicitudBasica, onSuccess, onError }) => {
  // Función para renderizar los detalles específicos de la solicitud
  const renderDetallesCancelacion = (solicitudBasica, detalleSolicitud) => (
    <>
      <h3 className="text-lg font-semibold mb-3 text-blue-800 border-b border-gray-200 pb-2">
        Información del reporte {solicitudBasica.failure_type}
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
            <span className="font-medium text-gray-600 w-27">Tipo reporte:</span>
            <span className="text-gray-800">{solicitudBasica.failure_type || "No especificado"}</span>
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


  const formatearTitulo = (texto) => {
    if (!texto) return "Falla Aplicativo";
    return texto
      .replace(/_/g, ' ')  // Reemplazar guiones bajos con espacios
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <BaseInfoFinalModalR
      showModal={showModal}
      onClose={onClose}
      solicitudBasica={solicitudBasica}
      onSuccess={onSuccess}
      onError={onError}
      titulo={formatearTitulo(solicitudBasica?.failure_type) || "Asignación de Reporte de Falla"}
      tipoAsignacion="failure_report"
      renderDetallesSolicitud={renderDetallesCancelacion}
      getEndpointDetalle={getEndpointDetalle}
      mensajeExito="Reporte de falla en el aplicativo asignado correctamente"
    />
  );
};

export default  FallaAplicativoF;