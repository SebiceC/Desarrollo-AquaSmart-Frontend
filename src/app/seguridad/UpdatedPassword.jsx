import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputItem from "../../components/InputItem";
import Modal from "../../components/Modal";
import NavBar from "../../components/NavBar";
import BackButton from "../../components/BackButton";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { PiAsteriskSimpleBold } from "react-icons/pi";

const API_URL = import.meta.env.VITE_APP_API_URL;

const UpdatedPassword = () => {
    const [formData, setFormData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [errors, setErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [passwordValidations, setPasswordValidations] = useState({});
    const [showPassword, setShowPassword] = useState({
        current_password: false,
        new_password: false,
        confirm_password: false
    });
    const navigate = useNavigate();

    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 8 && password.length <= 20,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            specialChar: /[!@#$%^&*()_+\-={}|:;"'<>,.?/]/.test(password),
        };

        setPasswordValidations(validations);
        return Object.values(validations).every(Boolean);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));

        if (name === "new_password") {
            validatePassword(value);
        }
    };

    const validateForm = () => {
        let newErrors = {};
        Object.keys(formData).forEach((key) => {
            if (!formData[key] || (typeof formData[key] === "string" && formData[key].trim() === "")) {
                newErrors[key] = " ";
            }
        });

        if (!validatePassword(formData.new_password)) {
            newErrors.new_password = " ";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrorMessage("Por favor, complete correctamente todos los campos.");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const response = await axios.post(
                `${API_URL}/users/change-password`,
                formData,
                {
                    headers: {
                        Authorization: `Token ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                setShowSuccessModal(true);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                let newErrors = {};
                if (error.response.data.current_password) {
                    newErrors.current_password = " ";
                    setErrorMessage(error.response.data.current_password[0]);
                }
                if (error.response.data.new_password) {
                    newErrors.new_password = " ";
                    setErrorMessage(error.response.data.new_password[0]);
                }
                if (error.response.data.confirm_password) {
                    newErrors.confirm_password = " ";
                    setErrorMessage(error.response.data.confirm_password[0]);
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
            <NavBar />
            <div className="w-full min-h-screen flex flex-col items-center pt-34 bg-white p-6">
                <div className="w-full max-w-3xl">
                    <h2 className="text-center text-2xl font-semibold text-[#365486] mb-2">
                        Formulario de Actualización de Contraseña
                    </h2>
                </div>
                <div className="bg-white p-6 w-full max-w-3xl">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                        <div className="relative w-full flex justify-center">
                            <InputItem
                                labelName={
                                    <>
                                        Contraseña actual <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                    </>
                                }
                                type={showPassword.current_password ? "text" : "password"}
                                name="current_password"
                                placeholder="Ingrese su contraseña actual"
                                value={formData.current_password}
                                onChange={handleChange}
                                maxLength={20}
                                error={errors.current_password}
                            />
                            <button
                                type="button"
                                className="absolute right-6 sm:right-15 top-8"
                                onClick={() =>
                                    setShowPassword((prev) => ({
                                        ...prev,
                                        current_password: !prev.current_password,
                                    }))
                                }
                            >
                                {showPassword.current_password ? (
                                    <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                                ) : (
                                    <EyeIcon className="h-6 w-6 text-gray-500" />
                                )}
                            </button>
                        </div>

                        <div className="relative w-full flex justify-center">
                            <InputItem
                                labelName={
                                    <>
                                        Nueva contraseña <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                    </>
                                }
                                type={showPassword.new_password ? "text" : "password"}
                                name="new_password"
                                placeholder="Ingrese su nueva contraseña"
                                value={formData.new_password}
                                onChange={handleChange}
                                maxLength={20}
                                error={errors.new_password}
                            />
                            <button
                                type="button"
                                className="absolute right-6 sm:right-15 top-8"
                                onClick={() =>
                                    setShowPassword((prev) => ({
                                        ...prev,
                                        new_password: !prev.new_password,
                                    }))
                                }
                            >
                                {showPassword.new_password ? (
                                    <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                                ) : (
                                    <EyeIcon className="h-6 w-6 text-gray-500" />
                                )}
                            </button>
                        </div>

                        <div className="relative w-full flex justify-center">
                            <InputItem
                                labelName={
                                    <>
                                        Confirmar nueva contraseña <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                    </>
                                }
                                type={showPassword.confirm_password ? "text" : "password"}
                                name="confirm_password"
                                placeholder="Repita su nueva contraseña"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                maxLength={20}
                                error={errors.confirm_password}
                            />
                            <button
                                type="button"
                                className="absolute right-6 sm:right-15 top-8"
                                onClick={() =>
                                    setShowPassword((prev) => ({
                                        ...prev,
                                        confirm_password: !prev.confirm_password,
                                    }))
                                }
                            >
                                {showPassword.confirm_password ? (
                                    <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                                ) : (
                                    <EyeIcon className="h-6 w-6 text-gray-500" />
                                )}
                            </button>
                        </div>


                        <div className="p-4">
                            <p className="text-sm font-semibold mb-2">Requisitos de contraseña:</p>
                            <ul className="mt-2 text-sm">
                                <li className={passwordValidations.length ? "text-black" : "text-black"}>
                                    {passwordValidations.length ? "✔" : "✖"} Máximo 20 caracteres, mínimo 8 caracteres
                                </li>
                                <li className={passwordValidations.uppercase ? "text-black" : "text-black"}>
                                    {passwordValidations.uppercase ? "✔" : "✖"} Al menos una letra mayúscula
                                </li>
                                <li className={passwordValidations.lowercase ? "text-black" : "text-black"}>
                                    {passwordValidations.lowercase ? "✔" : "✖"} Al menos una letra minúscula
                                </li>
                                <li className={passwordValidations.number ? "text-black" : "text-black"}>
                                    {passwordValidations.number ? "✔" : "✖"} Al menos un número
                                </li>
                                <li className={passwordValidations.specialChar ? "text-black" : "text-black"}>
                                    {passwordValidations.specialChar ? "✔" : "✖"} Al menos un carácter especial (@$!%*?&)
                                </li>
                            </ul>
                        </div>

                        {/* Contenedor para mensajes de error y botones */}
                        <div className="col-span-1 flex flex-col items-start mt-4">
                            {/* Mensajes de error */}
                            {errorMessage && (
                                <p className="text-[#F90000] text-sm mb-4 w-full">{errorMessage}</p>
                            )}

                            {/* Botones de acción */}
                            <div className="flex justify-between w-full">
                                <BackButton to="/home" text="Regresar" />
                                <button
                                    type="submit"
                                    className="bg-[#365486] text-white px-5 py-2 rounded-lg hover:bg-[#2f4275]"
                                >
                                    Actualizar
                                </button>
                            </div>
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
                    title="Contraseña actualizada"
                    btnMessage="Aceptar"
                >
                    <p>Su contraseña ha sido cambiada con éxito.</p>
                </Modal>
            </div>
        </div>
    );
};

export default UpdatedPassword;