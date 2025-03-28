import React, { useState, useEffect } from "react";
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
        tipo_cultivo: "",
        predio_asignado: "",
        tipo_suelo: "",
        variedad_cultivo: "",
    });

    // Objeto para rastrear errores por campo
    const [fieldErrors, setFieldErrors] = useState({
        tipo_cultivo: false,
        predio_asignado: false,
        variedad_cultivo: false
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false); // Track submission status
    const [soilTypes, setSoilTypes] = useState([])
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

                setSoilTypes(soilTypesResponse.data);
            } catch (error) {
                console.error("Error al obtener las opciones:", error);
            }
        };

        fetchOptions();
    }, []);

    const validateField = (name, value) => {
        if (name === "tipo_cultivo" || name === "variedad_cultivo") {
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
        if (name === "tipo_cultivo" || name === "variedad_cultivo" || name === "predio_asignado") {
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
        const { tipo_cultivo, predio_asignado, tipo_suelo, variedad_cultivo } = formData;

        // Verificar campos obligatorios
        if (!tipo_cultivo.trim() || !predio_asignado.trim() || !tipo_suelo.trim()) {
            setErrorMessage("Por favor, complete todos los campos obligatorios.");
            return false;
        }

        // Verificar validez de todos los campos
        const hasInvalidTipoCultivo = !validateField("tipo_cultivo", tipo_cultivo);
        const hasInvalidPredioAsignado = !validateField("predio_asignado", predio_asignado);
        const hasInvalidVariedadCultivo = variedad_cultivo.trim() !== "" && !validateField("variedad_cultivo", variedad_cultivo);

        // Actualizar los errores de campo
        setFieldErrors({
            tipo_cultivo: hasInvalidTipoCultivo,
            predio_asignado: hasInvalidPredioAsignado,
            variedad_cultivo: hasInvalidVariedadCultivo
        });

        // Si alguno de los campos tiene datos inválidos, no permitir el envío
        if (hasInvalidTipoCultivo || hasInvalidPredioAsignado || hasInvalidVariedadCultivo) {
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
            <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-6 mt-10 lg:mt-0">
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
                            name="tipo_cultivo"
                            placeholder="Ej: Cacao"
                            value={formData.tipo_cultivo}
                            onChange={handleChange}
                            maxLength={20}
                            error={(!formData.tipo_cultivo.trim() && isSubmitted) || fieldErrors.tipo_cultivo}
                            className={`${(!formData.tipo_cultivo.trim() && isSubmitted) || fieldErrors.tipo_cultivo ? "border-red-100" : "border-gray-300"}`}
                        />
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

                        {/* General error message */}
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

                {/* Success modal */}
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