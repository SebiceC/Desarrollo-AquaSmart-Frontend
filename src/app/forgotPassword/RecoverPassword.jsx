import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputItem from '../../components/InputItem';
import { useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';


const API_URL = import.meta.env.VITE_APP_API_URL;

const RecoverPassword = () => {
    const [document, setDocument] = useState('');
    const [new_password, setNewPassword] = useState('');
    const [confirm_password, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();


    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const documentParam = params.get('document');

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

        if (new_password !== confirm_password) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        try {
            await axios.post(`${API_URL}/users/reset-password`, {
                document,
                new_password
            });

            setSuccess('Contraseña restablecida correctamente.');
            setNewPassword('');
            setConfirmPassword('');
            navigate('/login')
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
        <div className='w-full h-full min-h-screen bg-[#DCF2F1] flex flex-col items-center justify-center gap-10'>
            <div className='flex justify-center'>
                <img src="/img/logo.png" alt="Logo" className='w-[60%] lg:w-[50%]' />
            </div>
            <div className="w-[70%] lg:w-[30%] bg-white p-6 border-1 border-[#003F88] rounded-lg mx-auto flex flex-col justify-center items-center">
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
                        labelName="Documento"
                        placeholder="Cargando documento..."
                        type="text"
                        value={document}
                        disabled={true} // Bloquea el campo
                    />
                    <div className="relative w-full flex justify-center">
                        <InputItem
                            id="new_password"
                            labelName="Nueva contraseña"
                            placeholder="Ingresa tu nueva contraseña"
                            type="password"
                            value={new_password}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-12 top-8"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeSlashIcon className="h-6 w-6 text-gray-500" /> : <EyeIcon className="h-6 w-6 text-gray-500" />}
                        </button>
                    </div>
                    <div className="relative w-full flex justify-center">
                        <InputItem
                            id="confirm_password"
                            labelName="Confirma tu contraseña"
                            placeholder="Confirma tu nueva contraseña"
                            type="password"
                            value={confirm_password}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-12 top-8"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeSlashIcon className="h-6 w-6 text-gray-500" /> : <EyeIcon className="h-6 w-6 text-gray-500" />}
                        </button>
                    </div>

                    <button type="submit" className="w-[50%] sm:w-[45%] mt-4 bg-[#365486] text-white py-2 px-2 rounded-lg hover:bg-[#344663] hover:scale-105 transition-all duration-300 ease-in-out">
                        GUARDAR CONTRASEÑA
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RecoverPassword;
