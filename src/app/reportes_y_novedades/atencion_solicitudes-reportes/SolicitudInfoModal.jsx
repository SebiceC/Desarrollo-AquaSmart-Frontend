// SolicitudInfoModal.jsx
import React from "react";
import BaseSolicitudModal from "../../../components/BaseSolicitudModal";

const SolicitudInfoModal = ({ 
  showModal, 
  onClose, 
  solicitudBasica,
  onSuccess,
  onError 
}) => {
  // Este componente es de solo lectura, por lo que pasamos readOnly=true
  return (
    <BaseSolicitudModal
      showModal={showModal}
      onClose={onClose}
      solicitudBasica={solicitudBasica}
      onSuccess={onSuccess}
      onError={onError}
      readOnly={true} // Modo solo lectura
      // No necesitamos renderExtraButtons ya que es solo lectura
    />
  );
};

export default SolicitudInfoModal;