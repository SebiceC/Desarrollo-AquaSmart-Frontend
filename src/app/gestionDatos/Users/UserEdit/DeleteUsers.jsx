import React, { useState } from "react";
import Modal from "../../../components/Modal";
import axios from "axios";

const DeleteUser = ({ 
  user, 
  showModal, 
  setShowModal, 
  onDeleteSuccess, 
  setModalMessage, 
  setShowErrorModal 
}) => {
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const [isProcessing, setIsProcessing] = useState(false);

  // Función para confirmar la eliminación del usuario
  const confirmDelete = async () => {
    try {
      setIsProcessing(true);
      
      // Obtener el token de autenticación
      const token = localStorage.getItem("token");
      
      // Llamar a la API para eliminar el usuario
      await axios.delete(
        `${API_URL}/users/admin/inactive/${user.document}`, 
        { headers: { Authorization: `Token ${token}` }}
      );
      
      // Cerrar el modal de confirmación
      setShowModal(false);
      
      // Notificar al componente padre que la eliminación fue exitosa
      onDeleteSuccess(user.document);
      
      // Mostrar mensaje de éxito
      setModalMessage("Usuario eliminado correctamente");
      setShowErrorModal(true);
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
      setShowModal(false);
      
      // Mostrar mensaje de error específico si está disponible
      const errorMessage = error.response?.data?.message || 
                          "Error al eliminar el usuario. Inténtalo de nuevo más tarde.";
      setModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Usar un componente personalizado en lugar del Modal existente
  // para reflejar exactamente el diseño de la imagen
  return (
    showModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 text-center">
          {/* Icono de advertencia */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-orange-400 flex items-center justify-center">
              <span className="text-orange-400 text-3xl font-bold">!</span>
            </div>
          </div>
          
          {/* Título */}
          <h2 className="text-2xl font-bold mb-2">¿Estás seguro?</h2>
          
          {/* Mensaje */}
          <p className="mb-6">
            ¡Estás seguro en eliminar el dispositivo!
          </p>
          
          {/* Botones */}
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => !isProcessing && setShowModal(false)} 
              className="px-8 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button 
              onClick={confirmDelete} 
              className="px-8 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Sí, borrar ahora!"}
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default DeleteUser;