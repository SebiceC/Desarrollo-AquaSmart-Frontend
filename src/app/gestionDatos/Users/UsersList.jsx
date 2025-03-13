import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import axios from "axios";
import InputFilter from "../../../components/InputFilter"; // Importa el nuevo componente

const UserList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [personTypes, setPersonTypes] = useState([]);
  const API_URL = import.meta.env.VITE_APP_API_URL;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const personTypesResponse = await axios.get(
          `${API_URL}/users/list-person-type`
        );
        setPersonTypes(personTypesResponse.data);
      } catch (error) {
        console.error("Error al obtener las opciones:", error);
      }
    };
    fetchOptions();

    // Usando axios para hacer la solicitud GET
    axios
      .get(`${API_URL}/usuarios`)
      .then((response) => {
        setUsuarios(response.data); // Los datos están en response.data
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [API_URL]);

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-20">
        <h1 className="text-center text-xl font-semibold mb-6">
          Lista de usuarios del distrito
        </h1>

        {/* Usar el componente InputFilter */}
        <InputFilter personTypes={personTypes} />

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apellidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de persona
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usuario.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usuario.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usuario.apellidos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usuario.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usuario.fechaRegistro}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    -
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserList;