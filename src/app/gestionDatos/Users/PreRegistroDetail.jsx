import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FileText } from "lucide-react";
import NavBar from "../../../components/NavBar";
import Modal from "../../../components/Modal";

const PreRegistroDetail = () => {
  const { document } = useParams();
  const navigate = useNavigate();
  const [registro, setRegistro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectReasonVisible, setRejectReasonVisible] = useState(false); // Estado para mostrar el campo de justificación
  const [rejectReason, setRejectReason] = useState(""); // Estado para la justificación
  const [buttonsVisible, setButtonsVisible] = useState(true); // Estado para los botones de rechazar y aprobar
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false); // Estado para habilitar el botón de "Enviar"
  const [isSubmitSelected, setIsSubmitSelected] = useState(false); // Estado para cambiar el color del botón al seleccionarlo
  const [showModal, setShowModal] = useState(false); // Para mostrar los modales
  const [modalMessage, setModalMessage] = useState(""); // Para el mensaje del modal

  // Mapeo de tipos de persona
  const personTypeNames = {
    1: "Natural",
    2: "Jurídica",
  };

  useEffect(() => {
    const fetchRegistro = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_APP_API_URL;
        const response = await axios.get(`${API_URL}/users/admin/update/${document}`, {
          headers: { Authorization: `Token ${token}` },
        });
        setRegistro(response.data);
      } catch (err) {
        setError("No se pudo cargar la información del registro.");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistro();
  }, [document]);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;

  // Función para manejar el clic en el botón Rechazar
  const handleReject = () => {
    setRejectReasonVisible(true); // Mostrar campo de justificación
    setButtonsVisible(false); // Ocultar los botones de Aceptar y Rechazar
  };

  // Función para manejar el cambio en el campo de justificación
  const handleRejectReasonChange = (event) => {
    const value = event.target.value;
    setRejectReason(value);
    setIsSubmitEnabled(value.trim() !== ""); // Habilitar el botón de enviar si hay texto
    if (value.length > 200) {
      setModalMessage("La justificación no puede exceder los 200 caracteres.");
      setShowModal(true);
    }
  };

  // Función para manejar el clic en Enviar
  const handleSubmit = async () => {
    if (rejectReason.length > 200) {
      setModalMessage("La justificación no puede exceder los 200 caracteres.");
      setShowModal(true);
      return;
    }

    try {
      // Aquí puedes hacer la lógica para enviar la justificación
      // Por ejemplo, hacer un POST request a la API para registrar la justificación.
      await axios.post(`/your-api-url-to-submit-rejection`, { rejectReason });
      setModalMessage("La justificación fue enviada con éxito.");
      setShowModal(true);
    } catch (error) {
      setModalMessage("Hubo un error al enviar la justificación. Intenta nuevamente.");
      setShowModal(true);
    }
  };

  // Función para manejar el clic en Aceptar
  const handleAccept = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = import.meta.env.VITE_APP_API_URL;
  
      // Actualizamos el estado del usuario a 'activo' y 'registrado' al aceptar
      const response = await axios.patch(
        `${API_URL}/users/admin/approve/${document}`,
        { is_active: true, is_registered: true },
        { headers: { Authorization: `Token ${token}` } }
      );
  
      // Verificamos la respuesta de la API y mostramos el modal correspondiente
      if (response.status === 200) {
        setModalMessage("El pre-registro ha sido aprobado exitosamente.");
        setShowModal(true);
      }
    } catch (error) {
      setModalMessage("Ocurrió un error al aprobar el pre-registro.");
      setShowModal(true);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="max-w-3xl mx-auto p-6 mt-30 bg-white rounded-lg shadow">
        <h1 className="text-xl font-medium text-center mb-2">Aprobación de Pre Registro</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Información enviada por el usuario</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Nombre: </span>
              {registro.first_name}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Apellido: </span>
              {registro.last_name}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Tipo de persona: </span>
              {personTypeNames[registro.person_type] || "No disponible"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Teléfono: </span>
              {registro.phone}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Correo: </span>
              {registro.email}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">ID: </span>
              {registro.document}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Contraseña: </span>
              {registro.password || "No disponible"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Confirmación de contraseña: </span>
              {registro.password || "No disponible"}
            </p>
          </div>
          <div className="space-y-1 col-span-1 md:col-span-2">
            <p className="text-sm">
              <span className="font-medium">Fecha: </span>
              {new Date(registro.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <FileText size={16} />
            Cedula.pdf
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <FileText size={16} />
            escritura.pdf
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <FileText size={16} />
            libertad.pdf
          </button>
        </div>

        {rejectReasonVisible && (
          <div className="mb-6 flex items-center gap-3">
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={handleRejectReasonChange}
              className="w-full p-2 border border-gray-300 rounded-md resize-none h-16"
              placeholder="Escribe aquí el motivo del rechazo..."
            />
            <button
              onClick={handleSubmit}
              disabled={!isSubmitEnabled}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${isSubmitEnabled ? "bg-[#365486] hover:bg-[#2f4275]" : "bg-gray-400 cursor-not-allowed"}`}
            >
              Enviar
            </button>
          </div>
        )}

        <div className="flex justify-center gap-4">
          {buttonsVisible && (
            <>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-[#365486] hover:bg-[#2f4275] text-white transition-colors"
              >
                Aceptar
              </button>
            </>
            
          )}
        </div>
      </div>

      {/* Modal de confirmación o error */}
      {showModal && (
        <Modal
          showModal={showModal}
          onClose={() => setShowModal(false)}
          title="Alerta"
          btnMessage="Cerrar"
        >
          <p>{modalMessage}</p>
        </Modal>
      )}
    </div>
  );
};

export default PreRegistroDetail;
