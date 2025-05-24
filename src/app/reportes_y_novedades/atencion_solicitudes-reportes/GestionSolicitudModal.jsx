// GestionSolicitudModal.jsx
import React from "react";
import BaseSolicitudModal from "../../../components/BaseSolicitudModal";


const GestionSolicitudModal = ({ 
  showModal, 
  onClose, 
  solicitudBasica,
  onSuccess,
  onError 
}) => {
  // Este componente permite gestionar la solicitud, por lo que pasamos readOnly=false
  // y renderizamos los botones adicionales
  
  // Función que renderiza los botones de acción específicos
  const renderActionButtons = ({ handleRejectClick, handleAccept, isSubmitting, successMessage }) => {
    return (
      <>
        <button
          onClick={handleRejectClick}
          className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-opacity-70 text-sm sm:text-base flex-1 sm:flex-none"
          disabled={isSubmitting || successMessage}
        >
          {isSubmitting ? "Procesando..." : "Rechazar"}
        </button>
        
        <button
          onClick={handleAccept}
          className="bg-[#365486] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-opacity-70 text-sm sm:text-base flex-1 sm:flex-none"
          disabled={isSubmitting || successMessage}
        >
          {isSubmitting ? "Procesando..." : "Aceptar"}
        </button>
      </>
    );
  };

  return (
    <BaseSolicitudModal
      showModal={showModal}
      onClose={onClose}
      solicitudBasica={solicitudBasica}
      onSuccess={onSuccess}
      onError={onError}
      readOnly={false} // Modo de gestión
      renderExtraButtons={renderActionButtons} // Pasamos la función para renderizar los botones
    />
  );
};

export default GestionSolicitudModal;