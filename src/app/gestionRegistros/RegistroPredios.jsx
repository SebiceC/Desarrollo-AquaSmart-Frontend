import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputItem from "../../components/InputItem";
import Modal from "../../components/Modal";

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
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const validateForm = () => {
        let newErrors = {};
        Object.keys(formData).forEach((key) => {
            if (!formData[key].trim()) {
                newErrors[key] = " "; //Vacio para que unicamente muestre el color rojo en el Input
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setShowSuccessModal(true);
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white-100 p-6">
            <h2 className="text-center text-xl font-medium mb-8">
                Formulario de Registro de Predios
            </h2>
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl">
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
                        {Object.keys(errors).length > 0 && (
                            <p className="text-red-600 text-sm mb-3">Por favor, complete todos los campos obligatorios.</p>
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
    );
};

export default RegistroPredios;
