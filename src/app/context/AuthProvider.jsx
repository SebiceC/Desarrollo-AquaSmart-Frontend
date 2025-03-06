import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const API_URL = import.meta.env.VITE_APP_API_URL; // Obtener la URL de la API desde las variables de entorno

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState(""); // Mensaje dinámico del modal
    const [sessionPreviouslyActive, setSessionPreviouslyActive] = useState(false); // Saber si el usuario tenía sesión

    useEffect(() => {
        const validateSession = async () => {
            const token = localStorage.getItem("token");

            // Si nunca ha iniciado sesión, no mostrar el modal
            if (token === null) {
                return;
            }

            // Marcar que el usuario tenía sesión previamente
            setSessionPreviouslyActive(true);

            if (!token) {
                console.warn("No hay token disponible. Mostrando modal de sesión cerrada.");
                setModalMessage("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
                setShowModal(true);
                return;
            }

            try {
                await axios.get(`${API_URL}/users/validate-token`, {
                    headers: { Authorization: `Token ${token}` },
                });

                // Si la respuesta es 200, la sesión sigue activa y no hacemos nada
            } catch (error) {
                if (error.response) {
                    const statusCode = error.response.status;
                    const errorMessage = error.response.data?.detail || "Error desconocido";

                    if (statusCode === 401) {
                        console.warn("Sesión cerrada en otro dispositivo.");
                        setModalMessage("Tu sesión ha sido cerrada porque iniciaste sesión en otro dispositivo.");
                    } else {
                        console.error("Error en la validación de sesión:", errorMessage);
                        setModalMessage("Error inesperado. Intenta iniciar sesión nuevamente.");
                    }

                    // Solo mostrar el modal si el usuario tenía sesión activa previamente
                    if (sessionPreviouslyActive) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("refresh");
                        setShowModal(true);
                    }
                }
            }
        };

        // Validar sesión inmediatamente al cargar la app
        validateSession();

        // Verificar sesión periódicamente cada 20 minutos
        const interval = setInterval(validateSession, 1200000);
        return () => clearInterval(interval);
    }, [sessionPreviouslyActive]);

    return (
        <AuthContext.Provider value={{ showModal, setShowModal }}>
            {children}

            {/* MODAL GLOBAL */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[400px]">
                        <h2 className="text-xl font-bold mb-4 text-red-600">SESIÓN FINALIZADA</h2>
                        <p>{modalMessage}</p>
                        <button
                            onClick={() => (window.location.href = "/login")}
                            className="bg-[#365486] text-white px-4 py-2 rounded-lg hover:bg-[#344663]"
                        >
                            VOLVER A INICIAR SESIÓN
                        </button>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

// Validación de `children` con PropTypes
AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

// Hook para acceder al contexto
export const useAuth = () => useContext(AuthContext);
