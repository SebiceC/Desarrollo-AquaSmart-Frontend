import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NavBar from "../../../components/NavBar";

const PreRegistrosList = () => {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_APP_API_URL;
        const response = await axios.get(`${API_URL}/users/admin/listed`, {
          headers: { Authorization: `Token ${token}` },
        });

        console.log("Respuesta del servidor:", response.data);
        setRegistros(response.data);
      } catch (err) {
        console.error("Error al obtener los pre-registros:", err);
        setError("No se pudieron cargar los pre-registros.");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistros();
  }, []);

  return (
    <div>
      <NavBar />
      <div className="max-w-5xl mx-auto p-6 mt-20">
        <h1 className="text-center text-xl font-medium mb-8">Aprobación de Pre Registro</h1>

        {loading && <p className="text-center text-gray-600">Cargando pre-registros...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">Completa al menos una (1) de las opciones de filtro</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Buscar por ID</label>
                  <div className="relative w-full flex items-center">
                    <svg
                      className="absolute left-3 h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar por ID de usuario"
                      className="w-full pl-10 py-2.5 bg-[#F6F6F6] border border-gray-300 rounded-lg text-gray-500 placeholder:text-gray-500 h-11"
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Fecha inicial</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 h-11 cursor-pointer"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Fecha final</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 h-11 cursor-pointer"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 h-11">
                    <option value="todos">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <button className="bg-[#365486] hover:bg-[#2f4275] text-white px-8 py-2 rounded-lg">Filtrar</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left font-medium">ID del usuario</th>
                    <th className="py-2 px-4 text-left font-medium">Fecha</th>
                    <th className="py-2 px-4 text-left font-medium">Estado</th>
                    <th className="py-2 px-4 text-left font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((registro, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{registro.document}</td>
                      <td className="py-3 px-4">{new Date(registro.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold
                            ${registro.is_active ? "text-green-600" : ""}
                            ${!registro.is_active && registro.is_registered ? "text-yellow-600" : ""}
                            ${!registro.is_active && !registro.is_registered ? "text-red-600" : ""}
                          `}
                        >
                          {registro.is_active
                            ? "Activo"
                            : registro.is_registered
                            ? "Pendiente"
                            : "Rechazado"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                      <button
                        onClick={() => navigate(`/gestionDatos/pre-registros/${registro.document}`)}
                        className="bg-[#365486] hover:bg-[#42A5F5] text-white text-xs px-4 py-1 h-8 rounded-lg"
                      >
                        Responder
                      </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PreRegistrosList;
