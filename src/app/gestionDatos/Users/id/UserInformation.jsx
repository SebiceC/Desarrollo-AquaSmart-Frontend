"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom" // Obtener ID de la URL
import axios from "axios"
import NavBar from "../../../../components/NavBar"
import { FaUser, FaPhone, FaEnvelope } from "react-icons/fa"
import { IoDocument } from "react-icons/io5"
import BackButton from "../../../../components/BackButton"

const API_URL = import.meta.env.VITE_APP_API_URL

function UserInformation() {
    const { document } = useParams() // Obtener el ID del usuario seleccionado
    const [user, setUser] = useState(null)
    const [error, setError] = useState("")

    const token = localStorage.getItem("token") // Obtener el token desde localStorage

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${API_URL}/users/details/${document}`, {
                    headers: { Authorization: `Token ${token}` }, // Asegúrate de tener el token correctamente
                })
                setUser(response.data) // Guardar el usuario en el estado
            } catch (err) {
                setError("No se pudo cargar la información del usuario.")
            }
        }

        if (token) {
            fetchUser() // Solo hacer la solicitud si el token existe
        } else {
            setError("Token de autenticación no encontrado.")
        }
    }, [document, token]) // Se ejecuta cada vez que cambia el ID o el token

    if (error) return <p className="text-red-500">{error}</p>
    if (!user) return <p>Cargando...</p>

    return (
        <div className="w-full min-h-screen bg-white">
            <NavBar />
            <div className="flex flex-col items-center justify-center pt-34 px-4">
                <div className="bg-gray-200 rounded-2xl p-8 shadow-md w-full max-w-2xl text-center relative mb-8">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <FaUser size={70} className="text-gray-500" />
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-gray-900">
                            {user.first_name} {user.last_name}
                        </h2>
                        <p className="text-gray-700 font-semibold">ID: {user.document}</p>
                    </div>

                    <div className="mt-12 flex flex-col lg:flex-row justify-center gap-8 lg:gap-20">
                        {/* Información del usuario */}
                        <div className="space-y-3 text-left flex flex-col">
                            <p className="flex items-center space-x-2">
                                <FaUser className="text-gray-600" />
                                <span>Persona: {user.person_type_name || "Tipo de usuario no disponible"}</span>
                            </p>
                            <p className="flex items-center space-x-2">
                                <FaPhone className="text-gray-600" />
                                <span>{user.phone || "No disponible"}</span>
                            </p>
                            <p className="flex items-center space-x-2">
                                <FaEnvelope className="text-gray-600" />
                                <span>{user.email || "Correo no disponible"}</span>
                            </p>
                        </div>

                        {/* Anexos del usuario */}
                        <div className="text-left">
                            <p className="flex items-center font-semibold mb-2 lg:ml-5">
                                <IoDocument className="text-gray-600 mr-2" /> Anexos
                            </p>
                            <div className="mt-2">
                                {user.drive_folder_id ? (
                                    <a
                                        href={`https://drive.google.com/drive/u/1/folders/${user.drive_folder_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 text-black hover:underline"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-2"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        Ver documentos en Google Drive
                                    </a>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No hay documentos disponibles.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full max-w-2xl flex justify-start mt-5">
                        <BackButton to="/gestionDatos/users" text="Regresar a la lista" />
                    </div>
                </div>

                {/* Botón de regreso */}
            </div>
        </div>
    )
}

export default UserInformation

