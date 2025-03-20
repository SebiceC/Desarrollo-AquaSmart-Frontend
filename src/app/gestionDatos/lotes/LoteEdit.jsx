import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import InputItem from "../../../components/InputItem";
import Modal from "../../../components/Modal";
import NavBar from "../../../components/NavBar";
import { ChevronDown } from "lucide-react";
import { PiAsteriskSimpleBold } from "react-icons/pi";

const API_URL = import.meta.env.VITE_APP_API_URL;

const LoteEdit = () => {
    const { id_lot } = useParams(); // Obtener ID del lote a actualizar
    const [formData, setFormData] = useState({
        tipo_cultivo: "",
        predio_asignado: "",
        tipo_suelo: "",
        variedad_cultivo: "",
    });
    
    const [soilTypes, setSoilTypes] = useState([]);
    const [errors, setErrors] = useState({
        tipo_cultivo: false,
        predio_asignado: false,
        variedad_cultivo: false
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
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

        const fetchLot = async () => {
            try {
                const response = await axios.get(`${API_URL}/plot-lot/lots/${id_lot}`, {
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                setFormData({
                    id_lot: response.data.id_lot || "",
                    tipo_cultivo: response.data.crop_type || "",
                    predio_asignado: response.data.plot || "",
                    tipo_suelo: response.data.soil_type || "",
                    variedad_cultivo: response.data.crop_variety || "",
                });
            } catch (error) {
                setErrorMessage("No se pudo cargar la información del lote.");
                setShowSuccessModal(true);
            }
        };

        fetchOptions();
        fetchLot();  // Obtener datos del lote a actualizar si el token está presente.
    }, [id_lot]);

    const validateField = (name, value) => {
        if (name === "tipo_cultivo" || name === "variedad_cultivo") {
            const regex = /^[A-Za-zÁÉÍÓÚáéíóú0-9\s]*$/; // Se agregan vocales con tilde
            return regex.test(value);
        } else if (name === "predio_asignado") {
            const regex = /^[A-Za-zÁÉÍÓÚáéíóú0-9]*-?[A-Za-zÁÉÍÓÚáéíóú0-9]*$/; // Se agregan vocales con tilde
            return regex.test(value);
        }
        return true;
    };    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));

        if (name === "tipo_cultivo" || name === "variedad_cultivo" || name === "predio_asignado") {
            const isValid = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: !isValid }));

            if (!isValid) {
                setErrorMessage("ERROR, tipo de datos erróneo (solo números y letras)");
            } else {
                setErrorMessage("");
            }
        }
    };

    const validateForm = () => {
        const { tipo_cultivo, predio_asignado, tipo_suelo, variedad_cultivo } = formData;
    
        let newErrors = {}; // Este objeto almacenará los errores para cada campo
    
        // Verificar campos obligatorios
        if (!tipo_cultivo.trim()) {
            newErrors.tipo_cultivo = " ";
        }
        if (!predio_asignado.trim()) {
            newErrors.predio_asignado = " ";
        }
        if (!String(tipo_suelo).trim()) {
            newErrors.tipo_suelo = " ";
        }
    
        // Validar tipo de cultivo
        if (!validateField("tipo_cultivo", tipo_cultivo)) {
            newErrors.tipo_cultivo = "ERROR, tipo de datos erróneo (solo números y letras)";
        }
    
        // Validar predio asignado
        if (!validateField("predio_asignado", predio_asignado)) {
            newErrors.predio_asignado = "ERROR, tipo de datos erróneo (solo números y letras)";
        }
    
        // Verificar variedad cultivo
        if (variedad_cultivo.trim() && !validateField("variedad_cultivo", variedad_cultivo)) {
            newErrors.variedad_cultivo = "ERROR, tipo de datos erróneo (solo números y letras)";
        }
    
        setErrors(newErrors); // Actualiza los errores en el estado
    
        // Si hay algún error, no permitas enviar el formulario
        if (Object.keys(newErrors).length > 0) {
            return false;
        }
    
        return true; // Si no hay errores, el formulario es válido
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
            const response = await axios.patch(
                `${API_URL}/plot-lot/lots/${id_lot}/update`,
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
    
            if (response.status === 200) {
                setShowSuccessModal(true);
            }
        } catch (error) {
            if (error.response) {
                // Verificar si hay errores específicos
                let newErrors = {};
    
                // Verificar si el error tiene un mensaje específico para el predio
                if (error.response.data.plot) {
                    newErrors.predio_asignado = " ";  // Mostrar el error
                    setErrorMessage(error.response.data.plot[0]);  // Mostrar el mensaje de error relacionado con el predio
                }
    
                // Si se devuelve un error general
                if (error.response.data.error) {
                    setErrorMessage(error.response.data.error);  // Mostrar el mensaje general de error
                }
    
                // Verificar si hay errores no específicos
                if (error.response.data.non_field_errors) {
                    setErrorMessage(error.response.data.non_field_errors[0]);
                }
    
                setErrors(newErrors); // Actualizar los errores
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
                    Actualización de Lote
                </h2>
                <div className="bg-white p-10 w-full max-w-3xl">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputItem
                            label={<><strong>ID lote</strong> <PiAsteriskSimpleBold size={12} className="inline text-red-500" /></>}
                            type="text"
                            name="tipo_cultivo"
                            placeholder="Ej: Cacao"
                            value={formData.id_lot}
                            onChange={handleChange}
                            error={errors.id_lot}
                            maxLength={20}
                            disabled
                        />
                        <InputItem
                            label={<><strong>Tipo de cultivo</strong> <PiAsteriskSimpleBold size={12} className="inline text-red-500" /></>}
                            type="text"
                            name="tipo_cultivo"
                            placeholder="Ej: Cacao"
                            value={formData.tipo_cultivo}
                            onChange={handleChange}
                            error={errors.tipo_cultivo}
                            maxLength={20}
                        />
                        <InputItem
                            label={<><strong>Predio a asignar</strong> <PiAsteriskSimpleBold size={12} className="inline text-red-500" /></>}
                            type="text"
                            name="predio_asignado"
                            placeholder="ID (letras, números y un guión)"
                            value={formData.predio_asignado}
                            onChange={handleChange}
                            error={errors.predio_asignado} // Mostrar el error aquí
                            maxLength={20}
                            className={`${errors.predio_asignado ? "border-red-500" : "border-gray-300"}`} // Condición de borde rojo
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
                            error={errors.variedad_cultivo}
                            maxLength={20}
                        />
    
    
                        <div className="col-span-1 md:col-span-2 flex flex-col items-start">
                        {errorMessage && <p className="text-red-600 text-sm mb-3">{errorMessage}</p>}
                            <button
                                type="submit"
                                className="bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Actualizar
                            </button>
                        </div>
                    </form>
                </div>
    
                <Modal
                    showModal={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        navigate("/home");
                    }}
                    title="Actualización Exitosa"
                    btnMessage="Aceptar"
                >
                    <p>El lote ha sido actualizado con éxito.</p>
                </Modal>
            </div>
        </div>
    );
}
export default LoteEdit;    