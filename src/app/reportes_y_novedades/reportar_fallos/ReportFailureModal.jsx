import React, { useState, useEffect } from "react";
import axios from "axios";

const ReportFailureModal = ({ showModal, onClose, onSuccess, API_URL }) => {
  const [observations, setObservations] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (showModal) {
      setObservations("");
      setError("");
      setCharCount(0);
      setIsSubmitting(false);
    }
  }, [showModal]);
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Limitar a 200 caracteres
    if (value.length <= 200) {
      setObservations(value);
      setCharCount(value.length);
      setError("");
    }
  };

  const handleSubmit = async () => {
    // Validar que el campo no esté vacío
    if (!observations.trim()) {
      setError("La descripción es obligatoria");
      return;
    }

    // Validar longitud mínima
    if (observations.trim().length < 10) {
      setError("La descripción debe tener al menos 10 caracteres");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay una sesión activa. Por favor, inicie sesión.");
        setIsSubmitting(false);
        return;
      }

      // Realizar la petición POST
      await axios.post(
        `${API_URL}/communication/application-failure-report`,
        {
          observations: observations.trim()
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );

      // Notificar éxito
      onSuccess("Reporte de fallo enviado correctamente");
      onClose();
    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      
      // Manejo de errores del backend
      if (error.response?.data) {
        const responseData = error.response.data;
        
        if (responseData.error) {
          setError(Array.isArray(responseData.error) 
            ? responseData.error[0] 
            : responseData.error);
        } else if (responseData.observations) {
          setError(Array.isArray(responseData.observations) 
            ? responseData.observations[0] 
            : responseData.observations);
        } else {
          setError("Error al procesar la solicitud. Verifique los datos e intente nuevamente.");
        }
      } else {
        setError("Fallo en la conexión, intente de nuevo más tarde o contacte con soporte técnico.");
      }
      
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[500px] z-50">
        {/* Título del modal */}
        <h2 className="text-xl font-bold mb-4">REPORTE DE FALLOS EN EL APLICATIVO</h2>

        {/* Instrucciones */}
        <p className="mb-4 text-left text-gray-600">
          Presente una breve descripción del problema o del fallo que ha presentado el aplicativo
        </p>

        {/* Textarea para las observaciones */}
        <div className="mb-4">
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 text-left mb-1">
            Observaciones:
          </label>
          <textarea
            id="observations"
            name="observations"
            value={observations}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} 
            rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486] h-32`}
            placeholder="Describa el fallo que ha experimentado..."
          />
          <div className="flex justify-between mt-1">
            <p className="text-gray-500 text-xs text-left">Mínimo 10 caracteres</p>
            <p className={`text-xs ${charCount > 190 ? 'text-red-500' : 'text-gray-500'}`}>
              {charCount}/200 caracteres
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mt-2 text-sm text-left">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
          >
            Volver
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#365486] text-white px-4 py-2 rounded-lg disabled:bg-opacity-70"
          >
            {isSubmitting ? "Enviando..." : "Enviar reporte"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportFailureModal;