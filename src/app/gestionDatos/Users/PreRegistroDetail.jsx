import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FileText } from "lucide-react";
import NavBar from "../../../components/NavBar";

const PreRegistroDetail = () => {
  const { document } = useParams();
  const navigate = useNavigate();
  const [registro, setRegistro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    const fetchRegistro = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_APP_API_URL;
        const response = await axios.get(`${API_URL}/users/admin/update/${document}`, {
          headers: { Authorization: `Token ${token}` },
        });
        setRegistro(response.data);
      } catch (err) {
        setError("No se pudo cargar la información del registro.");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistro();
  }, [document]);

  
  if (loading) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <NavBar />
      <div className="max-w-3xl mx-auto p-6 mt-30 bg-white rounded-lg shadow">
        <h1 className="text-xl font-medium text-center mb-2">Aprobación de Pre Registro</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Información enviada por el usuario</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Nombre: </span>
              {registro.first_name}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Apellido: </span>
              {registro.last_name}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Tipo de persona: </span>
              {registro.person_type ? registro.person_type.typeName : "No disponible"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Teléfono: </span>
              {registro.phone}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Correo: </span>
              {registro.email}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">ID: </span>
              {registro.document}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Contraseña: </span>
              {registro.password || "No disponible"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Confirmación de contraseña: </span>
              {registro.password || "No disponible"}
            </p>
          </div>
          <div className="space-y-1 col-span-1 md:col-span-2">
            <p className="text-sm">
              <span className="font-medium">Fecha: </span>
              {new Date(registro.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <FileText size={16} />
            Cedula.pdf
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <FileText size={16} />
            escritura.pdf
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <FileText size={16} />
            libertad.pdf
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
            Rechazar
          </button>
          <button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreRegistroDetail;
