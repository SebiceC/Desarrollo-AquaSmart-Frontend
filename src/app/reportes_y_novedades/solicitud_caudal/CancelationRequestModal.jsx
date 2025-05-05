import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../../../components/Modal"; // Ajusta la ruta si es necesario
import ConfirmationModal from "../../../components/ConfirmationModal"; // Ajusta la ruta si es necesario

const CancelationRequestModal = ({ showModal, onClose, lote, onSuccess, API_URL }) => {
    const [cancelType, setCancelType] = useState("");
    const [observations, setObservations] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [flowIsZero, setFlowIsZero] = useState(false);
    const [loadingIot, setLoadingIot] = useState(true);

    // Estados para los modales adicionales
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConnectionErrorModal, setShowConnectionErrorModal] = useState(false); // Modal de conexión
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        const fetchIotDeviceAndFlow = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("No hay una sesión activa. Por favor, inicie sesión.");
                    setLoadingIot(false);
                    return;
                }

                const loteId = lote.id_lot || lote.id;

                const devicesResponse = await axios.get(
                    `${API_URL}/iot/iot-devices`,
                    { headers: { Authorization: `Token ${token}` } }
                );

                const devices = devicesResponse.data;
                const device = devices.find(dev => dev.id_lot === loteId);

                if (!device) {
                    setError("No se encontró un dispositivo IoT asociado al lote seleccionado.");
                    setLoadingIot(false);
                    return;
                }

                const iotId = device.iot_id;

                const flowResponse = await axios.get(
                    `${API_URL}/iot/iot-devices/${iotId}`,
                    { headers: { Authorization: `Token ${token}` } }
                );

                const actualFlow = flowResponse.data.actual_flow;
                setFlowIsZero(actualFlow === 0);
                setLoadingIot(false);

            } catch (error) {
                console.error("Error al obtener datos de IoT:", error);
                setShowConnectionErrorModal(true); // Mostrar el modal de error de conexión
                setLoadingIot(false);
            }
        };

        if (showModal) {
            fetchIotDeviceAndFlow();
        }
    }, [showModal, lote, API_URL]);

    const validateAndProceed = () => {
        if (!cancelType) {
            setError("Debe seleccionar un tipo de cancelación.");
            return;
        }

        // Validación de las observaciones: debe tener mínimo 5 caracteres
        if (observations.trim().length < 5) {
            setError("Las observaciones deben tener al menos 5 caracteres.");
            return;
        }

        if (flowIsZero && cancelType === "Temporal") {
            // Mostrar modal de información (no permitido)
            setShowInfoModal(true);
            return;
        }

        if (cancelType === "Definitiva") {
            // Mostrar modal de confirmación
            setShowConfirmModal(true);
        } else {
            // Si es temporal y flow no es cero, enviar directamente
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No hay una sesión activa. Por favor, inicie sesión.");
                setIsSubmitting(false);
                return;
            }

            const loteId = lote.id_lot || lote.id;

            await axios.post(
                `${API_URL}/communication/flow-cancel-request`,
                {
                    cancel_type: cancelType.toLowerCase(),
                    observations: observations.trim(),
                    lot: loteId,
                },
                { headers: { Authorization: `Token ${token}` } }
            );

            onSuccess("Solicitud de cancelación enviada correctamente.");
            onClose();
        } catch (error) {
            console.error("Error al enviar la solicitud de cancelación:", error);
            setIsSubmitting(false);

            const resp = error.response?.data;
            let userMsg = "";

            if (resp?.error) {
                const err = resp.error;

                if (typeof err === "string") {
                    userMsg = err;

                } else if (err.message) {
                    const regex = /ErrorDetail\(string='(.+?)'/;
                    const match = err.message.match(regex);
                    userMsg = match ? match[1] : err.message;

                } else if (Array.isArray(err)) {
                    userMsg = err.join(", ");
                }

            } else {
                userMsg = "Fallo en la conexión, inténtalo de nuevo más tarde o contacta a soporte técnico.";
            }

            setError(userMsg);
            setShowErrorModal(true);
        }
    };

    if (!showModal) return null;

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[400px] z-50">
                    {/* Título */}
                    <h2 className="text-xl font-bold mb-4">FORMULARIO DE CANCELACIÓN TEMPORAL/DEFINITIVA</h2>

                    {/* Información del lote */}
                    <div className="mb-4 text-left">
                        <p><span className="font-semibold">ID Lote:</span> {lote.id_lot}</p>
                        <p><span className="font-semibold">ID Predio:</span> {lote.plot}</p>
                    </div>

                    {/* Cargando información */}
                    {loadingIot ? (
                        <div className="text-gray-500 text-sm mb-4">Cargando información del dispositivo...</div>
                    ) : (
                        <>
                            {/* Select de tipo de cancelación */}
                            <div className="mb-4 text-left">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Cancelación:
                                </label>
                                <select
                                    value={cancelType}
                                    onChange={(e) => setCancelType(e.target.value)}
                                    className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]`}
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="Temporal">Temporal</option>
                                    <option value="Definitiva">Definitiva</option>
                                </select>
                            </div>

                            {/* Campo de observaciones */}
                            <div className="mb-4 text-left">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observaciones:
                                </label>
                                <textarea
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]`}
                                    rows={4}
                                    placeholder="Ingrese los detalles de la solicitud"
                                    maxLength={200}
                                ></textarea>
                            </div>
                        </>
                    )}

                    {/* Mostrar errores */}
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

                    {/* Botones */}
                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={onClose}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                        >
                            Volver
                        </button>
                        <button
                            onClick={validateAndProceed}
                            disabled={isSubmitting || loadingIot}
                            className="bg-[#365486] text-white px-4 py-2 rounded-lg disabled:bg-opacity-70"
                        >
                            {isSubmitting ? "Enviando..." : "Enviar solicitud"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Información */}
            <Modal
                showModal={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                title="Solicitud no permitida"
                btnMessage="Entendido"
            >
                <p>No puedes cancelar temporalmente el caudal porque no tienes un flujo de agua activo.</p>
            </Modal>

            {/* Modal de Confirmación */}
            <ConfirmationModal
                showModal={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={() => {
                    setShowConfirmModal(false);
                    handleSubmit();
                }}
                message="¿Estás seguro que deseas cancelar definitivamente el caudal de tu lote?"
            />

            {/* Modal de error de conexión */}
            <Modal
                showModal={showConnectionErrorModal}
                onClose={() => setShowConnectionErrorModal(false)}
                title="ERROR"
                btnMessage="Entendido"
            >
                <p>Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.</p>
            </Modal>

            {/* Modal de error genérico */}
            <Modal
                showModal={showErrorModal}
                onClose={() => {
                    setShowErrorModal(false);
                    setError("");
                }}
                title="ERROR"
                btnMessage="ACEPTAR"
            >
                <p>{error}</p>
            </Modal>

        </>
    );
};

export default CancelationRequestModal;
