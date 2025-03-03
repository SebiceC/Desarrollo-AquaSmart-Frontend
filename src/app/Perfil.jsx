import React from "react";
import { FaUser, FaPhone, FaEnvelope, FaSignOutAlt } from "react-icons/fa";
import NavBar from "../components/NavBar";


const Perfil = () => {

    return (
        <div className="w-full min-h-screen bg-white">
            <NavBar />
            <div className="flex justify-center items-center h-[calc(100vh-4rem)] mt-16">
                <div className="bg-gray-200 rounded-2xl p-8 shadow-md w-80 text-center relative">
                    <div className="absolute top-4 right-4 text-gray-600 cursor-pointer hover:text-gray-800">
                        <FaSignOutAlt size={20} />
                    </div>

                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <FaUser size={50} className="text-gray-500" />
                        </div>
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-gray-900">Ferley Medina</h2>
                    <p className="text-gray-700 font-semibold">ID: 55162345</p>

                    <div className="mt-4 text-gray-700 space-y-2">
                        <p className="flex items-center justify-center space-x-2">
                            <FaUser className="text-gray-600" />
                            <span>Persona natural</span>
                        </p>
                        <p className="flex items-center justify-center space-x-2">
                            <FaPhone className="text-gray-600" />
                            <span>+57 3152349526</span>
                        </p>
                        <p className="flex items-center justify-center space-x-2">
                            <FaEnvelope className="text-gray-600" />
                            <span>luismedina@gmail.com</span>
                        </p>
                    </div>

                    <button className="w-[50%] mt-4 bg-[#365486] text-white py-2 rounded-lg hover:bg-[#344663] hover:scale-105 transition-all duration-300">
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Perfil;
