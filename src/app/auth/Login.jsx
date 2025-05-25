"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import InputItem from "../../components/InputItem";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { IoIosWarning, IoLogoWhatsapp, IoMdMail } from "react-icons/io";
import Modal from "../../components/Modal";
import { PiAsteriskSimpleBold } from "react-icons/pi";
import { ChevronLeft, ChevronRight, Mail, Phone } from "lucide-react";

// Simulando las imágenes del carrusel (reemplaza con tus rutas reales)
const carouselImages = [
  "/public/img/1.PNG?height=600&width=800",
  "/public/img/2c.png?height=600&width=800",
  "/public/img/3.PNG?height=600&width=800",
  "/public/img/4.PNG?height=600&width=800",
];

const Login = () => {
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({});
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_APP_API_URL;

  const inputRefs = useRef([]);

  // Carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + carouselImages.length) % carouselImages.length
    );
  };

  const openModal = (title, message, btnMessage, onCloseAction) => {
    setModalProps({
      title,
      children: message,
      btnMessage,
      onClose: onCloseAction,
    });
    setShowModal(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!document.trim() || !password.trim())
      return setError("¡Campos vacíos, por favor completarlos!");
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/users/login`, { document, password });

      openModal(
        "TOKEN ENVIADO",
        "Se ha enviado un token de 6 caracteres a tu correo electrónico registrado.",
        "CONFIRMAR",
        handleConfirm
      );
    } catch (err) {
      const errorMap = {
        400: Array.isArray(err.response?.data?.error?.detail)
          ? err.response.data.error.detail.join(" ")
          : err.response?.data?.error?.detail || "Solicitud incorrecta.",
        401: "Contraseña incorrecta.",
        403:
          err.response?.data?.error?.detail ||
          "Tu cuenta está inactiva. Contacta con soporte.",
        404: err.response?.data?.error?.details || "Usuario no encontrado.",
        429: "Demasiados intentos fallidos. Inténtalo más tarde.",
        500: "Error en el servidor. Inténtalo más tarde.",
      };

      setError(
        errorMap[err.response?.status] ||
          (err.request
            ? "Error de conexión. No se recibió respuesta del servidor."
            : "Error desconocido al procesar la solicitud.")
      );
      console.log(err);
    } finally {
      setIsLoading(false);
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleRequestNewToken = async () => {
    if (!document.trim() || !password.trim()) {
      setOtpError("¡Campos vacíos, por favor completarlos!");
      return;
    }
    startTimer();

    try {
      const response = await axios.post(`${API_URL}/users/generate-otp-login`, {
        document,
        password,
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

  const handleTokenSubmit = async () => {
    const otpValue = otp.join("").trim();
    if (!otpValue || !document.trim()) {
      setOtpError("¡Token no ingresado!");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/users/validate-otp`,
        { document: String(document), otp: otpValue },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refresh", response.data.refresh);
        openModal(
          "INICIO DE SESIÓN EXITOSO",
          "Bienvenido a la plataforma.",
          "CONTINUAR",
          () => navigate("/home")
        );
      } else {
        throw new Error("El token ingresado es incorrecto.");
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setOtpError(err.response.data?.detail || "Error al validar OTP");
      } else {
        setOtpError("Error de conexión con el servidor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "");
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[40%] relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={carouselImages[currentImageIndex] || "/placeholder.svg"}
            alt="AquaSmart"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Indicadores */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentImageIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Lado derecho - Tu formulario original */}
      <div className="w-full lg:w-[60%] h-full min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-10 px-4">
          <div className="flex justify-center">
            <img
              src="/img/logo.png"
              alt="Logo"
              className="w-[60%] lg:w-[50%]"
            />
          </div>

          {!showTokenForm ? (
            <div className="w-[83%] sm:w-[70%] lg:w-[60%] bg-[#ebfdfd] p-6 border-1 shadow-lg border-[#003F88] rounded-lg flex flex-col items-center">
              <h1 className="text-4xl font-bold pb-8 text-center">
                INICIO DE SESIÓN
              </h1>
              <form
                onSubmit={handleLogin}
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
                  type="text"
                  value={document}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setDocument(value);
                    }
                  }}
                  maxLength={12}
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
                <div className="flex flex-col items-center gap-2 mt-2">
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
                  disabled={isLoading}
                  className={`w-[50%] mt-4 bg-[#365486] text-white py-2 rounded-lg transition-all duration-300 ${
                    isLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-[#344663] hover:scale-105"
                  }`}
                >
                  {isLoading ? "INICIANDO SESIÓN..." : "INICIAR SESIÓN"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#ebfdfd] p-8 rounded-lg shadow-lg w-[90%] sm:w-[60%] md:w-[50%] lg:w-[56%] border border-blue-400 flex flex-col justify-center mx-auto items-center">
              <h2 className="text-2xl font-bold text-center">
                INGRESO DE TOKEN
              </h2>
              <p className="text-center mt-2">
                Introduce el token que fue enviado a tu correo electrónico.
              </p>

              {otpError && (
                <span className="w-[90%] text-md text-center py-1 my-2 bg-[#FFA7A9] rounded-lg text-gray-600 flex gap-5 items-center justify-center mx-auto px-5 whitespace-pre-line">
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
                    className="w-12 h-12 text-lg text-center border bg-white border-gray-400 rounded-md"
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
                  disabled={isLoading}
                  className={`bg-[#365486] text-white px-4 py-2 rounded-lg transition-all duration-300 ${
                    isLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-[#344663]"
                  }`}
                >
                  {isLoading ? "ENVIANDO..." : "ENVIAR"}
                </button>
              </div>
            </div>
          )}

          {showModal && <Modal showModal={showModal} {...modalProps} />}
        </div>

        <div className="w-full flex flex-col sm:flex-row px-10 py-4 sm:py-0 gap-3 bg-[#c9ebd7] h-auto sm:h-15 justify-between items-center mt-auto">
          <div className="flex items-center gap-2">
            <IoMdMail size={24} className="text-[#2ba19b]" />
            <span className="text-md font-medium text-gray-700">
              soporte@aquasmart.com
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IoLogoWhatsapp size={24} className=" text-[#2ba19b]" />
            <span className="text-md font-medium text-gray-700">
              +57 300 123 4567
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
