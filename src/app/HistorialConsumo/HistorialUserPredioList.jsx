import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputFilter from "../../components/InputFilterPlotLotUser";
import Modal from "../../components/Modal";
import DataTable from "../../components/DataTable";
import Footer from "../../components/Footer";

const HistorialUserPredio = () => {
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
      if (filters.id.trim() !== "") {
        // Verifica si es un prefijo válido del formato PR-NNNNNNN
        const isPrefixValid = /^(P|PR|PR-\d{0,7})$/.test(filters.id.trim());
        
        // Verifica si son solo dígitos (cualquier cantidad)
        const isOnlyDigits = /^\d+$/.test(filters.id.trim());
  
         // Si no cumple ninguna de las condiciones permitidas
        if (!isPrefixValid && !isOnlyDigits) {
          setModalMessage("El campo ID del predio contiene caracteres no válidos");
          setShowModal(true);
          setFilteredPredios([]);
          return;
        }
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

  const columns = [
    { key: "id_plot", label: "ID Predio" },
    { key: "plot_name", label: "Nombre" },
  ];

  const handleConsult = (predio) => {
    navigate(`/mispredios/historial-consumoPredio/${predio.id_plot}`);
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Historial de consumo
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


        {/* Uso del componente DataTable - Solo mostrar cuando hay filtros aplicados */}
        {filteredPredios !== null && (
          <DataTable
            columns={columns}
            data={filteredPredios}
            emptyMessage="No se encontraron predios con los filtros aplicados."
            // onView={handleView}
            // onEdit={handleEdit}
            // onDelete={handleDelete}
            onConsult={handleConsult}
          />
        )}
        
        {filteredPredios === null && (
          <div className="text-center my-10 text-gray-600">
            No hay predios para mostrar. Aplica filtros para ver resultados.
          </div>
        )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HistorialUserPredio;