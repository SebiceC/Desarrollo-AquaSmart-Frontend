import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputItem from "../../components/InputItem";
import Modal from "../../components/Modal";
import NavBar from "../../components/NavBar";
import BackButton from "../../components/BackButton";
import { ChevronDown } from 'lucide-react';
import { PiAsteriskSimpleBold } from "react-icons/pi";
import Footer from "../../components/Footer";

const API_URL = import.meta.env.VITE_APP_API_URL;

const RegistroLotes = () => {
    const [formData, setFormData] = useState({
        nombre_cultivo: "",
        tipo_cultivo: "",
        predio_asignado: "",
        tipo_suelo: "",
        variedad_cultivo: "",
    });

    // Objeto para rastrear errores por campo
    const [fieldErrors, setFieldErrors] = useState({
        nombre_cultibvo: false,
        predio_asignado: false,
        variedad_cultivo: false
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false); // Track submission status
    const [soilTypes, setSoilTypes] = useState([])
    const [cropTypes, setCropTypes] = useState([])
    const navigate = useNavigate();


    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setErrorMessage("No se encontró un token de autenticación.");
            return;
        }
        const fetchOptions = async () => {
            try {
                const soilTypesResponse = await axios.get(
                    `${API_URL}/plot-lot/soil-types`, {
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const cropTypesResponse = await axios.get(`${API_URL}/plot-lot/crop-types`, {
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                setCropTypes(cropTypesResponse.data);
                setSoilTypes(soilTypesResponse.data);
            } catch (error) {
                console.error("Error al obtener las opciones:", error);
            }
        };

        fetchOptions();
    }, []);

    const validateField = (name, value) => {
        if (name === "nombre_cultivo" || name === "variedad_cultivo") {
            const regex = /^[A-Za-z0-9\s]*$/;
            return regex.test(value);
        } else if (name === "predio_asignado") {
            // Validar que predio_asignado tenga a lo sumo un guión
            // Esta regex permite letras, números y hasta un guión
            const regex = /^[A-Za-z0-9]*-?[A-Za-z0-9]*$/;
            return regex.test(value);
        }
        return true;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Actualizar el estado del formulario
        setFormData((prevData) => ({ ...prevData, [name]: value }));

        // Validar campos específicos
        if (name === "nombre_cultivo" || name === "variedad_cultivo" || name === "predio_asignado") {
            const isValid = validateField(name, value);

            // Actualizar errores de campo específicos
            setFieldErrors(prev => ({ ...prev, [name]: !isValid }));

            // Mostrar mensaje de error general si cualquiera de los campos tiene error
            const updatedErrors = {
                ...fieldErrors,
                [name]: !isValid
            };

            if (!isValid) {
                if (name === "predio_asignado") {
                    setErrorMessage("ERROR, el predio solo puede contener letras, números y máximo un guión");
                } else {
                    setErrorMessage("ERROR, tipo de datos erróneo (solo números y letras)");
                }
            } else if (Object.values(updatedErrors).some(error => error)) {
                // Mantener el mensaje de error si otros campos tienen errores
                if (updatedErrors.predio_asignado) {
                    setErrorMessage("ERROR, el predio solo puede contener letras, números y máximo un guión");
                } else {
                    setErrorMessage("ERROR, tipo de datos erróneo (solo números y letras)");
                }
            } else {
                setErrorMessage("");
            }
        }
    };

    const validateForm = () => {
        const { nombre_cultivo, tipo_cultivo, predio_asignado, tipo_suelo, variedad_cultivo } = formData;

        // Verificar campos obligatorios
        if (!nombre_cultivo.trim() || !tipo_cultivo.trim() || !predio_asignado.trim() || !tipo_suelo.trim()) {
            setErrorMessage("Por favor, complete todos los campos obligatorios.");
            return false;
        }

        // Verificar validez de todos los campos
        const hasInvalidNombreCultivo = !validateField("nombre_cultivo", tipo_cultivo);
        const hasInvalidPredioAsignado = !validateField("predio_asignado", predio_asignado);
        const hasInvalidVariedadCultivo = variedad_cultivo.trim() !== "" && !validateField("variedad_cultivo", variedad_cultivo);

        // Actualizar los errores de campo
        setFieldErrors({
            nombre_cultivo: hasInvalidNombreCultivo,
            predio_asignado: hasInvalidPredioAsignado,
            variedad_cultivo: hasInvalidVariedadCultivo
        });

        // Si alguno de los campos tiene datos inválidos, no permitir el envío
        if (hasInvalidNombreCultivo || hasInvalidPredioAsignado || hasInvalidVariedadCultivo) {
            if (hasInvalidPredioAsignado) {
                setErrorMessage("ERROR, el predio solo puede contener letras, números y máximo un guión");
            } else {
                setErrorMessage("ERROR, tipo de datos erróneo (solo números y letras)");
            }
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitted(true);

        if (!validateForm()) return;

        const token = localStorage.getItem("token");
        if (!token) {
            setErrorMessage("No se encontró un token de autenticación.");
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/plot-lot/lots/register`,
                {
                    crop_name: formData.nombre_cultivo,
                    crop_type: formData.tipo_cultivo,
                    plot: formData.predio_asignado,
                    soil_type: formData.tipo_suelo,
                    crop_variety: formData.variedad_cultivo,
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
                setErrorMessage(error.response.data.plot || "Error en el registro.");
            } else {
                setErrorMessage("Error de conexión con el servidor.");
            }
        }
    };


    return (
        <div>
            <NavBar />
            <div className="w-full min-h-screen flex flex-col items-center pt-34 bg-white p-6">
                <div className="w-full max-w-3xl">
                    <h2 className="text-center text-2xl font-semibold text-[#365486] mb-2">
                        Formulario de Registro de Lotes
                    </h2>
                </div>
                <div className="bg-white p-6  w-full max-w-3xl">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputItem
                            label={
                                <>
                                    Nommbre del cultivo <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                </>
                            }
                            type="text"
                            name="nombre_cultivo"
                            placeholder="Ej: Cacao"
                            value={formData.nombre_cultivo}
                            onChange={handleChange}
                            maxLength={20}
                            error={(!formData.nombre_cultivo.trim() && isSubmitted) || fieldErrors.nombre_cultivo}
                            className={`${(!formData.nombre_cultivo.trim() && isSubmitted) || fieldErrors.nombre_cultivo ? "border-red-100" : "border-gray-300"}`}

                        />
                        <div className="relative mt-2 flex flex-col">
                            <label htmlFor="tipo_cultivo" className="text-sm font-medium text-gray-700">
                                Tipo de Cultivo <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                            </label>
                            <select
                                id="tipo_cultivo"
                                name="tipo_cultivo"
                                value={formData.tipo_cultivo}
                                onChange={handleChange}
                                className="w-[85%] border border-gray-300 rounded px-3 py-2 pr-8 appearance-none"
                            >
                                <option value="">SELECCIÓN DE TIPO DE CULTIVO</option>
                                {cropTypes.map((type, index) => (
                                    <option key={index} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-14 lg:right-16 top-1/2 transform lg:-translate-y-0 text-gray-500 w-4 h-4 pointer-events-none" />
                        </div>
                        <InputItem
                            label={
                                <>
                                    Predio a asignar <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                </>
                            }
                            type="text"
                            name="predio_asignado"
                            placeholder="ID (letras, números y un guión)"
                            value={formData.predio_asignado}
                            onChange={handleChange}
                            maxLength={20}
                            error={(!formData.predio_asignado.trim() && isSubmitted) || fieldErrors.predio_asignado}
                            className={`${(!formData.predio_asignado.trim() && isSubmitted) || fieldErrors.predio_asignado ? "border-red-100" : "border-gray-300"}`}
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
                                {soilTypes.map((type, index) => (
                                    <option key={index} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-14 lg:right-16 top-1/2 transform lg:-translate-y-0 text-gray-500 w-4 h-4 pointer-events-none" />
                        </div>

                        <InputItem
                            label="Variedad de cultivo"
                            type="text"
                            name="variedad_cultivo"
                            placeholder="Ej: Floral"
                            value={formData.variedad_cultivo}
                            onChange={handleChange}
                            maxLength={20}
                            error={fieldErrors.variedad_cultivo}
                            className={`${fieldErrors.variedad_cultivo ? "border-red-100" : "border-gray-300"}`}
                        />

                        {/* Contenedor para mensajes de error y botones */}
                        <div className="col-span-1 md:col-span-2 flex flex-col items-start mt-4">
                            {/* Mensajes de error */}
                            {errorMessage && (
                                <p className="text-[#F90000] text-sm mb-4 w-full">{errorMessage}</p>
                            )}

                            {/* Botones de acción */}
                            <div className="flex flex-col lg:flex-row gap-2 justify-between w-full">
                                <BackButton to="/gestionDatos/lotes" text="Regresar al listado de lotes" />
                                <button
                                    type="submit"
                                    className="bg-[#365486] text-white px-5 py-2 rounded-lg hover:bg-[#2f4275]"
                                >
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Success modal */}
                <Modal
                    showModal={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        navigate("/gestionDatos/lotes");
                    }}
                    title="Registro Exitoso"
                    btnMessage="Aceptar"
                >
                    <p>El lote ha sido registrado con éxito.</p>
                </Modal>
            </div>
            <Footer />
        </div>
    );
};

export default RegistroLotes;