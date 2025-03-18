import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputItem from '../../components/InputItem';
import { useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { PiAsteriskSimpleBold } from 'react-icons/pi';
import Modal from '../../components/Modal';




const RecoverPassword = () => {
    const [document, setDocument] = useState('');
    const [formData, setFormData] = useState({
        new_password: "",
        confirm_password: "",
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const documentParam = params.get('document');

    const API_URL = import.meta.env.VITE_APP_API_URL;

    const openModal = (title, message, btnMessage, onCloseAction) => {
        setModalProps({
            title,
            children: message,
            btnMessage,
            onClose: onCloseAction,
        });
        setShowModal(true);
    };

    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
    });

    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 8 && password.length <= 20,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            specialChar: /[!@#$%^&*()_+-={}|:;"'<>,.?/]/.test(password),
        };

        setPasswordValidations(validations);

        return Object.values(validations).every(Boolean);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === "new_password") {
            validatePassword(value);
        }
    };



    useEffect(() => {
        if (documentParam) {
            setDocument(documentParam);
        } else {
            setError('No se encontró el documento.');
        }
    }, [documentParam]);

    const handleRecover = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const { new_password, confirm_password } = formData;

        if (!validatePassword(new_password)) {
            setError(
                "La contraseña debe cumplir con todos los requisitos."
            );
            return;
        }

        if (new_password !== confirm_password) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        try {
            await axios.post(`${API_URL}/users/reset-password`, {
                document,
                new_password
            });
            openModal(
                "CAMBIO DE CONTRASEÑA EXITOSO",
                "",
                "INICIAR SESIÓN",
                () => navigate("/login") // Redirigir al cerrar el modal
            );
            setSuccess('Contraseña restablecida correctamente.');
        } catch (err) {
            if (err.response) {
                const errorData = err.response.data;
                if (errorData.detail) {
                    setError(errorData.detail);  // Captura el mensaje de error general
                } else if (typeof errorData === 'object') {
                    const errorMessages = Object.values(errorData).flat().join(' ');
                    setError(errorMessages);  // Convierte múltiples errores en un solo string
                } else {
                    setError('Error en el servidor.');
                }
            } else if (err.request) {
                setError('No hay respuesta del servidor. Verifica tu conexión.');
            } else {
                setError('Error desconocido. Intenta de nuevo.');
            }
        }
    };

    return (
        <div className='w-full h-full min-h-screen bg-[#DCF2F1] flex flex-col items-center justify-center gap-10 py-5'>
            <div className='flex justify-center'>
                <img src="/img/logo.png" alt="Logo" className='w-[60%] lg:w-[50%]' />
            </div>
            <div className="w-[83%] sm:w-[70%] lg:w-[30%] bg-white p-6 border-1 border-[#003F88] rounded-lg mx-auto flex flex-col justify-center items-center">
                <h1 className='text-4xl font-bold pb-8 text-center'>CAMBIO DE CONTRASEÑA</h1>

                {error && (
                    <span className='w-[80%] text-md text-center py-1 mb-2 bg-[#FFA7A9] rounded-lg text-gray-600'>
                        {error}
                    </span>
                )}
                {success && <p className="text-green-500 text-sm">{success}</p>}

                <form className='flex flex-col items-center w-full' onSubmit={handleRecover}>
                    <InputItem
                        id="document"
                        placeholder="Cargando documento..."
                        type="text"
                        value={document}
                        disabled={true}
                        className="hidden" // Bloquea el campo
                    />
                    <div className="relative w-full flex justify-center">
                        <InputItem
                            id="new_password"
                            name="new_password"
                            labelName={
                                <>
                                    Nueva contraseña <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                </>
                            }
                            placeholder="Ingresa la nueva contraseña"
                            type={showPassword ? "text" : "password"}
                            value={formData.new_password}
                            onChange={handleChange}
                            maxLength={20}
                        />
                        <button
                            type="button"
                            className="absolute right-10 sm:right-12 top-8"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                            ) : (
                                <EyeIcon className="h-6 w-6 text-gray-500" />
                            )}
                        </button>
                    </div>
                    <div className="relative w-full flex justify-center">
                        <InputItem
                            id="confirm_password"
                            name="confirm_password"
                            labelName={
                                <>
                                    Confirmar contraseña <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                                </>
                            }
                            placeholder="Confirma la contraseña"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirm_password}
                            onChange={handleChange}
                            maxLength={20}
                        />
                        <button
                            type="button"
                            className="absolute right-10 sm:right-12 top-8"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                            ) : (
                                <EyeIcon className="h-6 w-6 text-gray-500" />
                            )}
                        </button>

                    </div>
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

                    <button type="submit" className="w-[50%] sm:w-[48%] mt-4 bg-[#365486] text-white font-semibold py-2 px-2 rounded-lg hover:bg-[#344663] hover:scale-105 transition-all duration-300 ease-in-out">
                        GUARDAR CONTRASEÑA
                    </button>
                </form>
            </div>
            {showModal && <Modal showModal={showModal} {...modalProps} />}
        </div>
    );
};

export default RecoverPassword;
