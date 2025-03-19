
import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputFilter from "../../../components/InputFilter";
import Modal from "../../../components/Modal";
import DeleteUser from "../UserEdit/DeleteUsers";
import DataTable from "../../../components/DataTable";

const UserList = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [personTypes, setPersonTypes] = useState([]);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filters, setFilters] = useState({
    id: "",
    personType: "",
    startDate: "",
    endDate: "",
    isActive: "",
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
          (user) => user.is_registered
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

  const matchesStatus = 
  filters.isActive === "" || 
  user.is_active === (filters.isActive === "true");

  // Manejo de fechas - enfoque más explícito
  let matchesDate = true; // Por defecto asumimos que coincide
  
  if (filters.startDate !== "" || filters.endDate !== "") {
    // Solo verificamos fechas si hay algún filtro de fecha
    
    // Convertir fecha de usuario a formato YYYY-MM-DD
    const userDate = new Date(user.date_joined);
    const userDateStr = userDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
    
    // Verificar límite inferior
    if (filters.startDate !== "") {
      const startDateStr = new Date(filters.startDate).toISOString().split('T')[0];
      if (userDateStr < startDateStr) {
        matchesDate = false;
      }
    }
    
    // Verificar límite superior
    if (matchesDate && filters.endDate !== "") {
      const endDateStr = new Date(filters.endDate).toISOString().split('T')[0];
      if (userDateStr > endDateStr) {
        matchesDate = false;
      }
    }
  }

  return matchesId && matchesPersonType && matchesStatus && matchesDate && user.is_registered;
});
      
      if (filters.id.trim() !== "" && filtered.length === 0) {
        setModalMessage("El usuario filtrado no existe.");
        setShowModal(true);
        return;
      }

      if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
        setModalMessage("El campo de filtrado por fecha de registro no se encuentra asociado a ningún registro");
        setShowModal(true);
        return;
      }

      setFilteredUsuarios(filtered);
    } catch (error) {
      setModalMessage("¡El usuario filtrado no se pudo mostrar correctamente! Vuelve a intentarlo más tarde…");
      setShowModal(true);
    }
  };

  // Función para abrir el modal de confirmación de eliminación
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Función que se ejecuta cuando la eliminación ha sido exitosa
  const handleDeleteSuccess = (documentId) => {
    // Actualizar la lista de usuarios
    setUsuarios(usuarios.filter(user => user.document !== documentId));
    
    // Si hay usuarios filtrados, actualizar esa lista también
    if (filteredUsuarios.length > 0) {
      setFilteredUsuarios(filteredUsuarios.filter(user => user.document !== documentId));
    }
  };

  // Configuración de columnas para la tabla
  const columns = [
    { key: "document", label: "Documento" },
    { key: "first_name", label: "Nombre" },
    { key: "last_name", label: "Apellidos", responsive: "hidden md:table-cell" },
    { 
      key: "is_active", 
      label: "Estado", 
      render: (user) => user.is_active ? "Activo" : "Inactivo" 
    },
    { 
      key: "person_type", 
      label: "Tipo", 
      responsive: "hidden sm:table-cell",
      render: (user) => personTypeNames[user.person_type]?.substring(0, 3) || "Des"
    },
    { 
      key: "date_joined", 
      label: "Registro", 
      responsive: "hidden md:table-cell",
      render: (user) => new Date(user.date_joined).toLocaleDateString()
    },
  ];

  // Manejadores de acciones para la tabla
  const handleView = (user) => navigate(`/gestionDatos/users/${user.document}`);
  const handleEdit = (user) => navigate(`/gestionDatos/users/updateinformation/${user.document}`);

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
          usuarios={usuarios} 
        />

        {/* Modal de error */}
        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false);
              setFilteredUsuarios([]);
            }}
            title={modalMessage === "Usuario eliminado correctamente" ? "Éxito" : "Error"}
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Componente DeleteUser para confirmación de eliminación */}
        {showDeleteModal && userToDelete && (
          <DeleteUser
            user={userToDelete}
            showModal={showDeleteModal}
            setShowModal={setShowDeleteModal}
            onDeleteSuccess={handleDeleteSuccess}
            setModalMessage={setModalMessage}
            setShowErrorModal={setShowModal}
          />
        )}

        {/* Uso del nuevo componente DataTable */}
        <DataTable
          columns={columns}
          data={filteredUsuarios}
          emptyMessage="No hay usuarios para mostrar. Aplica filtros para ver resultados."
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>
    </div>
  );
};

export default UserList;