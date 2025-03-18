import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Obtener ID de la URL
import axios from "axios";

import { FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import NavBar from "../../../components/NavBar";
import Modal from "../../../components/Modal";

const API_URL = import.meta.env.VITE_APP_API_URL;

function DispositivosIoTInformation() {
    const { id } = useParams(); // Obtener el ID del lote seleccionado
    const [lot, setLot] = useState(null);
    const [error, setError] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);

    const token = localStorage.getItem("token"); // Obtener el token desde localStorage

    useEffect(() => {
        const fetchLot = async () => {
            try {
                const response = await axios.get(`${API_URL}/users/admin/update/${id}`, {
                    headers: { Authorization: `Token ${token}` }, // Asegúrate de tener el token correctamente
                });
                setLot(response.data); // Guardar el lote en el estado
            } catch (err) {
                setError("No se pudo cargar la información del dispositivo.");
                setShowErrorModal(true);
            }
        };

        if (token) {
            fetchLot(); // Solo hacer la solicitud si el token existe
        } else {
            setError("Token de autenticación no encontrado.");
            setShowErrorModal(true);
        }
    }, [id, token]); // Se ejecuta cada vez que cambia el ID o el token

    return (
        <div className="w-full min-h-screen bg-white">
            <NavBar />

            {/* Modal de Error */}
            <Modal
                showModal={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="ERROR"
                btnMessage="Aceptar"
            >
                <p>{error}</p>
            </Modal>

            {/* Contenedor principal */}
            <div className="max-w-4xl mx-auto p-6 mt-8">
                {/* Título alineado correctamente */}
                <h2 className="text-center text-2xl font-bold my-12">
                    Información del dispositivo
                </h2>

                <div className="flex justify-center">
                    <div className="bg-gray-200 rounded-2xl p-8 shadow-md w-full max-w-3xl text-center">
                        {lot ? (
                            <div className="space-y-6 text-left">
                                {/* Información del lote */}
                                <p className="flex items-center space-x-2">
                                    <FaUser className="text-gray-600" />
                                    <span><strong>ID:</strong> {lot.id_lot || "ID del lote no disponible"}</span>
                                </p>
                                <p className="flex items-center space-x-2">
                                    <FaPhone className="text-gray-600" />
                                    <span><strong>Tipo de cultivo:</strong> {lot.crop_type || "No disponible"}</span>
                                </p>
                                <p className="flex items-center space-x-2">
                                    <FaEnvelope className="text-gray-600" />
                                    <span><strong>Variedad del cultivo:</strong> {lot.crop_variety || "No disponible"}</span>
                                </p>
                                <p className="flex items-center space-x-2">
                                    <FaEnvelope className="text-gray-600" />
                                    <span><strong>Tipo de suelo:</strong> {lot?.soil_type_id?.name || "No disponible"}</span>
                                </p>
                                <p className="flex items-center space-x-2">
                                    <FaEnvelope className="text-gray-600" />
                                    <span><strong>ID del predio:</strong> {lot.plot_id || "No disponible"}</span>
                                </p>
                            </div>
                        ) : (
                            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                                <p className="text-gray-500 text-lg font-semibold">
                                    Cargando información del dispositivo...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DispositivosIoTInformation;
