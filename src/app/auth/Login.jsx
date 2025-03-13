import React, { useState, useEffect } from "react";
import axios from "axios";
import InputItem from "../../components/InputItem";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { IoIosWarning } from "react-icons/io";
import Modal from "../../components/Modal";
import { PiAsteriskSimpleBold } from "react-icons/pi";

const Login = () => {
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({});
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_APP_API_URL;
  //var API_URL = process.env.VITE_APP_API_URL || "http://localhost:5173"; // var de pruebas

  const openModal = (title, message, btnMessage, onCloseAction) => {
    setModalProps({
      title,
      children: message,
      btnMessage,
      onClose: onCloseAction,
    });
    setShowModal(true);
  };
  // Función para manejar el login con validaciones
  const handleLogin = async (e) => {
    e.preventDefault();

    // Validación de campos vacíos
    if (!document.trim() || !password.trim()) {
      setError("¡Campos vacíos, por favor completarlos!");
      return;
    }

    setError(""); // Limpiar error anterior

    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        document,
        password,
      });

      openModal(
        "TOKEN ENVIADO",
        "Se ha enviado un token de 6 caracteres a tu número de teléfono registrado.",
        "CONFIRMAR",
        handleConfirm
      );
    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          setError(err.response.data.error.detail);
        } else if (err.response.status === 401) {
          setError("Contraseña incorrecta.");
        } else if (err.response.status === 404) {
          setError("Usuario no encontrado.");
        } else if (err.response.status === 500) {
          setError("Error en el servidor. Inténtalo más tarde.");
        }
      } else {
        setError("Error de conexión.");
      }
      console.log(err);
    }
  };

  // Manejar la confirmación del modal para mostrar el formulario de token
  const handleConfirm = () => {
    setShowModal(false);
    setShowTokenForm(true);
    startTimer();
  };

  // Iniciar el temporizador de 5 minutos
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

  // Manejar el envío del token
  const handleTokenSubmit = async () => {
    if (!otp.trim() || !document.trim()) {
      setOtpError("¡Token no ingresado!");
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/users/validate-otp`,
        { document: String(document), otp },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refresh", response.data.refresh);
        openModal(
          "INICIO DE SESIÓN EXITOSO",
          "Bienvenido a la plataforma.",
          "CONTINUAR",
          () => navigate("/home") // Redirigir al cerrar el modal
        );
      } else {
        throw new Error("El token ingresado es incorrecto.");
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

  return (
    <div className="w-full h-full min-h-screen bg-[#DCF2F1] flex flex-col items-center justify-center gap-10">
      <div className="flex justify-center">
        <img src="/img/logo.png" alt="Logo" className="w-[60%] lg:w-[50%]" />
      </div>

      {!showTokenForm ? (
        <div className="w-[83%] sm:w-[70%] lg:w-[30%] bg-white p-6 border-1 border-[#003F88] rounded-lg flex flex-col items-center">
          <h1 className="text-4xl font-bold pb-8 text-center">
            INICIO DE SESIÓN
          </h1>
          <form
            onSubmit={handleLogin}
            className="flex flex-col items-center w-full"
          >
            {error && (
              <span className="w-[83%] text-md text-center py-1 mb-2 bg-[#FFA7A9] rounded-lg text-gray-600 flex gap-5 items-center justify-center mx-auto px-5">
                <IoIosWarning size={26} />
                {error}
                <IoIosWarning size={26} />
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
              type="text"
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
            <div className="relative w-full flex justify-center">
              <InputItem
                id="password"
                labelName={
                  <>
                    Contraseña{" "}
                    <PiAsteriskSimpleBold
                      size={12}
                      className="inline text-red-500"
                    />
                  </>
                }
                placeholder="Ingresa tu contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <div className="flex flex-col items-center gap-2">
              <a
                href="/forgotPassword"
                className="font-semibold text-sm hover:underline"
              >
                OLVIDÉ MI CONTRASEÑA
              </a>
              <a
                href="/preRegister"
                className="font-semibold text-sm hover:underline"
              >
                SOY USUARIO NUEVO
              </a>
            </div>
            <button
              type="submit"
              className="w-[50%] mt-4 bg-[#365486] text-white py-2 rounded-lg hover:bg-[#344663] hover:scale-105 transition-all duration-300"
            >
              INICIAR SESIÓN
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-lg w-[400px] border border-blue-400 flex flex-col justify-center mx-auto items-center">
          <h2 className="text-2xl font-bold text-center">INGRESO DE TOKEN</h2>
          <p className="text-center mt-2">
            Introduce el token que fue enviado por SMS a tu teléfono.
          </p>

          {otpError && (
            <span className="w-full text-md text-center py-1 my-2 bg-[#FFA7A9] rounded-lg text-gray-600 flex gap-3 items-center justify-center mx-auto px-5">
              <IoIosWarning size={26} />
              {otpError}
              <IoIosWarning size={26} />
            </span>
          )}
          <div className="flex justify-center gap-2 mt-4">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="tel" // Asegura que solo se ingresen números en móviles
                maxLength="1"
                className="w-12 h-12 text-center border border-gray-400 rounded-md"
                value={otp[i] || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // Elimina cualquier caracter no numérico
                  let newOtp = otp.split("");
                  newOtp[i] = value;
                  setOtp(newOtp.join("").trim());
                }}
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
              onClick={startTimer}
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
export default Login;
