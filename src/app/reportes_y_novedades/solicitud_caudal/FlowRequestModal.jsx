import React, { useState } from "react";
import axios from "axios";

const FlowRequestModal = ({ showModal, onClose, lote, onSuccess, API_URL }) => {
  const [requestedFlow, setRequestedFlow] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showModal) return null;

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Solo permitir números y punto decimal
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setRequestedFlow(value);
      setError("");
    }
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

      // Realizar la petición POST
      await axios.post(
        `${API_URL}/communication/flow-change-request`,
        {
          requested_flow: flow,
          lot: loteId
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
      
      // Manejo específico de errores que vienen del backend
      if (error.response?.data) {
        const responseData = error.response.data;
        console.log("Datos de respuesta de error:", JSON.stringify(responseData)); // Agregado para depuración
        
        // Verificar si hay errores en el campo error general
        if (responseData.error && Array.isArray(responseData.error) && responseData.error.length > 0) {
          const errorMessage = responseData.error[0];
          console.log("Mensaje de error encontrado:", errorMessage); // Agregado para depuración
          
          if (errorMessage.includes("solicitud de cambio de caudal en curso")) {
            setError("El lote elegido ya cuenta con una solicitud de cambio de caudal en curso.");
          } else {
            setError(errorMessage);
          }
        }
        // Puede que el error venga como un objeto directo, no como array
        else if (responseData.error && typeof responseData.error === 'string') {
          const errorMessage = responseData.error;
          
          if (errorMessage.includes("solicitud de cambio de caudal en curso")) {
            setError("El lote elegido ya cuenta con una solicitud de cambio de caudal en curso.");
          } else {
            setError(errorMessage);
          }
        }
        // Verificar si hay errores específicos para el caudal solicitado
        else if (responseData.requested_flow && responseData.requested_flow.length > 0) {
          setError(responseData.requested_flow[0]);
        }
        // Verificar si hay errores específicos para el lote
        else if (responseData.lot && responseData.lot.length > 0) {
          // Manejar específicamente el error de válvula
          const errorMessage = responseData.lot[0];
          
          // Aplicar validaciones específicas con mensajes personalizados
          if (errorMessage.includes("válvula 4")) {
            setError("El lote no tiene una válvula asociada.");
          } else if (errorMessage.includes("solicitud de cambio de caudal en curso")) {
            setError("El lote elegido ya cuenta con una solicitud de cambio de caudal en curso.");
          } else {
            // Para cualquier otro mensaje de error no reconocido
            setError(errorMessage);
          }
        }
        // Si la respuesta es un string con error (a veces ocurre en APIs)
        else if (typeof responseData === 'string') {
          if (responseData.includes("solicitud de cambio de caudal en curso")) {
            setError("El lote elegido ya cuenta con una solicitud de cambio de caudal en curso.");
          } else {
            setError(responseData);
          }
        }
        // Verificar si responseData es ya un string en formato JSON
        else if (typeof responseData === 'string' && responseData.includes('"error"')) {
          try {
            const parsedError = JSON.parse(responseData);
            if (parsedError.error && Array.isArray(parsedError.error) && parsedError.error.length > 0) {
              const errorMessage = parsedError.error[0];
              if (errorMessage.includes("solicitud de cambio de caudal en curso")) {
                setError("El lote elegido ya cuenta con una solicitud de cambio de caudal en curso.");
              } else {
                setError(errorMessage);
              }
            }
          } catch (e) {
            setError(responseData);
          }
        }
        // Si hay errores pero no se pueden categorizar
        else {
          setError("Error al procesar la solicitud. Verifique los datos e intente nuevamente.");
        }
      } else {
        // Error genérico si no hay respuesta específica del servidor
        setError("Error al enviar la solicitud. Por favor, intente más tarde.");
      }
      
      setIsSubmitting(false);
    }
  };

  return (
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
  );
};

export default FlowRequestModal;