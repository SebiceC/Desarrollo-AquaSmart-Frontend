import React from "react";

const Modal = ({ showModal, onClose, title, children, btnMessage }) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[400px] z-50">
        {/* Título del modal */}
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        {/* Contenido del modal */}
        <div className="mb-3">{children}</div>

        {/* Botón de cierre opcional */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={onClose}
            className="bg-[#365486] text-white px-4 py-2 rounded-lg"
          >
            {btnMessage}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;