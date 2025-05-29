import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Obtener ID de la URL
import axios from "axios";

import { FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import NavBar from "../../../components/NavBar";
import Modal from "../../../components/Modal";
import BackButton from "../../../components/BackButton";
import Footer from "../../../components/Footer";

const API_URL = import.meta.env.VITE_APP_API_URL;

function DispositivosIoTInformation() {
    const { iot_id } = useParams(); // Obtener el ID del lote seleccionado
    const [iot, setIot] = useState(null);
    const [error, setError] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);

    const token = localStorage.getItem("token"); // Obtener el token desde localStorage

    useEffect(() => {
        const fetchLot = async () => {
            try {
                const response = await axios.get(`${API_URL}/iot/iot-devices/${iot_id}`, {
                    headers: { Authorization: `Token ${token}` }, // Asegúrate de tener el token correctamente
                });
                console.log(response.data)
                setIot(response.data); // Guardar el lote en el estado
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
    }, [iot_id, token]); // Se ejecuta cada vez que cambia el ID o el token

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
            <div className="max-w-4xl mx-auto p-6 mt-8 mb-20">
                {/* Título alineado correctamente */}
                <h2 className="text-center text-2xl font-bold my-12">
                    Información del dispositivo
                </h2>

                <div className="flex justify-center">
                    <div className="bg-gray-200 rounded-2xl p-8 shadow-md w-full max-w-3xl text-center">
                        {iot ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                                {/* Información del lote */}
                                <p className="flex items-center space-x-2">
                                    <span><strong>ID:</strong> {iot.iot_id || "ID del dispositivo no disponible"}</span>
                                </p>
                                <div className="flex items-center space-x-2">
                                    <strong>Estado:</strong>
                                    {/* Estado con colores */}
                                    <span 
                                        className={`font-semibold px-3 py-1 rounded-full ${iot.is_active === true ? "bg-green-500 text-white" : (iot.is_active === false ? "bg-red-500 text-white" : "bg-gray-300 text-black")}`}>
                                        {iot.is_active === true ? "Activo" : (iot.is_active === false ? "Inactivo" : "No disponible")}
                                    </span>
                                </div>
                                <p className="flex items-center space-x-2">
                                    <span><strong>Nombre:</strong> {iot.name || "No disponible"}</span>
                                </p>
                                <p className="flex items-center space-x-2">
                                    <span><strong>Tipo:</strong> {iot.device_type_name || "No disponible"}</span>
                                </p>
                                <p className="flex items-center space-x-2">
                                    <span><strong>Dueño del predio:</strong> {iot.owner_name || "No disponible"}</span>
                                </p>
                                
                                <p className="flex items-center space-x-2">
                                    <span><strong>Predio asignado:</strong> {iot.id_plot || "No disponible"}</span>
                                </p>

                                {/* Características en una sola columna */}
                                <div className="col-span-1 sm:col-span-2">
                                    <p className="flex items-center space-x-2">
                                        <strong>Características:</strong> 
                                    </p>
                                    <p>{iot.characteristics || "No disponible"}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                                <p className="text-gray-500 text-lg font-semibold">
                                    Cargando información del dispositivo...
                                </p>
                            </div>
                        )}
                        <div className="flex justify-between w-full mt-4">
                            <BackButton to="/gestionDatos/dispositivosIoT" text="Regresar a la lista" />
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default DispositivosIoTInformation;
