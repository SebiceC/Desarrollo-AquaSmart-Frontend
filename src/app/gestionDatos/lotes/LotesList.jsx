import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputFilter from "../../../components/InputFilterLote";
import Modal from "../../../components/Modal";
import DataTable from "../../../components/DataTable";
import { Eye, Pencil, Trash2 } from "lucide-react";
import DeleteLotes from "./DeleteLote";


const LotesList = () => {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState([]);
  const [predios, setPredios] = useState([]);
  const [filteredLotes, setFilteredLotes] = useState(null); // Cambiado a null para controlar si se han aplicado filtros
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loteToDelete, setLoteToDelete] = useState(null);
  const [filters, setFilters] = useState({
    id: "",
    ownerDocument: "",
    plotId:"",
    lotId: "",
    cropType: "",
    startDate: "",
    endDate: "",
    isActive: "",
  });

  const API_URL = import.meta.env.VITE_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setModalMessage("No hay una sesión activa. Por favor, inicie sesión.");
          setShowModal(true);
          return;
        }
        
        // Obtener la lista de predios
        const prediosResponse = await axios.get(`${API_URL}/plot-lot/plots/list`, {
          headers: { Authorization: `Token ${token}` },
        });
        
        setPredios(prediosResponse.data);
        console.log("Todos los predios:", prediosResponse.data);

        // Obtener la lista de lotes
        const lotesResponse = await axios.get(`${API_URL}/plot-lot/lots/list`, {
          headers: { Authorization: `Token ${token}` },
        });

        // Combinar la información de lotes y predios
        const lotesConPredios = lotesResponse.data.map(lote => {
          // Buscar el predio correspondiente
          const predio = prediosResponse.data.find(p => p.id_plot === lote.plot);
          
          return {
            ...lote,
            predioOwner: predio ? predio.owner : "No disponible"
          };
        });

        // Store all plots, both active and inactive
        setLotes(lotesConPredios);
        console.log("Todos los lotes con propietarios:", lotesConPredios);
      } catch (error) {
        console.error("Error al obtener la lista de lotes o predios:", error);
        setModalMessage("Error al cargar los datos. Por favor, intente más tarde.");
        setShowModal(true);
      }
    };

    fetchData();
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
        filters.lotId.trim() !== "" || 
        filters.ownerDocument.trim() !== "" || 
        filters.startDate !== "" || 
        filters.endDate !== "" || 
        filters.isActive !== "";
      


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

      // Validación de formato del ID del  lote
      if (filters.lotId.trim() !== "") {
        // Validación de formato del ID del lote
        const isValidLoteFormat = /^(\d{1,7}|\d{1,7}-\d{0,3})$/.test(filters.lotId.trim());
        
        if (!isValidLoteFormat) {
          setModalMessage("El campo ID del lote contiene caracteres no válidos");
          setShowModal(true);
          setFilteredLotes([]);
          return;
        }
      }

      // Validación de formato del documento del propietario
      if (filters.ownerDocument.trim() !== "" && !/^\d+$/.test(filters.ownerDocument.trim())) {
        setModalMessage("El campo ID del propietario contiene caracteres no válidos");
        setShowModal(true);
        setFilteredLotes([]);
        return;
      }

      // Validación de fechas
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
        setShowModal(true);
        setFilteredLotes([]);
        return;
      }

      // Filtrado de lotes
      const filtered = lotes.filter((lots) => {
        // Modificación para permitir búsqueda parcial por ID
        const matchesId = filters.id.trim() === "" ||
          (filters.id.trim().length > 0 &&
            lots.plot.toLowerCase().includes(filters.id.trim().toLowerCase()));
      
        // Modificación para permitir búsqueda parcial por ID del lote
        const matchesIdlote = filters.lotId.trim() === "" ||
        (filters.lotId.trim().length > 0 &&
          (lots.id_lot?.toLowerCase().includes(filters.lotId.trim().toLowerCase()) || 
           lots.id?.toLowerCase().includes(filters.lotId.trim().toLowerCase())));
        // Ahora buscamos en el predioOwner en lugar de owner
        const matchesOwner = filters.ownerDocument.trim() === "" ||
          lots.predioOwner.includes(filters.ownerDocument.trim());

        // Modificado para incluir lotes tanto activos como inactivos
        const matchesStatus =
          filters.isActive === "" ||
          lots.is_activate === (filters.isActive === "true");


        // Manejo de fechas - enfoque idéntico al que funciona en UserList
        let matchesDate = true; // Por defecto asumimos que coincide
        
        if (filters.startDate !== "" || filters.endDate !== "") {
          // Solo verificamos fechas si hay algún filtro de fecha
          
          // Convertir fecha de predio a formato YYYY-MM-DD
          const loteDate = new Date(lots.registration_date);
          const loteDateStr = loteDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
          
          // Verificar límite inferior
          if (filters.startDate !== "") {
            const startDateStr = new Date(filters.startDate).toISOString().split('T')[0];
            if (loteDateStr < startDateStr) {
              matchesDate = false;
            }
          }
          
          // Verificar límite superior
          if (matchesDate && filters.endDate !== "") {
            const endDateStr = new Date(filters.endDate).toISOString().split('T')[0];
            if (loteDateStr > endDateStr) {
              matchesDate = false;
            }
          }
        }

        return matchesId && matchesIdlote && matchesOwner && matchesDate && matchesStatus;
      });

      // Validación adicional para ID del predio no existente
      if (filters.id.trim() !== "" && filtered.length === 0) {
        setModalMessage("El predio filtrado no existe.");
        setShowModal(true);
        setFilteredLotes([]);
        return;
      }

      // Validación adicional para ID del lote no existente
      if (filters.lotId.trim() !== "" && filtered.length === 0) {
        setModalMessage("El lote filtrado no existe.");
        setShowModal(true);
        setFilteredLotes([]);
        return;
      }

      // Validación adicional para documento del propietario no existente
      if (filters.ownerDocument.trim() !== "" && filtered.length === 0) {
        setModalMessage("El ID del propietario no se encuentra asociado a ningún registro");
        setShowModal(true);
        setFilteredLotes([]);
        return;
      }

      // Validación para rango de fechas sin resultados
      if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
        setModalMessage("No hay lotes registrados en el rango de fechas especificado.");
        setShowModal(true);
        setFilteredLotes([]);
        return;
      }

      setFilteredLotes(filtered); // Actualiza filteredLotes solo cuando se aplican filtros
    } catch (error) {
      setModalMessage("¡El lote filtrado no se pudo mostrar correctamente! Vuelve a intentarlo más tarde…");
      setShowModal(true);
      setFilteredLotes([]);
    }
  };

  const handleDelete = (lots) => {
    setLoteToDelete(lots);
    setShowDeleteModal(true);
  };
  
  const handleDeleteSuccess = (lotsId) => {
    // Actualizar la lista de lotes
    setLotes(lotes.filter(lots => lots.id_lot !== lotsId));

    // Si hay lotes filtrados, actualizar esa lista también
    if (filteredLotes && filteredLotes.length > 0) {
      setFilteredLotes(filteredLotes.filter(lots => lots.id_lot !== lotsId));
    }
  };


  // Configuración de columnas para DataTable
  const columns = [
    { key: "id_lot", label: "ID Lote" },
    { key: "crop_type", label: "Tipo de Cultivo" },
    { key: "plot", label: "ID Predio" },
    { key: "predioOwner", label: "Propietario del Predio" }, // Cambiado de owner a predioOwner
    {
      key: "is_activate",
      label: "Estado",
      render: (lote) => {
        const statusText = lote.is_activate ? "Activo" : "Inactivo";
        const statusClass = lote.is_activate
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200";

        return (
          <span className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-18`}>
            {statusText}
          </span>
        );
      }
    },
    {
      key: "registration_date",
      label: "Registro",
      responsive: "hidden sm:table-cell",
      render: (lote) => new Date(lote.registration_date).toLocaleDateString()
    }
  ];

  // Manejadores para las acciones
  const handleView = (lote) => {
    navigate(`/gestionDatos/lotes/${lote.id_lot}`);
  };

  const handleEdit = (lote) => {
    navigate(`/gestionDatos/lotes/${lote.id_lot}/update`);
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Lista de Lotes del distrito
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
              if (modalMessage === "Por favor, aplica al menos un filtro para ver resultados.") {
                setFilteredLotes(null);
              }
            }}
            title={modalMessage === "Lote eliminado correctamente" ? "Éxito" : "Error"}
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {showDeleteModal && loteToDelete && (
          <DeleteLotes
          lots={loteToDelete}
          showModal={showDeleteModal}
          setShowModal={setShowDeleteModal}
          onDeleteSuccess={handleDeleteSuccess}
          setModalMessage={setModalMessage}
          setShowErrorModal={setShowModal}
          />
        )}

        {/* Uso del componente DataTable - Solo mostrar cuando hay filtros aplicados */}
        {filteredLotes !== null && (
          <DataTable
            columns={columns}
            data={filteredLotes}
            emptyMessage="No se encontraron lotes con los filtros aplicados."
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        
        {filteredLotes === null && (
          <div className="text-center my-10 text-gray-600">
            No hay lotes para mostrar. Aplica filtros para ver resultados.
          </div>
        )}
      </div>
    </div>
  );
};

export default LotesList;