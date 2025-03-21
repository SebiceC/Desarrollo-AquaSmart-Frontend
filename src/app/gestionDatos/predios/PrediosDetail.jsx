"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../../../components/NavBar";
import axios from "axios";

const PrediosDetail = () => {
  const { id_plot } = useParams(); // Obtener el id_plot desde la URL
  const [predio, setPredio] = useState(null);
  const [lotes, setLotes] = useState([]); // Lista de lotes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredioData = async () => {
      try {
        const token = localStorage.getItem("token"); // Obtener el token de autenticación
        const API_URL = import.meta.env.VITE_APP_API_URL; // Asegúrate de tener configurada esta variable de entorno

        // Hacer la solicitud para obtener los detalles del predio
        const predioResponse = await axios.get(
          `${API_URL}/plot-lot/plots/${id_plot}`, // Usar el id_plot en la URL
          {
            headers: { Authorization: `Token ${token}` }, // Asegúrate de enviar el token
          }
        );
        setPredio(predioResponse.data); // Guardar los detalles del predio
        setLotes(predioResponse.data.lotes); // Guardar los lotes (cultivos)
      } catch (err) {
        setError("Error al obtener los datos del predio o lotes.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredioData();
  }, [id_plot]); // Se vuelve a ejecutar si cambia el id_plot

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="flex-1 container mx-auto px-6 pb-15 pt-9 max-w-7xl shadow-xl rounded-lg bg-white mt-30">
        <h1 className="text-2xl font-bold text-center mb-8">Información del Predio</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Tarjeta de información del predio */}
          <div className="bg-gray-100 rounded-lg p-6 md:w-1/3 shadow-md">
            <div className="space-y-4">
              <div>
                <p><span className="font-bold">ID: </span>{predio.id_plot}</p>
              </div>
              <div>
                <p><span className="font-bold">Nombre: </span>{predio.plot_name}</p>
              </div>
              <div>
                <p><span className="font-bold">Dueño del predio: </span>{predio.owner}</p>
              </div>
              <div>
                <p><span className="font-bold">Extensión de tierra (m²): </span>{predio.plot_extension}</p>
              </div>
              <div>
                <p><span className="font-bold">Latitud: </span>{predio.latitud}</p>
              </div>
              <div>
                <p><span className="font-bold">Longitud: </span>{predio.longitud}</p>
              </div>
              <div>
                <p><span className="font-bold">Fecha de creación: </span>{new Date(predio.registration_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Tabla de lotes (cultivos) */}
          <div className="md:w-2/3">
            <div className="overflow-y-auto max-h-[350px] border-r border-gray-200 shadow-md rounded-lg">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr className="text-center">
                    <th className="py-2 px-4 font-medium">ID Lote</th>
                    <th className="py-2 px-4 font-medium">Tipo de cultivo</th>
                    <th className="py-2 px-4 font-medium">Variedad de cultivo</th>
                    <th className="py-2 px-4 font-medium">Tipo de suelo</th>
                    <th className="py-2 px-4 font-medium">Fecha de creación</th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map((lote, index) => (
                    <tr key={index} className="border-t border-gray-200 text-center">
                      <td className="py-3 px-4">{lote.id_lot}</td>
                      <td className="py-3 px-4">{lote.crop_type}</td>
                      <td className="py-3 px-4">{lote.crop_variety}</td>
                      <td className="py-3 px-4">{lote.soil_type}</td>
                      <td className="py-3 px-4">{new Date(lote.registration_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrediosDetail;
