import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FileText } from "lucide-react";
import NavBar from "../../../components/NavBar";
import Modal from "../../../components/Modal";
import { ArrowLeft } from "lucide-react";

const PreRegistroDetail = () => {
  const { document } = useParams();
  const navigate = useNavigate();
  const [registro, setRegistro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectReasonVisible, setRejectReasonVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [buttonsVisible, setButtonsVisible] = useState(true);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isSubmitSelected, setIsSubmitSelected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const personTypeNames = {
    1: "Natural",
    2: "Jurídica",
  };

  useEffect(() => {
    const fetchRegistro = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_APP_API_URL;
        const response = await axios.get(
          `${API_URL}/users/admin/update/${document}`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        setRegistro(response.data);
        if (response.data.is_registered) {
          setButtonsVisible(false);
        }
      } catch (err) {
        setError("No se pudo cargar la información del registro.");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistro();
  }, [document]);

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="max-w-3xl mx-auto p-6 mt-30 bg-white rounded-lg shadow animate-pulse">
          <h1 className="text-xl font-medium text-center mb-2 bg-gray-300 h-6 w-1/3 mx-auto rounded"></h1>
          <p className="text-sm text-gray-400 text-center mb-6 bg-gray-200 h-4 w-1/2 mx-auto rounded"></p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
                <div className="bg-gray-200 h-6 w-full rounded"></div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-6 w-24 rounded"></div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <div className="bg-gray-400 h-10 w-24 rounded"></div>
            <div className="bg-gray-400 h-10 w-24 rounded"></div>
          </div>

          <div className="flex justify-start gap-2 mt-6">
            <div className="bg-gray-400 h-10 w-32 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <p>{error}</p>;

  const handleReject = () => {
    setRejectReasonVisible(true);
    setButtonsVisible(false);
  };

  const handleRejectReasonChange = (event) => {
    const value = event.target.value;
    setRejectReason(value);
    setIsSubmitEnabled(value.trim() !== "");
    if (value.length > 200) {
      setModalMessage("La justificación no puede exceder los 200 caracteres.");
      setShowModal(true);
    }
  };

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
      setModalMessage(
        "Hubo un error al enviar la justificación. Intenta nuevamente."
      );
      setShowModal(true);
    }
  };

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = import.meta.env.VITE_APP_API_URL;

      let response;

      try {
        response = await axios.patch(
          `${API_URL}/users/admin/register/${document}`,
          { is_active: true, is_registered: true },
          { headers: { Authorization: `Token ${token}` } }
        );
        console.log("Usuario aprobado:", response.data);

        if (response.status === 200) {
          setRegistro((prev) => ({
            ...prev,
            is_registered: true,
          }));
          setModalMessage("El pre-registro ha sido aprobado exitosamente.");
        } else {
          setModalMessage("Hubo un problema al aprobar el pre-registro.");
        }
      } catch (error) {
        console.error("Error al aprobar usuario:", error.response);
        setModalMessage("Ocurrió un error al aprobar el pre-registro.");
      }
    } catch (error) {
      setModalMessage("Ocurrió un error al aprobar el pre-registro.");
    } finally {
      setShowModal(true);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="max-w-3xl mx-auto p-6 mt-30 bg-white rounded-lg shadow">
        <h1 className="text-xl font-medium text-center mb-2">
          Aprobación de Pre Registro
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Información enviada por el usuario
        </p>

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
              {registro.date_joined
                ? new Date(registro.date_joined).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : "Fecha no disponible"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Documentos actuales:</p>
          {registro.drive_folder_id ? (
            <a
              href={`https://drive.google.com/drive/u/1/folders/${registro.drive_folder_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Ver documentos en Google Drive
            </a>
          ) : (
            <p className="text-sm text-gray-500">No hay documentos disponibles.</p>
          )}
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
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                isSubmitEnabled
                  ? "bg-[#365486] hover:bg-[#2f4275]"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Enviar
            </button>
          </div>
        )}
        <div className="flex justify-center gap-4 mb-6">
          {!registro?.is_registered && (
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

        <div className="flex justify-start gap-2 mt-6">
          <button
            onClick={() => navigate("/gestionDatos/pre-registros")}
            className="flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} /> Regresar
          </button>
        </div>
      </div>

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
