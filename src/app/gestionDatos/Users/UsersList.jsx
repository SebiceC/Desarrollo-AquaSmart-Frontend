// UserList.jsx
import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import axios from "axios";
import InputFilter from "../../../components/InputFilter";
import Modal from "../../../components/Modal";

const UserList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [personTypes, setPersonTypes] = useState([]);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    id: "",
    personType: "",
    startDate: "",
    endDate: "",
  });

  const personTypeNames = {
    1: "Natural",
    2: "Jurídica",
  };

  const API_URL = import.meta.env.VITE_APP_API_URL;

  useEffect(() => {
    const fetchPersonTypes = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/list-person-type`);
        setPersonTypes(response.data);
      } catch (error) {
        console.error("Error al obtener los tipos de persona:", error);
      }
    };

    fetchPersonTypes();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/users/admin/listed`, {
          headers: { Authorization: `Token ${token}` },
        });

        const activeAndRegisteredUsers = response.data.filter(
          (user) => user.is_active && user.is_registered
        );

        setUsuarios(activeAndRegisteredUsers);
      } catch (error) {
        console.error("Error al obtener la lista de usuarios:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const applyFilters = () => {
     try {
      // Validación de ID (Solo números)
      if (filters.id.trim() !== "" && !/^\d+$/.test(filters.id.trim())) {
        setModalMessage("El campo de filtrado por ID contiene caracteres no válidos o el usuario no existe");
        setShowModal(true);
        return;
      }

      // Validación de fechas incoherentes
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
        setShowModal(true);
        return;
      }

      // Filtrado de usuarios
      const filtered = usuarios.filter((user) => {
        const matchesId = filters.id.trim() === "" || user.document.includes(filters.id.trim());
        const matchesPersonType = filters.personType === "" || user.person_type === Number(filters.personType);
        const matchesDate =
          (filters.startDate === "" || new Date(user.date_joined) >= new Date(filters.startDate)) &&
          (filters.endDate === "" || new Date(user.date_joined) <= new Date(filters.endDate));

        return matchesId && matchesPersonType && matchesDate && user.is_active && user.is_registered;
      });

      if (filters.id.trim() !== "" && filtered.length === 0) {
        setModalMessage("El usuario filtrado no existe.");
        setShowModal(true);
        return;
      }

      if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
        setModalMessage("El campo de filtrado por fecha de registro  no se encuentra asociado a ningún registro");
        setShowModal(true);
        return;
      }

      setFilteredUsuarios(filtered);
    } catch (error) {
      setModalMessage("¡El usuario filtrado no se pudo mostrar correctamente! Vuelve a intentarlo más tarde…");
      setShowModal(true);
    }
      setFilteredUsuarios(filtered);

  };
  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Lista de usuarios del distrito
        </h1>

        <InputFilter
          personTypes={personTypes}
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
        />

                {/* Modal de error */}
          {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false)
              setFilteredUsuarios([]);
            }}
            title="Error"
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Apellidos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Registro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500 text-sm">
                    No hay usuarios para mostrar. Aplica filtros para ver resultados.
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((user) => (
                  <tr key={user.document} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.document}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.first_name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">{user.last_name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {personTypeNames[user.person_type]?.substring(0, 3) || "Des"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-1 justify-start">
                        <button className="bg-red-500 p-1.5 rounded-md min-w-[28px]">
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/1345/1345874.png"
                            alt="Eliminar"
                            className="w-5 h-5 md:w-6 md:h-6"
                          />
                        </button>
                        <button className="bg-green-600 p-1.5 rounded-md min-w-[28px]">
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/709/709612.png"
                            alt="Ver"
                            className="w-5 h-5 md:w-6 md:h-6"
                          />
                        </button>
                        <button className="bg-blue-400 p-1.5 rounded-md min-w-[28px]">
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png"
                            alt="Editar"
                            className="w-5 h-5 md:w-6 md:h-6"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserList;