import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Obtener ID de la URL
import axios from "axios";
import NavBar from "../../../../components/NavBar";
import { FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import { IoDocument } from "react-icons/io5";
import { MdDownload } from "react-icons/md";

const API_URL = import.meta.env.VITE_APP_API_URL;

function UserInformation() {
  const { document } = useParams(); // Obtener el ID del usuario seleccionado
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token"); // Obtener el token desde localStorage

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/users/admin/update/${document}`,
          {
            headers: { Authorization: `Token ${token}` }, // Asegúrate de tener el token correctamente
          }
        );
        setUser(response.data); // Guardar el usuario en el estado
      } catch (err) {
        setError("No se pudo cargar la información del usuario.");
      }
    };
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${API_URL}/users/details/${document}`, {
                    headers: { Authorization: `Token ${token}` }, // Asegúrate de tener el token correctamente
                });
                setUser(response.data); // Guardar el usuario en el estado
            } catch (err) {
                setError("No se pudo cargar la información del usuario.");
            }
        };

    if (token) {
      fetchUser(); // Solo hacer la solicitud si el token existe
    } else {
      setError("Token de autenticación no encontrado.");
    }
  }, [document, token]); // Se ejecuta cada vez que cambia el ID o el token

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Cargando...</p>;

  return (
    <div className="w-full min-h-screen bg-white">
      <NavBar />
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] mt-16">
        <div className="bg-gray-200 rounded-2xl p-8 shadow-md w-[80%] lg:w-[35%] text-center relative">
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2 border-gray-400 flex items-center justify-center">
              <FaUser size={70} className="text-gray-500" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-700 font-semibold">ID: {user.document}</p>
          </div>

          <div className="mt-12 flex-row lg:flex flex-col justify-center gap-20 space-y-10 lg:space-y-0">
            {/* Información del usuario */}
            <div className="space-y-3 text-left flex flex-col">
              <p className="flex items-center space-x-2">
                <FaUser className="text-gray-600" />
                <span>
                  {user.person_type || "Tipo de usuario no disponible"}
                </span>
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
                    <div className="mt-12 flex-row lg:flex flex-col justify-center gap-20 space-y-10 lg:space-y-0">
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
              <p className="flex items-center font-semibold">
                <IoDocument className="text-gray-600 mr-2" /> Anexos
              </p>
              <div className="mt-2 space-y-2">
                {user.files && user.files.length > 0 ? (
                  user.files.map((file, index) => (
                    <p
                      key={index}
                      className="flex items-center space-x-2 text-blue-600 cursor-pointer"
                    >
                      <span>{file}</span>
                      <MdDownload className="text-gray-600" />
                    </p>
                  ))
                ) : (
                  <p className="text-gray-600">No hay archivos anexos.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
                        {/* Anexos del usuario */}
                        <div className="text-left">
                            <p className="flex items-center font-semibold">
                                <IoDocument className="text-gray-600 mr-2" /> Anexos
                            </p>
                            <div className="mt-2 space-y-2">
                                <span>{user.drive_folder_id || "Carpeta no disponible"}</span>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default UserInformation;
