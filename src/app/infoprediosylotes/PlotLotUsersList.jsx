import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputFilter from "../../components/InputFilterPlotLotUser";
import Modal from "../../components/Modal";
import DataTable from "../../components/DataTable";

const PlotLotUsersList = () => {
  const navigate = useNavigate();
  const [predios, setPredios] = useState([]);
  const [filteredPredios, setFilteredPredios] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    id: "",
    name: "",
  });

  const API_URL = import.meta.env.VITE_APP_API_URL;

  useEffect(() => {
    const fetchUserAndPredios = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
          setShowModal(true);
          setLoading(false);
          return;
        }

        // Obtener información del usuario actual
        const userResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Token ${token}` },
        });
        
        setCurrentUser(userResponse.data);
        
        // Obtener los predios del usuario actual
        const prediosResponse = await axios.get(`${API_URL}/plot-lot/plots/list`, {
          headers: { Authorization: `Token ${token}` },
        });

        // Filtramos para mostrar solo los predios del usuario actual
        const userPredios = prediosResponse.data.filter(predio => 
          predio.owner === userResponse.data.document
        );
        
        setPredios(userPredios);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setModalMessage("Error al cargar los datos. Por favor, intente más tarde.");
        setShowModal(true);
        setLoading(false);
      }
    };

    fetchUserAndPredios();
  }, [API_URL]);

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const applyFilters = () => {
    try {
      // Verificamos si hay al menos un filtro aplicado
      const hasActiveFilters = 
        filters.id.trim() !== "" || 
        filters.name.trim() !== "";

      // Validación de ID
      if (filters.id.trim() !== "" && !/^PR-\d{7}$/.test(filters.id.trim()) &&
        !/^\d+$/.test(filters.id.trim())) {
        setModalMessage("El campo ID del predio contiene caracteres no válidos o el predio no existe");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      // Filtrado de predios
      const filtered = predios.filter((predio) => {
        const matchesId = filters.id.trim() === "" ||
          (filters.id.trim().length > 0 &&
            predio.id_plot.toLowerCase().includes(filters.id.trim().toLowerCase()));

        const matchesName = filters.name.trim() === "" ||
          (predio.plot_name && predio.plot_name.toLowerCase().includes(filters.name.trim().toLowerCase()));

        return matchesId && matchesName;
      });

      // Validación adicional para ID del predio no existente
      if (filters.id.trim() !== "" && filtered.length === 0) {
        setModalMessage("El predio filtrado no existe.");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      // Validación adicional para nombre del predio no existente
      if (filters.name.trim() !== "" && filtered.length === 0) {
        setModalMessage("No se encontraron predios con el nombre especificado.");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      setFilteredPredios(filtered);
    } catch (error) {
      setModalMessage("¡El predio filtrado no se pudo mostrar correctamente! Vuelve a intentarlo más tarde...");
      setShowModal(true);
      setFilteredPredios([]);
    }
  };

  const handleDelete = (plot) => {
    setPlotToDelete(plot);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = (plotId) => {
    setPredios(predios.filter(plot => plot.id_plot !== plotId));
    if (filteredPredios && filteredPredios.length > 0) {
      setFilteredPredios(filteredPredios.filter(plot => plot.id_plot !== plotId));
    }
  };

  const handleView = (predio) => {
    navigate(`/mispredios/predio/${predio.id_plot}`);
  };

  const columns = [
    { key: "id_plot", label: "ID Predio" },
    { key: "plot_name", label: "Nombre" },
  ];

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Mis predios
        </h1>

        {loading ? (
          <div className="text-center my-10">Cargando...</div>
        ) : (
          <>

            <InputFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={applyFilters}
            />

            {showModal && (
              <Modal
                showModal={showModal}
                onClose={() => {
                  setShowModal(false);
                  if (modalMessage === "Por favor, aplica al menos un filtro para ver resultados.") {
                    setFilteredPredios(null);
                  }
                }}
                title={modalMessage === "Predio eliminado correctamente" ? "Éxito" : "Error"}
                btnMessage="Cerrar"
              >
                <p>{modalMessage}</p>
              </Modal>
            )}


            {filteredPredios !== null ? (
              <DataTable
                columns={columns}
                data={filteredPredios}
                emptyMessage="No se encontraron predios con los filtros aplicados."
                onView={handleView}
              />
            ) : (
              <DataTable
                columns={columns}
                data={predios}
                emptyMessage="No tienes predios registrados."
                onView={handleView}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlotLotUsersList;