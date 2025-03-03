import React, { useState, useEffect } from 'react'
import InputItem from '../../components/InputItem'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {

    const [document, setDocument] = useState('');
    const [phone, setPhone] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showTokenForm, setShowTokenForm] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [isDisabled, setIsDisabled] = useState(false);
    const navigate = useNavigate();



    const API_URL = import.meta.env.VITE_APP_API_URL;

    

    const handleReset = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${API_URL}/users/generate-otp`, {
                document,
                phone
            });
            if (response.data.error) {
                throw new Error(response.data.error);
            }

            setShowModal(true);
        } catch (err) {
            if (err.response) {
                setError(err.response.data.error || 'Error en el servidor');
            } else if (err.request) {
                setError('No hay respuesta del servidor. Verifica tu conexión.');
            } else {
                setError('Error desconocido. Intenta de nuevo.');
            }
        }
    };

    const handleConfirm = () => {
        setShowModal(false);
        setShowTokenForm(true);
        startTimer();

    };

    const startTimer = () => {
        setTimeLeft(300);
        setIsDisabled(true);
    };

    // Manejar la cuenta regresiva
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setIsDisabled(false);
        }
    }, [timeLeft]);

    // Formatear tiempo en MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // Manejo de validación del token
    const handleTokenSubmit = async () => {
        try {
            const response = await axios.post(`${API_URL}/users/validate-otp`, {
                document,
                otp
            });
            navigate(`/recoverPassword?document=${document}`);

            if (response.data.access) {
                localStorage.setItem('token', response.data.access);
                localStorage.setItem('refresh', response.data.refresh);
            }
        } catch (err) {
            setOtpError(err.response?.data?.error || 'Error al validar el token, intenta nuevamente.');
        }
    };

    return (
        <div className="w-full h-full min-h-screen bg-[#DCF2F1] flex flex-col items-center justify-center gap-10">
            <div className='flex justify-center'>
                <img src="/img/logo.png" alt="Logo" className='w-[60%] lg:w-[50%]' />
            </div>

            {!showTokenForm ? (
                <div className="w-[70%] lg:w-[30%] bg-white p-6 border-1 border-[#003F88] rounded-lg mx-auto flex flex-col justify-center items-center">
                    <h1 className='text-4xl font-bold pb-8 text-center'>RECUPERACIÓN DE CONTRASEÑA</h1>
                    <p className='text-justify w-[85%] pb-5'>Introduce tu cédula de ciudadanía y teléfono, para solicitar un token y recuperar tu contraseña.</p>
                    <form onSubmit={handleReset} className='flex flex-col items-center w-full'>
                        {error && (
                            <span className='w-[80%] text-md text-center py-1 mb-2 bg-[#FFA7A9] rounded-lg text-gray-600'>
                                {error}
                            </span>
                        )}
                        <InputItem
                            id="document"
                            labelName="Cédula de Ciudadanía"
                            placeholder="Ingresa tu Cédula de Ciudadanía"
                            type="string"
                            value={document}
                            onChange={(e) => setDocument(e.target.value)}
                        />
                        <InputItem
                            id="phone"
                            labelName="Teléfono"
                            placeholder="Ingresa tu teléfono"
                            type="string"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <button type="submit" className="w-[50%] sm:w-[45%] mt-4 bg-[#365486] text-white py-2 rounded-lg hover:bg-[#344663] hover:scale-105 transition-all duration-300 ease-in-out">
                            Solicitar Token
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-lg shadow-lg w-[400px] border border-blue-400">
                    <h2 className="text-2xl font-bold text-center">INGRESO DE TOKEN</h2>
                    <p className="text-center mt-2">Introduce el token que fue enviado por SMS a tu teléfono.</p>

                    {otpError && (
                        <span className='w-[80%] text-md text-center py-1 px-3 mb-2 bg-[#FFA7A9] rounded-lg text-gray-600'>
                            {otpError}
                        </span>
                    )}
                    <div className="flex justify-center gap-2 mt-4">
                        {[...Array(6)].map((_, i) => (
                            <input
                                key={i}
                                type="string"
                                maxLength="1"
                                className="w-12 h-12 text-center border border-gray-400 rounded-md"
                                value={otp[i] || ''}
                                onChange={(e) => {
                                    let newOtp = otp.split('');
                                    newOtp[i] = e.target.value;
                                    setOtp(newOtp.join('').trim());
                                }}
                            />
                        ))}
                    </div>

                    <p className="text-center text-gray-600 mt-2">
                        {timeLeft > 0 ? `Tiempo restante: ${formatTime(timeLeft)}` : "Puedes solicitar un nuevo token"}
                    </p>

                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            onClick={startTimer}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 ${isDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-[#365486] hover:bg-[#344663]"
                                }`}
                        >
                            SOLICITAR NUEVO TOKEN
                        </button>
                        <button onClick={handleTokenSubmit} className="bg-[#365486] text-white px-4 py-2 rounded-lg hover:bg-[#344663]">
                            ENVIAR
                        </button>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[400px]">
                        <h2 className="text-xl font-bold mb-4">TOKEN ENVIADO</h2>
                        <p>Se ha enviado un token de 6 caracteres a tu número de teléfono registrado.</p>
                        <button onClick={handleConfirm} className="bg-[#365486] text-white px-4 py-2 rounded-lg hover:bg-[#344663]">
                            CONFIRMAR
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ForgotPassword
