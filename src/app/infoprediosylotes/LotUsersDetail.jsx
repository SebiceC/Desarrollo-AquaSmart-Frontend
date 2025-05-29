import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Obtener ID de la URL
import axios from "axios";
import NavBar from "../../components/NavBar";
import Modal from "../../components/Modal";
import BackButton from "../../components/BackButton";

const API_URL = import.meta.env.VITE_APP_API_URL;

const cropTypeMap = {
    1: "Piscicultura",
    2: "Agricultura"
};

function LotUsersDetail() {
    const { id_lot } = useParams(); // Obtener el ID del lote seleccionado
    const [lot, setLot] = useState(null);
    const [error, setError] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const token = localStorage.getItem("token"); // Obtener el token desde localStorage

    useEffect(() => {
        const fetchLot = async () => {
            try {
                const response = await axios.get(`${API_URL}/plot-lot/lots/${id_lot}`, {
                    headers: { Authorization: `Token ${token}` }, // Asegúrate de tener el token correctamente
                });
                // console.log(response.data)
                setLot(response.data); // Guardar el lote en el estado
            } catch (err) {
                setError("No se pudo cargar la información del lote.");
                setShowErrorModal(true);
            }
        };

        if (token) {
            fetchLot(); // Solo hacer la solicitud si el token existe
        } else {
            setError("Token de autenticación no encontrado.");
            setShowErrorModal(true);
        }
    }, [id_lot, token]); // Se ejecuta cada vez que cambia el ID o el token

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
                    Información del lote
                </h2>

                <div className="flex justify-center">
                    <div className="bg-gray-200 rounded-2xl p-8 shadow-md w-full max-w-2xl text-left">
                        {lot ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Información del lote */}
                                <div className="flex items-center space-x-2">
                                    <strong>ID Lote:</strong>
                                    <span>{lot.id_lot || "No disponible"}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <strong>Nombre de Cultivo:</strong>
                                    <span>{lot.crop_name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <strong>Tipo de Cultivo:</strong>
                                    <span>{cropTypeMap[lot.crop_type] || `Tipo ${lot.crop_type}`}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <strong>Variedad del Cultivo:</strong>
                                    <span>{lot.crop_variety || "No disponible"}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <strong>Tipo de Suelo:</strong>
                                    <span>{lot.soil_type_name || "No disponible"}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <strong>ID Predio:</strong>
                                    <span>{lot.plot || "No disponible"}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <strong>Estado:</strong>
                                    <span>{lot.is_activate === true ? "Activo" : (lot.is_activate === false ? "Inactivo" : "No disponible")}</span>
                                </div>
                                <div className="flex justify-start mt-5">
                                    <BackButton to={`/mispredios/predio/${lot.plot}`} text="Regresar a la lista de mis lotes" className="hover:bg-blue-50" />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                                <p className="text-gray-500 text-lg font-semibold">
                                    Cargando información del lote...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LotUsersDetail;