import React, { useState, useEffect } from "react";
import { FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import { IoMdDownload, IoIosPlay } from "react-icons/io";
import NavBar from "../components/NavBar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";


const Perfil = () => {
    const [error, setError] = useState('');
    const [user, setUser] = useState(null); // Estado para almacenar los datos del usuario
    const [predios, setPredios] = useState([])
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_APP_API_URL;

    const fetchUserAndPredios = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("No hay sesión activa.");
                setLoading(false);
                return;
            }

            // Obtener perfil
            const userResponse = await axios.get(`${API_URL}/users/profile`, {
                headers: { Authorization: `Token ${token}` }
            });

            const userData = userResponse.data;
            setUser(userData);

            // Obtener todos los predios
            const prediosResponse = await axios.get(`${API_URL}/plot-lot/plots/list`, {
                headers: { Authorization: `Token ${token}` }
            });

            // Filtrar predios propios
            const userPredios = prediosResponse.data.filter(
                predio => predio.owner === userData.document
            );

            setPredios(userPredios);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.error || "Error al obtener datos");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserAndPredios();
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
                {}, // body vacío
                { headers: { Authorization: `Token ${token}` } }
            );

            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || "Error en el servidor");
        }
    };

    return (
        <div className="w-full h-fulL">
            <NavBar />
            <div className="w-full flex flex-col justify-center items-center mt-5">
                <div className="w-full min-h-screen flex flex-col items-center justify-center mt-20 sm:mt-0">
                    <div className="flex flex-col w-full items-center gap-2">
                        <h1 className="font-semibold text-3xl pb-3">Bienvenido(a), {user ? user.first_name + " " + user.last_name : "Cargando..."}</h1>
                        <div className="flex gap-5 bg-[#ebfdfd] px-10 py-2 rounded-lg">
                            <p className="text-gray-700 font-semibold">ID: {user ? user.document : "Cargando..."}</p>
                            <span>Persona {user ? user.person_type_name : "Cargando..."}</span>
                        </div>
                    </div>
                    <div className="w-full items-center justify-center flex flex-col sm:flex-row gap-5 mt-5">
                        <div className="w-[80%] sm:w-[20%] shadow-lg rounded-xl flex flex-col items-center py-5 bg-[#ebfdfd]">
                            <div className="flex justify-between items-center w-full px-5 mb-5">
                                <h1 className="font-semibold text-[#02474a]">MIS DATOS</h1>
                                <button className="bg-[#e57373] rounded-xl px-2 py-1 text-white hover:cursor-pointer" onClick={handleLogout}>Cerrar sesión</button>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full border-2 border-[#289a96] flex items-center justify-center">
                                    <FaUser size={50} className="text-[#289a96]" />
                                </div>
                            </div>

                            {user ? (
                                <>
                                    <h2 className="mt-4 text-xl font-bold text-gray-900">{user ? user.first_name + " " + user.last_name : "Cargando..."}</h2>
                                    <p className="text-gray-700 font-semibold">{user ? user.document : "Cargando..."}</p>

                                    <div className="flex flex-col mt-4 text-gray-700 space-y-2">
                                        <p className="flex items-center space-x-2">
                                            <FaEnvelope className="text-[#3597ab]" />
                                            <span>{user ? user.email : "Cargando..."}</span>
                                        </p>
                                        <p className="flex items-center  space-x-2">
                                            <FaPhone className="text-[#3597ab]" />
                                            <span>{user ? user.phone : "Cargando..."}</span>
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-600 mt-4">Cargando perfil...</p>
                            )}
                            <div className="flex flex-col items-center gap-5">
                                <button className="px-10 mt-4 bg-[#289a96] text-white py-2  hover:cursor-pointer rounded-lg"
                                    onClick={() => navigate('/perfil/actualizar-informacion')}>
                                    Editar perfil
                                </button>

                            </div>
                        </div>
                        <div className="w-[80%] sm:w-[20%] flex flex-col items-center gap-5">
                            <div className="bg-[#ebfdfd] w-full rounded-lg shadow-lg px-5 py-5">
                                <h1 className="text-[#02474a] font-semibold">GUÍA RÁPIDA DEL SISTEMA</h1>
                                <div className="flex flex-col">
                                    <button className="px-5 mt-4 bg-[#2ba19b] text-white py-2 hover:cursor-pointer rounded-lg flex items-center gap-5">
                                        <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                                            <IoMdDownload size={20} className="text-[#2ba19b]" />
                                        </div>
                                        Descargar PDF de guía
                                    </button>

                                    <a
                                        href="https://youtu.be/IOoFib27i6U"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 mt-4 bg-[#2ba19b] text-white py-2 hover:cursor-pointer rounded-lg flex items-center gap-5"
                                    >
                                        <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                                            <IoIosPlay size={20} className="text-[#2ba19b] text-center ml-0.5" />
                                        </div>
                                        Ver video informativo
                                    </a>

                                </div>
                            </div>
                            <div className="bg-[#ebfdfd] w-full rounded-lg shadow-lg px-5 py-5">
                                <h1 className="pb-5 text-[#02474a] font-semibold">MIS RESÚMENES</h1>
                                <div className="flex gap-2 w-full">
                                    <div className="w-[50%] h-25 flex flex-col items-center justify-center bg-[#ddf7e8] rounded-lg gap-1 px-2 sm:px-0">
                                        <h1 className="text-center font-semibold">Predios registrados</h1>
                                        <span>{predios.length}</span>
                                    </div>
                                    <button className="w-[50%] h-25 flex flex-col items-center justify-center bg-[#2ba19b] rounded-lg px-5 text-white font-semibold hover:cursor-pointer"
                                        onClick={() => navigate('/mispredios/:document')}>
                                        Ver mis predios y lotes
                                    </button>


                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Perfil;
