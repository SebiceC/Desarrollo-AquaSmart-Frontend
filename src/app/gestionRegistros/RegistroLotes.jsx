import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputItem from "../../components/InputItem";
import Modal from "../../components/Modal";
import NavBar from "../../components/NavBar";
import { ChevronDown } from "lucide-react";
import { PiAsteriskSimpleBold } from "react-icons/pi";

const API_URL = import.meta.env.VITE_APP_API_URL;

const RegistroLotes = () => {
    const [formData, setFormData] = useState({
        cultivo_id: "",
        predio_asignado: "",
        tipo_suelo: "",
        variedad_cultivo: "",
    });

    const tipoSuelos = {
        1: "Seco",
        2: "Mojado"
    };

    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({ ...prevData, [name]: value }));
        
        // Si el usuario empieza a escribir, borrar mensaje de error
        if (errorMessage) setErrorMessage("");
    };

    const validateForm = () => {
        const { cultivo_id, predio_asignado, tipo_suelo, variedad_cultivo } = formData;

        if (!cultivo_id.trim() || !predio_asignado.trim() || !tipo_suelo.trim()) {
            setErrorMessage("Por favor, complete todos los campos obligatorios.");
            return false;
        }

        if (!/^[A-Za-z0-9\s]*$/.test(cultivo_id) || cultivo_id.length > 20) {
            setErrorMessage("ERROR: El tipo de cultivo solo permite letras y números (máx. 20 caracteres).");
            return false;
        }

        if (!/^[A-Za-z0-9\s]*$/.test(predio_asignado) || predio_asignado.length > 20) {
            setErrorMessage("ERROR: El predio asignado solo permite letras y números (máx. 20 caracteres).");
            return false;
        }
        if (!/^[A-Za-z0-9\s]*$/.test(variedad_cultivo) || variedad_cultivo.length > 20) {
            setErrorMessage("ERROR: La variedad de cultivo solo permite letras y números (máx. 20 caracteres).");
            return false;
        }

        // Validar selección de tipo_suelo
        if (!Object.keys(tipoSuelos).includes(tipo_suelo)) {
            setErrorMessage("Seleccione un tipo de suelo válido.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const token = localStorage.getItem("token");
        if (!token) {
            setErrorMessage("No se encontró un token de autenticación.");
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}`,
                {
                    cultivo: formData.cultivo_id,
                    predio_asignado: formData.predio_asignado,
                    tipo_suelo: formData.tipo_suelo,
                    variedad_cultivo: formData.variedad_cultivo,
                },
                {
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 201) {
                setShowSuccessModal(true);
            }
        } catch (error) {
            if (error.response) {
                setErrorMessage(error.response.data.message || "Error en el registro.");
            } else {
                setErrorMessage("Error de conexión con el servidor.");
            }
        }
    };

    return (
        <div>
            <NavBar />
            <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-6 mt-10">
                <h2 className="text-center text-2xl font-bold mb-8 mt-12">
                    Formulario de Registro de Lotes
                </h2>
                <div className="bg-white p-10 w-full max-w-3xl">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputItem
                            label={
                                <>
                                    Tipo de cultivo <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                </>
                            }
                            type="text"
                            name="cultivo_id"
                            placeholder="Ej: Cacao"
                            value={formData.cultivo_id}
                            onChange={handleChange}
                        />
                        <InputItem
                            label={
                                <>
                                    Predio a asignar <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                </>
                            }
                            type="text"
                            name="predio_asignado"
                            placeholder="ID"
                            value={formData.predio_asignado}
                            onChange={handleChange}
                        />
                        <div className="relative mt-2 flex flex-col">
                            <label htmlFor="tipo_suelo" className="text-sm font-medium text-gray-700">
                                Tipo de Suelo <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                            </label>
                            <select
                                id="tipo_suelo"
                                name="tipo_suelo"
                                value={formData.tipo_suelo}
                                onChange={handleChange}
                                className="w-[85%] border border-gray-300 rounded px-3 py-2 pr-8 appearance-none"
                            >
                                <option value="">SELECCIÓN DE TIPO DE SUELO</option>
                                {Object.entries(tipoSuelos).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-14 lg:right-16 top-1/2 transform lg:-translate-y-2 text-gray-500 w-4 h-4 pointer-events-none" />
                        </div>

                        <InputItem
                            label="Variedad de cultivo"
                            type="text"
                            name="variedad_cultivo"
                            placeholder="Ej: Floral"
                            value={formData.variedad_cultivo}
                            onChange={handleChange}
                        />
                        
                        {/* Mensaje de error general */}
                        {errorMessage && (
                            <p className="col-span-1 md:col-span-2 text-red-600 text-sm mb-3">{errorMessage}</p>
                        )}

                        <div className="col-span-1 md:col-span-2 flex flex-col items-start">
                            <button
                                type="submit"
                                className="bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Registrar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Modal de éxito */}
                <Modal
                    showModal={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        navigate("/home");
                    }}
                    title="Registro Exitoso"
                    btnMessage="Aceptar"
                >
                    <p>El lote ha sido registrado con éxito.</p>
                </Modal>
            </div>
        </div>
    );
};

export default RegistroLotes;
