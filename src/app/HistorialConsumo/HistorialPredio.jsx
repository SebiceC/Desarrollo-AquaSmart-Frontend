import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputFilter from "../../components/InputFilterPredio";
import Modal from "../../components/Modal";
import DataTable from "../../components/DataTable";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Footer from "../../components/Footer";

const HistorialPredio = () => {
  const navigate = useNavigate();
  const [predios, setPredios] = useState([]);
  const [filteredPredios, setFilteredPredios] = useState(null); // Cambiado a null para controlar si se han aplicado filtros
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [plotToDelete, setPlotToDelete] = useState(null);
  const [filters, setFilters] = useState({
    id: "",
    ownerDocument: "",
    startDate: "",
    endDate: "",
    isActive: "",
  });

  const API_URL = import.meta.env.VITE_APP_API_URL;

  useEffect(() => {
    const fetchPredios = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
          setShowModal(true);
          return;
        }

        const response = await axios.get(`${API_URL}/plot-lot/plots/list`, {
          headers: { Authorization: `Token ${token}` },
        });

        // Store all plots, both active and inactive
        setPredios(response.data);
        console.log("Todos los predios:", response.data);
      } catch (error) {
        console.error("Error al obtener la lista de predios:", error);
        setModalMessage("Error al cargar los predios. Por favor, intente más tarde.");
        setShowModal(true);
      }
    };

    fetchPredios();
  }, [API_URL]);

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Modified applyFilters function to show modal when owner ID doesn't exist
  const applyFilters = () => {
    try {
      // Verificamos si hay al menos un filtro aplicado
      const hasActiveFilters = 
        filters.id.trim() !== "" || 
        filters.ownerDocument.trim() !== "" || 
        filters.startDate !== "" || 
        filters.endDate !== "" || 
        filters.isActive !== "";
      

      // Validación de ID
      if (filters.id.trim() !== "" && !/^PR-\d{7}$/.test(filters.id.trim()) &&
        !/^\d+$/.test(filters.id.trim())) {
        setModalMessage("El campo ID del predio contiene caracteres no válidos o el predio no existe");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      // Validación de formato del documento del propietario
      if (filters.ownerDocument.trim() !== "" && !/^\d+$/.test(filters.ownerDocument.trim())) {
        setModalMessage("El campo ID del propietario contiene caracteres no válidos o el propietario no existe");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      // Validación de fechas
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      // Filtrado de predios
      const filtered = predios.filter((predio) => {
        // Modificación para permitir búsqueda parcial por ID
        const matchesId = filters.id.trim() === "" ||
          (filters.id.trim().length > 0 &&
            predio.id_plot.toLowerCase().includes(filters.id.trim().toLowerCase()));

        const matchesOwner = filters.ownerDocument.trim() === "" ||
          predio.owner.includes(filters.ownerDocument.trim());

        // Modificado para incluir predios tanto activos como inactivos
        const matchesStatus =
          filters.isActive === "" ||
          predio.is_activate === (filters.isActive === "true");


  // Manejo de fechas - enfoque idéntico al que funciona en UserList
  let matchesDate = true; // Por defecto asumimos que coincide
  
  if (filters.startDate !== "" || filters.endDate !== "") {
    // Solo verificamos fechas si hay algún filtro de fecha
    
    // Convertir fecha de predio a formato YYYY-MM-DD
    const predioDate = new Date(predio.registration_date);
    const predioDateStr = predioDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
    
    // Verificar límite inferior
    if (filters.startDate !== "") {
      const startDateStr = new Date(filters.startDate).toISOString().split('T')[0];
      if (predioDateStr < startDateStr) {
        matchesDate = false;
      }
    }
    
    // Verificar límite superior
    if (matchesDate && filters.endDate !== "") {
      const endDateStr = new Date(filters.endDate).toISOString().split('T')[0];
      if (predioDateStr > endDateStr) {
        matchesDate = false;
      }
    }
  }

        return matchesId && matchesOwner && matchesDate && matchesStatus;
      });

      // Validación adicional para ID del predio no existente
      if (filters.id.trim() !== "" && filtered.length === 0) {
        setModalMessage("El predio filtrado no existe.");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      // Validación adicional para documento del propietario no existente
      if (filters.ownerDocument.trim() !== "" && filtered.length === 0) {
        setModalMessage("El ID del propietario no se encuentra asociado a ningún registro");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      // Validación para rango de fechas sin resultados
      if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
        setModalMessage("No hay predios registrados en el rango de fechas especificado.");
        setShowModal(true);
        setFilteredPredios([]);
        return;
      }

      setFilteredPredios(filtered); // Actualiza filteredPredios solo cuando se aplican filtros
    } catch (error) {
      setModalMessage("¡El predio filtrado no se pudo mostrar correctamente! Vuelve a intentarlo más tarde…");
      setShowModal(true);
      setFilteredPredios([]);
    }
  };

  const handleDelete = (plot) => {
    setPlotToDelete(plot);
    setShowDeleteModal(true);
  };
  const handleDeleteSuccess = (plotId) => {
    // Actualizar la lista de usuarios
    setPredios(predios.filter(plot => plot.id_plot !== plotId));

    // Si hay usuarios filtrados, actualizar esa lista también
    if (filteredPredios && filteredPredios.length > 0) {
      setFilteredPredios(filteredPredios.filter(plot => plot.id_plot !== plotId));
    }
  };


  // Configuración de columnas para DataTable
  const columns = [
    { key: "id_plot", label: "ID Predio" },
    { key: "plot_name", label: "Nombre" },
    { key: "owner", label: "Propietario" },
    { key: "is_activate", label: "Estado", render: (predio) => predio.is_activate ? "Activo" : "Inactivo" },
    {
      key: "plot_extension",
      label: "Extensión M2",
      responsive: "hidden md:table-cell",
      render: (predio) => `${predio.plot_extension} m2`
    },
    {
      key: "registration_date",
      label: "Registro",
      responsive: "hidden sm:table-cell",
      render: (predio) => new Date(predio.registration_date).toLocaleDateString()
    }
  ];

  // Manejadores para las acciones
  // const handleView = (predio) => {
  //   navigate(`/gestionDatos/predios/${predio.id_plot}`);
  // };

  // const handleEdit = (predio) => {
  //   navigate(`/gestionDatos/predios/update/${predio.id_plot}`);
  // };

  const handleConsult = (predio) => {
    navigate(`/historial-consumo/predio/${predio.id_plot}`);
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Historial de consumo de predios
        </h1>

        <div className="container text-gray-600">
          Complete al menos 1 de las opciones del filtro
        </div>

        <InputFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          showPersonTypeFilter={false}
        />

        {/* Modal de mensajes */}
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
      </div>
      <Footer />
    </div>
  );
};

export default HistorialPredio;