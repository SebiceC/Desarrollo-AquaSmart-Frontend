import React, { useState, useEffect } from "react";
import { FaUser, FaPhone, FaEnvelope, FaSignOutAlt } from "react-icons/fa";
import NavBar from "../components/NavBar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LogOut, Minus } from "lucide-react";


const Perfil = () => {
    const [error, setError] = useState('');
    const [user, setUser] = useState(null); // Estado para almacenar los datos del usuario
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_APP_API_URL;

    // Función para obtener los datos del usuario
    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("No hay sesión activa.");
                return;
            }

            const response = await axios.get(`${API_URL}/users/profile`, {
                headers: { Authorization: `Token ${token}` }
            });

            setUser(response.data); // Guardar los datos del usuario en el estado
        } catch (err) {
            setError(err.response?.data?.error || "Error al obtener el perfil");
        }
    };

    // Llamar a la función al montar el componente
    useEffect(() => {
        fetchProfile();
    }, []);

    // Función para cerrar sesión
    const handleLogout = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("No hay sesión activa.");
                return;
            }

            await axios.post(
                `${API_URL}/users/logout`,
                {},
                { headers: { Authorization: `Token ${token}` } }
            );

            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || "Error en el servidor");
        }
    };

    return (
        <div className="w-full min-h-screen bg-white">
            <NavBar />
            <div className="flex justify-center items-center h-[calc(100vh-4rem)] mt-16">
                <div className="bg-gray-200 rounded-2xl p-8 shadow-md w-80 text-center relative">
                    <div className="absolute top-4 right-4 text-gray-600 cursor-pointer flex flex-col items-center">
                        
                        <LogOut onClick={handleLogout} size={28} />
                        <span className="text-xs">Cerrar sesión</span>
                    </div>

                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <FaUser size={50} className="text-gray-500" />
                        </div>
                    </div>

                    {user ? (
                        <>
                            <h2 className="mt-4 text-xl font-bold text-gray-900">{user.first_name + " " + user.last_name}</h2>
                            <p className="text-gray-700 font-semibold">ID: {user.document}</p>

                            <div className="mt-4 text-gray-700 space-y-2">
                                <p className="flex items-center justify-center space-x-2">
                                    <FaUser className="text-gray-600" />
                                    <span>Persona: {user.person_type_name}</span>
                                </p>
                                <p className="flex items-center justify-center space-x-2">
                                    <FaPhone className="text-gray-600" />
                                    <span>{user.phone}</span>
                                </p>
                                <p className="flex items-center justify-center space-x-2">
                                    <FaEnvelope className="text-gray-600" />
                                    <span>{user.email}</span>
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-600 mt-4">Cargando perfil...</p>
                    )}
                    <div className="flex flex-col items-center gap-5">
                        <button className="w-[50%] mt-4 bg-[#365486] text-white py-2  hover:bg-[#344663]"
                            onClick={() => navigate('/perfil/actualizar-informacion')}>
                            Editar
                        </button>

                        <Minus className="w-full h-[2px] bg-gray-400" />

                        
                        <button className="w-[70%] bg-[#365486] text-white py-2 px-2 hover:bg-[#344663]    "
                            onClick={() => navigate('/mispredios/:document')}>
                            Ver mis predios y lotes
                        </button>

                    </div>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default Perfil;
