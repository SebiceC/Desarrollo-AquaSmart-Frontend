import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../../../components/Modal"

const ReportSupplyModal = ({ showModal, onClose, onSuccess, API_URL }) => {
    const [document, setDocument] = useState("");
    const [observations, setObservations] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [plots, setPlots] = useState([]);
    const [lots, setLots] = useState([]);
    const [selectedPlot, setSelectedPlot] = useState("");
    const [selectedLot, setSelectedLot] = useState("");
    const [loadingLots, setLoadingLots] = useState(false);
    
    // Estados para modales de error y éxito
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("No tienes token de autenticación");
                return;
            }

            const response = await axios.get(`${API_URL}/users/profile`, {
                headers: { Authorization: `Token ${token}` },
            });

            const document = response.data.document;
            setDocument(document);
            return document;

        } catch (error) {
            console.error("Error al obtener el perfil:", error);
        }
    };

    const fetchPlots = async (userDocument) => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("No tienes token de autenticación");
                return;
            }

            // Obtener todos los predios y filtrar por el owner en el frontend
            const response = await axios.get(
                `${API_URL}/plot-lot/plots/list`,
                {
                    headers: { Authorization: `Token ${token}` }
                }
            );

            // Filtrar los predios cuyo owner coincida con el documento del usuario
            const userPlots = Array.isArray(response.data)
                ? response.data.filter(plot => plot.owner === userDocument)
                : [];

            setPlots(userPlots);
        } catch (error) {
            console.error("Error al obtener los predios:", error.response || error);
        }
    };

    // Nueva función para obtener los lotes asociados a un predio
    const fetchLots = async (plotId) => {
        if (!plotId) return;

        try {
            setLoadingLots(true);
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("No tienes token de autenticación");
                setLoadingLots(false);
                return;
            }

            // Obtener todos los lotes
            const response = await axios.get(
                `${API_URL}/plot-lot/lots/list`,
                {
                    headers: { Authorization: `Token ${token}` }
                }
            );

            const plotLots = Array.isArray(response.data)
                ? response.data.filter(lot => lot.plot === plotId)
                : [];

            setLots(plotLots);
        } catch (error) {
            console.error("Error al obtener los lotes:", error.response || error);
        } finally {
            setLoadingLots(false);
        }
    };

    // Obtener perfil y predios cuando el modal se abre
    useEffect(() => {
        if (showModal) {
            setObservations("");
            setError("");
            setCharCount(0);
            setIsSubmitting(false);
            setSelectedPlot("");
            setSelectedLot("");
            setLots([]);
            setShowErrorModal(false);
            setShowSuccessModal(false);

            const loadUserData = async () => {
                const userDocument = await fetchUserProfile();
                if (userDocument) {
                    fetchPlots(userDocument);
                }
            };

            loadUserData();
        }
    }, [showModal]);

    // Efecto para cargar lotes cuando se selecciona un predio
    useEffect(() => {
        if (selectedPlot) {
            fetchLots(selectedPlot);
            setSelectedLot(""); // Resetear el lote seleccionado al cambiar de predio
        } else {
            setLots([]);
            setSelectedLot("");
        }
    }, [selectedPlot]);

    const handleInputChange = (e) => {
        const value = e.target.value;

        // Limitar a 200 caracteres
        if (value.length <= 200) {
            setObservations(value);
            setCharCount(value.length);
            setError("");
        }
    };

    // Manejador para cambio de predio seleccionado
    const handlePlotChange = (e) => {
        const plotId = e.target.value;
        setSelectedPlot(plotId);
    };

    // Manejador para cambio de lote seleccionado
    const handleLotChange = (e) => {
        setSelectedLot(e.target.value);
    };

    const handleSubmit = async () => {
        // Validación del formulario
        if (!observations.trim()) {
            setError("La descripción es obligatoria");
            return;
        }

        if (observations.trim().length < 10) {
            setError("La descripción debe tener al menos 10 caracteres");
            return;
        }

        if (!selectedPlot) {
            setError("Debe seleccionar un predio");
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
                `${API_URL}/communication/reports/water-supply/create`,
                {
                    observations: observations.trim(),
                    plot: selectedPlot,
                    ...(selectedLot && { lot: selectedLot }),
                    type: "Reporte",
                    failure_type: "Fallo en el Suministro del Agua"
                },
                {
                    headers: { Authorization: `Token ${token}` },
                }
            );

            // Mostrar modal de éxito
            setModalMessage("Reporte de fallo enviado correctamente");
            setShowSuccessModal(true);
            
        } catch (error) {
            console.error("Error al enviar el reporte:", error);

            // Extraer mensaje de error del backend
            let errorMessage = "Fallo en la conexión, intente de nuevo más tarde o contacte con soporte técnico";
            
            if (error.response?.data) {
                const responseData = error.response.data;
                
                // Verificar si hay un error en el formato específico mencionado
                if (responseData.error && typeof responseData.error === 'object') {
                    // Manejar el formato de error específico del ejemplo
                    if (responseData.error.message) {
                        try {
                            // Intentar extraer el mensaje del formato específico
                            const errorStr = responseData.error.message;
                            // Buscar patrón como 'string='No se puede...'
                            const match = errorStr.match(/string='([^']+)'/);
                            if (match && match[1]) {
                                errorMessage = match[1];
                            } else {
                                // Si no se encuentra el patrón específico
                                errorMessage = "Error en la validación. Verifique los datos.";
                            }
                        } catch (e) {
                            errorMessage = "Error al procesar la solicitud. Verifique los datos.";
                        }
                    } else if (Array.isArray(responseData.error)) {
                        errorMessage = responseData.error[0];
                    } else {
                        errorMessage = "Error en la solicitud. Verifique los datos.";
                    }
                } else if (responseData.observations) {
                    errorMessage = Array.isArray(responseData.observations)
                        ? responseData.observations[0]
                        : responseData.observations;
                } else if (typeof responseData.error === 'string') {
                    errorMessage = responseData.error;
                }
            }
            
            // Mostrar modal de error
            setModalMessage(errorMessage);
            setShowErrorModal(true);
        }
        
        setIsSubmitting(false);
    };

    // Cerrar el formulario después del éxito
    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        onSuccess("Reporte de fallo enviado correctamente");
        onClose();
    };

    if (!showModal) return null;

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[500px] z-50">
                    <h2 className="text-xl font-bold mb-4">REPORTE DE FALLOS EN EL SUMINISTRO DE AGUA</h2>

                    <p className="mb-4 text-left text-gray-600">
                        Presente una breve descripción del problema o del fallo que ha presentado en el suministro de agua.
                    </p>

                    {/* Select para los predios */}
                    <div className="mb-4">
                        <label htmlFor="plot" className="block text-sm font-medium text-gray-700 text-left mb-1">
                            Seleccione el predio:
                        </label>
                        <select
                            id="plot"
                            name="plot"
                            value={selectedPlot}
                            onChange={handlePlotChange}
                            className={`w-full px-3 py-2 border ${!selectedPlot && error ? 'border-red-500' : 'border-gray-300'} 
                                rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]`}
                            required
                        >
                            <option value="">Seleccione un predio</option>
                            {plots.length > 0 ? (
                                plots.map((plot) => (
                                    <option key={plot.id_plot} value={plot.id_plot}>
                                        {plot.plot_name} ({plot.id_plot})
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>No tiene predios registrados</option>
                            )}
                        </select>
                        {plots.length === 0 && (
                            <p className="text-sm text-amber-600 mt-1 text-left">
                                No se encontraron predios asociados a su documento.
                            </p>
                        )}
                    </div>

                    {/* Select para los lotes */}
                    <div className="mb-4">
                        <label htmlFor="lot" className="block text-sm font-medium text-gray-700 text-left mb-1">
                            Seleccione el lote (opcional)
                        </label>
                        <select
                            id="lot"
                            name="lot"
                            value={selectedLot}
                            onChange={handleLotChange}
                            className={`w-full px-3 py-2 border ${lots.length > 0 && !selectedLot && error ? 'border-red-500' : 'border-gray-300'} 
                                rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486] ${!selectedPlot ? 'bg-gray-200' : ''}`}
                            disabled={!selectedPlot || loadingLots}
                        >
                            <option value="">{loadingLots ? "Cargando lotes..." : "Seleccione un lote"}</option>
                            {lots.length > 0 ? (
                                lots.map((lot) => (
                                    <option key={lot.id_lot} value={lot.id_lot}>
                                        {lot.crop_name} - {lot.crop_variety} ({lot.id_lot})
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>
                                    No hay lotes disponibles para este predio
                                </option>
                            )}
                        </select>
                        {selectedPlot && lots.length === 0 && (
                            <p className="text-sm text-amber-600 mt-1 text-left">
                                No se encontraron lotes asociados a este predio.
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="observations" className="block text-sm font-medium text-gray-700 text-left mb-1">
                            Observaciones:
                        </label>
                        <textarea
                            id="observations"
                            name="observations"
                            value={observations}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${error && !observations.trim() ? 'border-red-500' : 'border-gray-300'} 
                rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486] h-32`}
                            placeholder="Describa el fallo que ha experimentado..."
                            required
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

            {/* Modal de Error */}
            {showErrorModal && (
                <Modal
                    showModal={showErrorModal}
                    onClose={() => setShowErrorModal(false)}
                    title="ERROR"
                    btnMessage="Entendido"
                >
                    <p>{modalMessage}</p>
                </Modal>
            )}

            {/* Modal de Éxito */}
            {showSuccessModal && (
                <Modal
                    showModal={showSuccessModal}
                    onClose={handleSuccessClose}
                    title="ÉXITO"
                    btnMessage="Entendido"
                >
                    <p>{modalMessage}</p>
                </Modal>
            )}
        </>
    );
};

export default ReportSupplyModal;