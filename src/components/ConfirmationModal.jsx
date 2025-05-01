import React from 'react';

const ConfirmationModal = ({ showModal, onClose, onConfirm, message }) => {
    return (
        showModal && (
            <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[400px] z-50">
                    <h2 className="text-lg font-bold mb-4">{message}</h2>
                    <div className="mt-4 flex justify-center space-x-7">
                        <button
                            onClick={onClose}
                            className="bg-gray-300 text-black px-5 py-2 rounded-lg hover:bg-gray-400"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="bg-[#365486] text-white px-4 py-2 rounded-lg"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        )
    );
};

export default ConfirmationModal;
