import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputFilter from "../../../components/InputFilterPredio";
import Modal from "../../../components/Modal";
import DataTable from "../../../components/DataTable";
import { Eye, Pencil, Trash2 } from "lucide-react";

const PrediosList = () => {
  const navigate = useNavigate();
  const [predios, setPredios] = useState([]);
  const [filteredPredios, setFilteredPredios] = useState([]); // Inicialmente vacío
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
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

        const activePredios = response.data.filter(
          (predio) => predio.is_activate
        );
        console.log(activePredios);
        setPredios(activePredios); // Solo actualiza predios, no filteredPredios
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

      const matchesStatus = 
      filters.isActive === "" || 
      predio.is_activate === (filters.isActive === "true");
      
  // Manejo de fechas - enfoque más explícito
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

  const handleInactivate = async (predioId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
        setShowModal(true);
        return;
      }

      await axios.post(`${API_URL}/plot-lot/${predioId}/inhabilitar/`, {}, {
        headers: { Authorization: `Token ${token}` },
      });

      // Actualizar la lista de predios
      setPredios(predios.map(predio => 
        predio.id_plot === predioId ? { ...predio, is_activate: false } : predio
      ));
      setFilteredPredios(filteredPredios.filter(predio => predio.id_plot !== predioId));
      
      setModalMessage("Predio inhabilitado exitosamente.");
      setShowModal(true);
    } catch (error) {
      console.error("Error al inhabilitar el predio:", error);
      setModalMessage(error.response?.data?.error || "Error al inhabilitar el predio. Por favor, intente nuevamente.");
      setShowModal(true);
    }
  };

  // Configuración de columnas para DataTable
  const columns = [
    { key: "id_plot", label: "ID Predio" },
    { key: "plot_name", label: "Nombre" },
    { key: "owner", label: "Propietario" },
    { key: "is_activate", label: "Estado", render: (predio) => predio.is_activate ? "Activo" : "Inactivo"  },
    { 
      key: "plot_extension", 
      label: "Extensión", 
      responsive: "hidden md:table-cell",
      render: (predio) => `${predio.plot_extension} ha`
    },
    { 
      key: "registration_date", 
      label: "Registro", 
      responsive: "hidden sm:table-cell",
      render: (predio) => new Date(predio.registration_date).toLocaleDateString()
    }
  ];

  // Manejadores para las acciones
  const handleView = (predio) => {
    navigate(`/gestionDatos/predios/${predio.id_plot}`);
  };
  
  const handleEdit = (predio) => {
    navigate(`/gestionDatos/predios/update/${predio.id_plot}`);
  };
  
  const handleDelete = (predio) => {
    handleInactivate(predio.id_plot);
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Lista de Predios
        </h1>

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
              if (modalMessage.includes("Error") || modalMessage.includes("no existe")) {
                setFilteredPredios([]);
              }
            }}
            title={modalMessage.includes("Error") || modalMessage.includes("no existe") ? "Error" : "Información"}
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Uso del componente DataTable */}
        <DataTable
          columns={columns}
          data={filteredPredios}
          emptyMessage={predios.length > 0 ? "Aplica filtros para ver resultados." : "No hay predios para mostrar."}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default PrediosList;