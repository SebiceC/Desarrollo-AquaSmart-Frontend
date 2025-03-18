import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NavBar from "../../../components/NavBar";
import Modal from "../../../components/Modal";

const PreRegistrosList = () => {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [filteredRegistros, setFilteredRegistros] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [filters, setFilters] = useState({
    id: "",
    startDate: "",
    endDate: "",
    status: "todos",
  });

  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_APP_API_URL;
        //var API_URL = process.env.VITE_APP_API_URL || "http://localhost:5173"; // var de pruebas

        const response = await axios.get(`${API_URL}/users/admin/listed`, {
          headers: { Authorization: `Token ${token}` },
        });

        console.log("Respuesta del servidor:", response.data);
        setRegistros(response.data);
        setFilteredRegistros([]);
      } catch (err) {
        console.error("Error al obtener los pre-registros:", err);
        setError("No se pudieron cargar los pre-registros.");
      }
    };

    fetchRegistros();
  }, []);

  const openErrorModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const handleRedirect = async (documentId) => {
    try {
      navigate(`/gestionDatos/pre-registros/${documentId}`);
    } catch (error) {
      openErrorModal("Ocurrió un error al intentar redirigir al registro.");
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const applyFilters = () => {
    try {
      let filtered = registros;

      if (filters.id.trim() !== "" && !/^\d+$/.test(filters.id.trim())) {
        setModalMessage(
          "El campo de filtrado por ID contiene caracteres no válidos o el usuario no existe."
        );
        setShowModal(true);
        return;
      }

      if (
        filters.startDate &&
        filters.endDate &&
        new Date(filters.startDate) > new Date(filters.endDate)
      ) {
        setModalMessage(
          "La fecha de inicio no puede ser mayor que la fecha de fin."
        );
        setShowModal(true);
        return;
      }

      if (filters.id.trim() !== "") {
        filtered = filtered.filter((registro) =>
          registro.document.includes(filters.id.trim())
        );
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate).setHours(0, 0, 0, 0);
        filtered = filtered.filter((registro) => {
          const registroDate = new Date(registro.date_joined).setHours(
            0,
            0,
            0,
            0
          );
          return registroDate >= startDate;
        });
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate).setHours(23, 59, 59, 999);
        filtered = filtered.filter((registro) => {
          const registroDate = new Date(registro.date_joined).setHours(
            23,
            59,
            59,
            999
          );
          return registroDate <= endDate;
        });
      }

      if (filters.status !== "todos") {
        filtered = filtered.filter((registro) => {
          if (filters.status === "pendiente") {
            return !registro.is_active && !registro.is_registered;
          } else if (filters.status === "aprobado") {
            return registro.is_active && registro.is_registered;
          } else if (filters.status === "rechazado") {
            return !registro.is_active && registro.is_registered;
          }
          return true;
        });
      }

      if (filtered.length === 0) {
        openErrorModal(
          "No se encontraron resultados para los filtros aplicados."
        );
      }

      setFilteredRegistros(filtered);
    } catch (error) {
      openErrorModal("Ocurrió un error al aplicar los filtros.");
    }
  };

  return (
    <div>
      <NavBar />
      <div className="max-w-5xl mx-auto p-6 mt-20">
        <h1 className="text-center text-xl font-medium mb-8">
          Aprobación de Pre Registro
        </h1>

        {error && <p className="text-center text-red-600">{error}</p>}

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Completa al menos una (1) de las opciones de filtro
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">
                Buscar por ID
              </label>
              <div className="relative w-full flex items-center">
                <svg
                  className="absolute left-3 h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por ID de usuario"
                  className="w-full pl-10 py-2.5 bg-[#F6F6F6] border border-gray-300 rounded-lg text-gray-500 placeholder:text-gray-500 h-11"
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                  value={filters.id}
                  onChange={(e) => handleFilterChange("id", e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">
                Fecha inicial
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg p-2 h-11 cursor-pointer"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">
                Fecha final
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg p-2 h-11 cursor-pointer"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 h-11"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={applyFilters}
              className="bg-[#365486] hover:bg-[#2f4275] text-white px-8 py-2 rounded-lg"
            >
              Filtrar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-center font-medium">
                  ID del usuario
                </th>
                <th className="py-2 px-4 text-center font-medium">Fecha</th>
                <th className="py-2 px-4 text-center font-medium">Estado</th>
                <th className="py-2 px-4 text-center font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistros.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No hay usuarios para mostrar. Aplica filtros para ver
                    resultados.
                  </td>
                </tr>
              ) : (
                filteredRegistros.map((registro, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4 text-center align-middle">
                      {registro.document}
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      {registro.date_joined
                        ? new Date(registro.date_joined).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "Fecha no disponible"}
                    </td>

                    <td className="py-3 px-4 text-center align-middle">
                      <span
                        className={`font-bold
                          ${
                            registro.is_active && registro.is_registered
                              ? "text-green-600"
                              : ""
                          }
                          ${
                            !registro.is_active && registro.is_registered
                              ? "text-red-600"
                              : ""
                          }
                          ${!registro.is_registered ? "text-yellow-600" : ""}
                        `}
                      >
                        {registro.is_active && registro.is_registered
                          ? "Aprobado"
                          : !registro.is_active && registro.is_registered
                          ? "Inactivo"
                          : "Pendiente"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      <button
                        onClick={() => handleRedirect(registro.document)}
                        className="bg-[#365486] hover:bg-[#42A5F5] text-white text-xs px-4 py-1 h-8 rounded-lg"
                      >
                        {registro.is_active && registro.is_registered
                          ? "Ver"
                          : !registro.is_active && registro.is_registered
                          ? "Ver"
                          : "Responder"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          showModal={showModal}
          onClose={() => {
            setShowModal(false);
            setFilteredRegistros([]);
          }}
          title="Error"
          btnMessage="Cerrar"
        >
          <p>{modalMessage}</p>
        </Modal>
      )}
    </div>
  );
};

export default PreRegistrosList;
