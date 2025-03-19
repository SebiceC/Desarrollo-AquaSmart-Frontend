import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputItem from "../../components/InputItem";
import Modal from "../../components/Modal";
import NavBar from "../../components/NavBar";

const API_URL = import.meta.env.VITE_APP_API_URL;

const RegistroPredios = () => {
    const [formData, setFormData] = useState({
        owner_id: "",
        farm_name: "",
        land_size: "",
        latitude: "",
        longitude: "",
    });
    const [errors, setErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "latitude" || name === "longitude") {
            if (/^-?\d{0,3}(\.\d{0,6})?$/.test(value)) {
                setFormData((prevData) => ({ ...prevData, [name]: value }));
            }
        } else if (name === "land_size") {
            if (/^\d{0,6}(\.\d{0,2})?$/.test(value)) {
                setFormData((prevData) => ({ ...prevData, [name]: value }));
            }
        } else if (name === "owner_id" || name === "farm_name") {
            if (value.length <= 20) {
                setFormData((prevData) => ({ ...prevData, [name]: value }));
            }
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    const validateForm = () => {
        let newErrors = {};
        Object.keys(formData).forEach((key) => {
            if (!formData[key].trim()) {
                newErrors[key] = " ";
            }
        });
        if (Object.keys(newErrors).length > 0) {
            setErrorMessage("Por favor, complete todos los campos obligatorios.");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const response = await axios.post(`${API_URL}/plot-lot/plots/register`, {
                owner: formData.owner_id,
                plot_name: formData.farm_name,
                plot_extension: formData.land_size,
                latitud: formData.latitude,
                longitud: formData.longitude,
            }, {
                headers: {
                    Authorization: `Token ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 201) {
                setShowSuccessModal(true);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                let newErrors = {};
                if (error.response.data.owner) {
                    newErrors.owner_id = " ";
                    setErrorMessage(error.response.data.owner[0]);
                }
                if (error.response.data.detail === "La georeferenciación ya está asignada a otro predio.") {
                    newErrors.latitude = " ";
                    newErrors.longitude = " ";
                    setErrorMessage("ERROR: La georeferenciación ingresada ya está asignada a otro predio.");
                }
                if (error.response.data.non_field_errors) {
                    setErrorMessage(error.response.data.non_field_errors[0]);
                }
                setErrors(newErrors);
            } else {
                setErrorMessage("Error de conexión con el servidor.");
            }
        }
    };

    return (
        
        <div>
            <NavBar/>
            <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-6">
                <h2 className="text-center text-2xl font-bold mb-8 mt-12">
                    Formulario de Registro de Predios
                </h2>
                <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-md">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputItem
                            label="Dueño del predio"
                            type="number"
                            name="owner_id"
                            placeholder="ID"
                            value={formData.owner_id}
                            onChange={handleChange}
                            error={errors.owner_id}
                        />
                        <InputItem
                            label="Nombre del predio"
                            type="text"
                            name="farm_name"
                            placeholder="Ej: La divina"
                            value={formData.farm_name}
                            onChange={handleChange}
                            error={errors.farm_name}
                        />
                        <InputItem
                            label="Extensión de tierra (m²)"
                            type="number"
                            name="land_size"
                            placeholder="Ej: 200"
                            value={formData.land_size}
                            onChange={handleChange}
                            error={errors.land_size}
                        />
                        <InputItem
                            label="Latitud"
                            type="number"
                            name="latitude"
                            placeholder="Ej: 2.879568089022734"
                            value={formData.latitude}
                            onChange={handleChange}
                            error={errors.latitude}
                        />
                        <InputItem
                            label="Longitud"
                            type="number"
                            name="longitude"
                            placeholder="Ej: -75.29382390388328"
                            value={formData.longitude}
                            onChange={handleChange}
                            error={errors.longitude}
                        />
                        <div className="col-span-1 md:col-span-2 flex flex-col items-start">
                            {errorMessage && (
                                <p className="text-red-600 text-sm mb-3">{errorMessage}</p>
                            )}
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
                    <p>El predio ha sido registrado con éxito.</p>
                </Modal>
            </div>
        </div>
        
    );
};

export default RegistroPredios;
