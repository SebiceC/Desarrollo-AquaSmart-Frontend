import React, { useState } from "react";
import axios from "axios";

const DeleteSelfModal = ({ 
  user, 
  showModal, 
  setShowModal, 
  onDeleteSuccess, 
  setModalMessage, 
  setShowErrorModal 
}) => {
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const [isProcessing, setIsProcessing] = useState(false);

  // Función para cambiar el estado del propio usuario a inactivo
  const confirmSelfDelete = async () => {
    try {
      setIsProcessing(true);
      
      // Obtener el token de autenticación
      const token = localStorage.getItem("token");
      
      // Llamar a la API para cambiar el estado del usuario a inactivo
      await axios.patch(
        `${API_URL}/users/admin/inactive/${user.document}`,
        { status: "inactive" }, 
        { headers: { Authorization: `Token ${token}` }}
      );
      
      // Cerrar el modal de confirmación
      setShowModal(false);
      
      // Notificar al componente padre que el cambio fue exitoso
      onDeleteSuccess(user.document);
      
      // Mostrar mensaje de éxito
      setModalMessage("Tu usuario ha sido eliminado correctamente. Serás redirigido al login.");
      setShowErrorModal(true);
      
      // Cerrar sesión después de un breve retraso
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login"; // Redirigir al login
      }, 3000);
      
    } catch (error) {
      console.error("Error al eliminar tu propio usuario:", error);
      setShowModal(false);
      
      // Mostrar mensaje de error específico si está disponible
      const errorMessage = error.response?.data?.message || 
                          "Error al eliminar tu usuario. Inténtalo de nuevo más tarde.";
      setModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    showModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 text-center">
          {/* Icono de advertencia (en rojo para indicar mayor gravedad) */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center">
              <span className="text-red-500 text-3xl font-bold">!</span>
            </div>
          </div>
          
          {/* Título */}
          <h2 className="text-2xl font-bold mb-2">¡Atención!</h2>
          
          {/* Mensaje específico para eliminación del propio usuario */}
          <p className="mb-6">
            ¿Estás seguro que deseas eliminar tu propio usuario?
            <br />
            <span className="text-red-500 font-semibold">Esta acción cerrará tu sesión actual y serás redirigido al login.</span>
          </p>
          
          {/* Botones */}
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => !isProcessing && setShowModal(false)} 
              className="px-8 py-2 bg-[#365486] text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button 
              onClick={confirmSelfDelete} 
              className="px-8 py-2 bg-red-600 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Sí, eliminar mi usuario"}
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default DeleteSelfModal;