import React, { useState } from "react";
import axios from "axios";
import Modal from "../../../components/Modal";

const FlowRequestModal = ({ showModal, onClose, lote, onSuccess, API_URL }) => {
  const [requestedFlow, setRequestedFlow] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConnectionErrorModal, setShowConnectionErrorModal] = useState(false);

  if (!showModal) return null;

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Solo permitir números y punto decimal
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setRequestedFlow(value);
      setError("");
    }
  };

  // Función para extraer el mensaje de error del formato anidado
  const extractErrorMessage = (errorObj) => {
    try {
      // Si es un string, intentar parsearlo
      if (typeof errorObj === 'string') {
        // Intentar extraer el mensaje usando regex
        const match = errorObj.match(/ErrorDetail\(string='([^']+)'/);
        if (match && match[1]) {
          return match[1];
        }
        return errorObj;
      }

      // Si es un objeto con estructura anidada
      if (errorObj.error && errorObj.error.message) {
        // Extraer el mensaje del string anidado
        const match = errorObj.error.message.match(/ErrorDetail\(string='([^']+)'/);
        if (match && match[1]) {
          return match[1];
        }
      }

      // Si tiene la estructura error.error
      if (errorObj.error && Array.isArray(errorObj.error) && errorObj.error.length > 0) {
        return errorObj.error[0];
      }

      // Si es un objeto con mensaje directo
      if (errorObj.message) {
        return errorObj.message;
      }

      return "Error desconocido. Por favor, intente más tarde.";
    } catch (e) {
      console.error("Error al parsear mensaje de error:", e);
      return "Error al procesar la solicitud.";
    }
  };

  // Función para categorizar y personalizar mensajes de error
  const categorizeErrorMessage = (message) => {
    // Mapa de mensajes personalizados según el tipo de error
    const errorMap = {
      "solicitud de cambio de caudal en curso": "El lote elegido ya cuenta con una solicitud de cambio de caudal en curso.",
      "El caudal solicitado es el mismo": "El caudal solicitado es el mismo que se encuentra disponible. Intente con un valor diferente.",
      "no tiene una válvula": "El lote no tiene una válvula asociada.",
      "fuera del rango": "El caudal solicitado debe estar dentro del rango de 1 L/seg a 11.7 L/seg.",
      // Agrega más mapeos según necesites
    };

    // Buscar coincidencias en el mensaje
    for (const [key, customMessage] of Object.entries(errorMap)) {
      if (message.includes(key)) {
        return customMessage;
      }
    }

    // Si no se encuentra una coincidencia, devolver el mensaje original
    return message;
  };

  const handleSubmit = async () => {
    // Validar que el campo no esté vacío
    if (!requestedFlow) {
      setError("El caudal es obligatorio");
      return;
    }

    // Validar que sea un número válido
    const flow = parseFloat(requestedFlow);
    if (isNaN(flow)) {
      setError("Ingrese un valor numérico válido");
      return;
    }

    // Validar que tenga máximo 4 caracteres
    if (requestedFlow.replace(".", "").length > 4) {
      setError("El caudal debe tener máximo 4 caracteres");
      return;
    }
    
    // Validar el rango permitido (1-11.7 L/seg)
    if (flow < 1 || flow > 11.7) {
      setError("El caudal solicitado debe estar dentro del rango de 1 L/seg a 11.7 L/seg.");
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

      // Obtener el ID correcto del lote
      const loteId = lote.id_lot || lote.id;

      // Realizar la petición POST incluyendo los campos requeridos
      await axios.post(
        `${API_URL}/communication/flow-requests/create`,
        {
          requested_flow: flow,
          lot: loteId,
          type: "Solicitud", // Valor fijo para type según el modelo
          flow_request_type: "Cambio de Caudal" // Valor fijo para flow_request_type según FlowRequestType
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );

      // Notificar éxito
      onSuccess("Solicitud de cambio de caudal enviada correctamente");
      onClose();
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      
      if (!error.response) {
        // Error de conexión - mostrar modal en lugar de alerta
        setShowConnectionErrorModal(true);
      } else {
        // Inicializar la variable errorMessage
        let errorMessage = "Error al procesar la solicitud. Por favor, intente más tarde.";

        if (error.response?.data) {
          // Extraer mensaje de error de la estructura compleja
          errorMessage = extractErrorMessage(error.response.data);
          
          // Categorizar y personalizar el mensaje
          errorMessage = categorizeErrorMessage(errorMessage);
        }

        // Establecer el error para mostrarlo bajo el input
        setError(errorMessage);
      }
      
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[400px] z-50">
          {/* Título del modal */}
          <h2 className="text-xl font-bold mb-4">Solicitar cambio de caudal</h2>

          {/* Información del lote */}
          <div className="mb-4 text-left">
            <p><span className="font-semibold">ID Lote:</span> {lote.id_lot}</p>
            <p><span className="font-semibold">ID Predio:</span> {lote.plot}</p>
          </div>

          {/* Input para el caudal */}
          <div className="mb-4">
            <label htmlFor="caudal" className="block text-sm font-medium text-gray-700 text-left mb-1">
              Caudal (L/seg):
            </label>
            <input
              type="text"
              id="caudal"
              value={requestedFlow}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]`}
              placeholder="Ej: 5.5"
              maxLength={5} // Permitir punto decimal y 4 caracteres
            />
            <p className="text-gray-500 text-xs mt-1 text-left">Permitido: 1.0 - 11.7 L/seg</p>
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
              {isSubmitting ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de error de conexión */}
      <Modal
        showModal={showConnectionErrorModal}
        onClose={() => setShowConnectionErrorModal(false)}
        title="ERROR"
        btnMessage="Entendido"
      >
        <p>Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.</p>
      </Modal>
    </>
  );
};

export default FlowRequestModal;