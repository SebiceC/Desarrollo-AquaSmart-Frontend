import React, { useState, useEffect, useRef } from "react";
import InputItem from "../../components/InputItem";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PiAsteriskSimpleBold } from "react-icons/pi";
import Modal from "../../components/Modal";
import { IoIosWarning } from "react-icons/io";

const ForgotPassword = () => {
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({});
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_APP_API_URL;
  // var API_URL = process.env.VITE_APP_API_URL || "http://localhost:5173"; // var de pruebas
  const inputRefs = useRef([]);

  const openModal = (title, message, btnMessage, onCloseAction) => {
    setModalProps({
      title,
      children: message,
      btnMessage,
      onClose: onCloseAction,
    });
    setShowModal(true);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!document.trim() || !phone.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/users/generate-otp`, {
        document,
        phone,
      });

      openModal(
        "TOKEN ENVIADO",
        "Se ha enviado un token de 6 caracteres a tu correo electrónico registrado.",
        "CONFIRMAR",
        handleConfirm
      );
      if (response.data.error) {
        throw new Error(response.data.error);
      }
    } catch (err) {
      if (err.response) {
        const errorData = err.response.data;

        if (errorData.phone) {
          setError(errorData.phone);
        } else if (errorData.error) {
          setError(errorData.error);
        } else {
          setError("Error desconocido en la validación.");
        }
      } else if (err.request) {
        setError("No hay respuesta del servidor. Verifica tu conexión.");
      } else {
        setError("Error desconocido. Intenta de nuevo.");
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

  const handleRequestNewToken = async () => {
    if (!document.trim() || !phone.trim()) {
      setOtpError("¡Campos vacíos, por favor completarlos!");
      return;
    }
    startTimer();

    try {
      const response = await axios.post(`${API_URL}/users/generate-otp`, {
        document,
        phone,
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }
    } catch (err) {
      openModal(
        "ERROR",
        "Error al generar token, intente mas tarde!.",
        "ACEPTAR",
        handleConfirm
      );
      if (err.response) {
        setOtpError(err.response.data.error || "Error en el servidor");
      } else if (err.request) {
        setOtpError("No hay respuesta del servidor. Verifica tu conexión.");
      } else {
        setOtpError("Error desconocido. Intenta de nuevo.");
      }
    }
  };

  // Manejo de validación del token
  const handleTokenSubmit = async () => {
    const otpValue = otp.join("").trim(); // Convierte el array en string

    if (!otpValue || !document.trim()) {
      setOtpError("¡Token no ingresado!");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/users/validate-otp`,
        { document: String(document), otp: otpValue },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        // Solo navega si el backend responde con éxito
        navigate(`/recoverPassword?document=${document}`);
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          console.error("Error del servidor:", err.response.data);
          setOtpError(err.response.data?.detail || "Error al validar OTP");
        }
      } else {
        setOtpError("Error de conexión con el servidor");
      }
    }
  };

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, ""); // Solo números
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (index < 5 && value) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#DCF2F1] flex flex-col items-center justify-center gap-10">
      <div className="flex justify-center">
        <img src="/img/logo.png" alt="Logo" className="w-[60%] lg:w-[50%]" />
      </div>

      {!showTokenForm ? (
        <div className="w-[83%] sm:w-[70%] lg:w-[30%] bg-white p-6 border-1 border-[#003F88] rounded-lg mx-auto flex flex-col justify-center items-center">
          <h1 className="text-4xl font-bold pb-8 text-center">
            RECUPERACIÓN DE CONTRASEÑA
          </h1>
          <p className="text-justify w-[85%] pb-5">
            Introduce tu cédula de ciudadanía y teléfono, para solicitar un
            token y recuperar tu contraseña.
          </p>
          <form
            onSubmit={handleReset}
            className="flex flex-col items-center w-full"
          >
            {error && (
              <span className="w-[83%] text-sm text-center py-1 mb-2 bg-[#FFA7A9] rounded-lg text-gray-600 flex gap-5 items-center justify-center mx-auto px-5 whitespace-pre-line">
                <IoIosWarning size={26} className="flex-shrink-0" />
                {error}
                <IoIosWarning size={26} className="flex-shrink-0" />
              </span>
            )}
            <InputItem
              id="document"
              labelName={
                <>
                  Cédula de Ciudadanía{" "}
                  <PiAsteriskSimpleBold
                    size={12}
                    className="inline text-red-500"
                  />
                </>
              }
              placeholder="Ingresa tu Cédula de Ciudadanía"
              type="string"
              value={document}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir solo números y limitar el tamaño
                if (/^\d*$/.test(value)) {
                  setDocument(value);
                }
              }}
              maxLength={11}
            />
            <InputItem
              id="phone"
              labelName={
                <>
                  Teléfono{" "}
                  <PiAsteriskSimpleBold
                    size={12}
                    className="inline text-red-500"
                  />
                </>
              }
              placeholder="Ingresa tu teléfono"
              type="string"
              value={phone}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir solo números y limitar el tamaño
                if (/^\d*$/.test(value)) {
                  setPhone(value);
                }
              }}
              maxLength={10}
            />
            <button
              type="submit"
              className="w-[50%] sm:w-[45%] mt-4 bg-[#365486] text-white font-semibold py-2 px-2 rounded-lg hover:bg-[#344663] hover:scale-105 transition-all duration-300 ease-in-out"
            >
              SOLICITAR TOKEN
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-lg w-[90%] sm:w-[60%] md:w-[40%] lg:w-[28%] border border-blue-400 flex flex-col justify-center mx-auto items-center">
          <h2 className="text-2xl font-bold text-center">INGRESO DE TOKEN</h2>
          <p className="text-center mt-2">
            Introduce el token que fue enviado por SMS a tu teléfono.
          </p>

          {otpError && (
            <span className="w-full text-sm text-center py-1 my-2 bg-[#FFA7A9] rounded-lg text-gray-600 flex gap-5 items-center justify-center mx-auto px-5 whitespace-pre-line">
              <IoIosWarning size={26} className="flex-shrink-0" />
              {otpError}
              <IoIosWarning size={26} className="flex-shrink-0" />
            </span>
          )}
          <div className="flex justify-center gap-1 mt-4">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="tel"
                maxLength="1"
                className="w-12 h-12 text-lg text-center border border-gray-400 rounded-md"
                value={otp[i] || ""}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
              />
            ))}
          </div>

          <p className="text-center text-gray-600 mt-2">
            {timeLeft > 0
              ? `Tiempo restante: ${formatTime(timeLeft)}`
              : "Puedes solicitar un nuevo token"}
          </p>

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleRequestNewToken}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 ${
                isDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#365486] hover:bg-[#344663]"
              }`}
            >
              SOLICITAR NUEVO TOKEN
            </button>
            <button
              onClick={handleTokenSubmit}
              className="bg-[#365486] text-white px-4 py-2 rounded-lg hover:bg-[#344663]"
            >
              ENVIAR
            </button>
          </div>
        </div>
      )}

      {showModal && <Modal showModal={showModal} {...modalProps} />}
    </div>
  );
};

export default ForgotPassword;
