import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputFilterIoT from "../../../components/InputFilterIoT";
import Modal from "../../../components/Modal";
import DataTable from "../../../components/DataTable";
import DeleteIoT from "./DeleteIoT";

const DispositivosIoTList = () => {
  const navigate = useNavigate();
  const [dispositivos, setDispositivos] = useState([]);
  const [predios, setPredios] = useState([]);
  const [filteredDispositivos, setFilteredDispositivos] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dispositivoToDelete, setDispositivoToDelete] = useState(null);
  const [filters, setFilters] = useState({
    iot_id: "",
    name: "",
    plotId: "",
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

        // Obtener la lista de predios primero
        const prediosResponse = await axios.get(`${API_URL}/plot-lot/plots/list`, {
          headers: { Authorization: `Token ${token}` },
        });
        
        setPredios(prediosResponse.data);
        

        // Obtener la lista de dispositivos
        const dispositivosResponse = await axios.get(`${API_URL}/iot/iot-devices`, {
          headers: { Authorization: `Token ${token}` },
        });

        setDispositivos(dispositivosResponse.data);
        console.log("Todos los dispositivos IoT:", dispositivosResponse.data);
        
        // Para cada dispositivo que tenga id_plot, obtener los detalles del predio
        for (const dispositivo of dispositivosResponse.data) {
          if (dispositivo.id_plot) {
            try {
              // Hacer consulta para obtener detalles del predio específico
              const predioResponse = await axios.get(`${API_URL}/plot-lot/plots/${dispositivo.id_plot}`, {
                headers: { Authorization: `Token ${token}` },
              });
              
              console.log(`Detalles del predio ${dispositivo.id_plot} para dispositivo ${dispositivo.iot_id}:`, 
                          predioResponse.data);
              
              // Actualizar la lista de predios con este detalle si no existe
              setPredios(prevPredios => {
                const existingIndex = prevPredios.findIndex(p => p.id_plot === dispositivo.id_plot);
                if (existingIndex !== -1) {
                  // Si el predio ya existe, no hacer nada
                  return prevPredios;
                } else {
                  // Si el predio no existe, añadirlo a la lista
                  return [...prevPredios, predioResponse.data];
                }
              });
            } catch (error) {
              console.error(`Error al obtener detalles del predio ${dispositivo.id_plot}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener datos:", error);
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

  const applyFilters = () => {
    try {
      // Verificamos si hay al menos un filtro aplicado
      const hasActiveFilters = 
        filters.iot_id.trim() !== "" || 
        filters.name.trim() !== "" || 
        filters.plotId.trim() !== "" || 
        filters.isActive !== "" ||
        filters.startDate !== "" ||
        filters.endDate !== "";
  
// Validación de ID del dispositivo
if (filters.iot_id.trim() !== "") {

  const isValidDeviceFormat = /^(\d{1,3}|\d{1,3}-\d{0,4})$/.test(filters.iot_id.trim());
  
  if (!isValidDeviceFormat) {
    setModalMessage("El campo ID del dispositivo contiene caracteres no válidos");
    setShowModal(true);
    setFilteredDispositivos([]);
    return;
  }
}
  
      // Validación de nombre del dispositivo - Mejorada
      if (filters.name.trim() !== "") {
        // Permitir búsqueda flexible (no solo con formato IOT-XXXXX)
        // Esto permite búsquedas parciales del nombre del dispositivo
        if (filters.name.trim().startsWith("IOT-") && !/^IOT-\d{5}$/.test(filters.name.trim())) {
          setModalMessage("Si usa el formato IOT-XXXXX, el nombre debe seguir ese patrón exactamente");
          setShowModal(true);
          setFilteredDispositivos([]);
          return;
        }
      }
  
      // Validación de ID del predio
      if (filters.plotId.trim() !== "") {
        // Verifica si es un prefijo válido del formato PR-NNNNNNN
        const isPrefixValid = /^(P|PR|PR-\d{0,7})$/.test(filters.plotId.trim());
        
        // Verifica si son solo dígitos (cualquier cantidad)
        const isOnlyDigits = /^\d+$/.test(filters.plotId.trim());
  
         // Si no cumple ninguna de las condiciones permitidas
        if (!isPrefixValid && !isOnlyDigits) {
          setModalMessage("El campo ID del predio contiene caracteres no válidos");
          setShowModal(true);
          setFilteredDispositivos([]);
          return;
        }
      }

      
  
      // Validación de fechas
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
        setShowModal(true);
        setFilteredDispositivos([]);
        return;
      }
  
      // Filtrado de dispositivos
      const filtered = dispositivos.filter((dispositivo) => {
        // Filtro por ID del dispositivo
        const matchesIotId = filters.iot_id.trim() === "" ||
          (filters.iot_id.trim().length > 0 &&
            dispositivo.iot_id.toLowerCase().includes(filters.iot_id.trim().toLowerCase()));
  
        // Filtro por nombre del dispositivo - Mejorado para búsqueda más flexible
        const matchesName = filters.name.trim() === "" ||
          (dispositivo.name && dispositivo.name.toLowerCase().includes(filters.name.trim().toLowerCase()));
  
        // Filtro por ID del predio
        const matchesPlotId = filters.plotId.trim() === "" ||
          (dispositivo.id_plot && dispositivo.id_plot.toLowerCase().includes(filters.plotId.trim().toLowerCase()));
  
        // Filtro por estado (activo/inactivo)
        let matchesStatus = true;
        if (filters.isActive !== "") {
          // Convierte filters.isActive a booleano explícitamente
          const isActiveFilter = filters.isActive === "true";
          matchesStatus = dispositivo.is_active === isActiveFilter;
        }
  
        // Filtro por fecha - Similar al implementado en LotesList
        let matchesDate = true; // Por defecto asumimos que coincide
        
        if (filters.startDate !== "" || filters.endDate !== "") {
          // Buscar el predio asociado al dispositivo para obtener su fecha
          const predioAsociado = predios.find(predio => predio.id_plot === dispositivo.id_plot);
          
          if (predioAsociado && predioAsociado.registration_date) {
            // Convertir fecha de predio a formato YYYY-MM-DD
            const deviceDate = new Date(predioAsociado.registration_date);
            const deviceDateStr = deviceDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
            
            // Verificar límite inferior
            if (filters.startDate !== "") {
              const startDateStr = new Date(filters.startDate).toISOString().split('T')[0];
              if (deviceDateStr < startDateStr) {
                matchesDate = false;
              }
            }
            
            // Verificar límite superior
            if (matchesDate && filters.endDate !== "") {
              const endDateStr = new Date(filters.endDate).toISOString().split('T')[0];
              if (deviceDateStr > endDateStr) {
                matchesDate = false;
              }
            }
          } else {
            // Si el dispositivo no tiene predio asociado o fecha, no coincide con filtros de fecha
            matchesDate = false;
          }
        }
  
        return matchesIotId && matchesName && matchesPlotId && matchesStatus && matchesDate;
      });
  
      // Validaciones adicionales para resultados vacíos
      if (filters.iot_id.trim() !== "" && filtered.length === 0) {
        setModalMessage("El dispositivo filtrado no existe.");
        setShowModal(true);
        setFilteredDispositivos([]);
        return;
      }
  
      if (filters.name.trim() !== "" && filtered.length === 0) {
        setModalMessage("No se encontraron dispositivos con el nombre especificado.");
        setShowModal(true);
        setFilteredDispositivos([]);
        return;
      }
  
// Validación de formato del ID del predio
if (filters.plotId.trim() !== "") {
  // Verifica si es un prefijo válido del formato PR-NNNNNNN o solo dígitos
  const isPrefixValid = /^(P|PR|PR-\d{0,7})$/.test(filters.plotId.trim());
  const isOnlyDigits = /^\d+$/.test(filters.plotId.trim());
  
  if (!isPrefixValid && !isOnlyDigits) {
    setModalMessage("El campo ID del predio contiene caracteres no válidos");
    setShowModal(true);
    setFilteredDispositivos([]);
    return;
  }

  // VALIDACIÓN #1: Verificar si el predio realmente existe en la lista de predios
  const plotIdToFind = filters.plotId.trim();
  const predioExiste = predios.some(predio => {
    // Opción 1: Buscar por ID exacto
    if (predio.id_plot === plotIdToFind) {
      return true;
    }
    
    // Opción 2: Buscar por coincidencia parcial (para prefijos)
    if (predio.id_plot.toLowerCase().includes(plotIdToFind.toLowerCase())) {
      return true;
    }
    
    // Opción 3: Si se ingresó solo el número, buscar esa parte en el ID
    if (isOnlyDigits) {
      // Extraer la parte numérica de id_plot (asumiendo formato PR-NNNNNNN)
      const numericPart = predio.id_plot.split('-')[1];
      return numericPart === plotIdToFind;
    }
    
    return false;
  });
  
  if (!predioExiste) {
    setModalMessage("El predio filtrado no existe.");
    setShowModal(true);
    setFilteredDispositivos([]);
    return;
  }
  
  // VALIDACIÓN #2: Verificar si hay dispositivos asociados a este predio
  const dispositivosAsociados = dispositivos.some(dispositivo => {
    if (!dispositivo.id_plot) return false;
    
    // Coincidencia exacta
    if (dispositivo.id_plot === plotIdToFind) {
      return true;
    }
    
    // Coincidencia parcial
    if (dispositivo.id_plot.toLowerCase().includes(plotIdToFind.toLowerCase())) {
      return true;
    }
    
    // Si es solo dígitos, verificar parte numérica
    if (isOnlyDigits) {
      const numericPart = dispositivo.id_plot.split('-')[1];
      return numericPart === plotIdToFind;
    }
    
    return false;
  });
  
  if (!dispositivosAsociados) {
    setModalMessage("No hay dispositivos asociados al predio especificado.");
    setShowModal(true);
    setFilteredDispositivos([]);
    return;
  }
}
      // Validación para rango de fechas sin resultados
      if ((filters.startDate !== "" || filters.endDate !== "") && filtered.length === 0) {
        setModalMessage("No hay dispositivos registrados en el rango de fechas especificado.");
        setShowModal(true);
        setFilteredDispositivos([]);
        return;
      }
  
      // Imprime los resultados para depuración
      console.log("Filtros aplicados:", filters);
      console.log("Dispositivos filtrados:", filtered);
      console.log("Dispositivos inactivos:", filtered.filter(d => !d.is_active).length);
  
      setFilteredDispositivos(filtered);
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
      setModalMessage("¡El dispositivo filtrado no se pudo mostrar correctamente! Vuelve a intentarlo más tarde…");
      setShowModal(true);
      setFilteredDispositivos([]);
    }
  };
  const handleDelete = (dispositivo) => {
    setDispositivoToDelete(dispositivo);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = (iot_id) => {
    // Actualizar la lista de dispositivos
    setDispositivos(dispositivos.filter(dispositivo => dispositivo.iot_id !== iot_id));

    // Si hay dispositivos filtrados, actualizar esa lista también
    if (filteredDispositivos && filteredDispositivos.length > 0) {
      setFilteredDispositivos(filteredDispositivos.filter(dispositivo => dispositivo.iot_id !== iot_id));
    }
  };

  // Configuración de columnas para DataTable
  const getColumns = () => [
    { key: "iot_id", label: "ID Dispositivo" },
    { key: "name", label: "Nombre" },
    { key: "device_type_name", label: "Tipo", responsive: "hidden md:table-cell" },
    { key: "id_plot", label: "ID Predio" },
    {
      key: "is_active",
      label: "Estado",
      render: (dispositivo) => {
        const statusText = dispositivo.is_active ? "Activo" : "Inactivo";
        const statusClass = dispositivo.is_active
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
      label: "Registro Dispositivo",
      responsive: "hidden sm:table-cell",
      render: (dispositivo) => {
        // Si el dispositivo no tiene id_plot, no hay predio asociado
        if (!dispositivo.id_plot) {
          return "N/A";
        }
        
        // Buscar el predio asociado al dispositivo
        const predioAsociado = predios.find(predio => predio.id_plot === dispositivo.id_plot);
        

        
        return predioAsociado && predioAsociado.registration_date
          ? new Date(predioAsociado.registration_date).toLocaleDateString()
          : "N/A";
      }
    }
  ];

  // Manejadores para las acciones
  const handleView = (dispositivo) => {
    navigate(`/gestionDatos/dispositivosIoT/${dispositivo.iot_id}`);
  };

  const handleEdit = (dispositivo) => {
    navigate(`/gestionDatos/dispositivosIoT/${dispositivo.iot_id}/update`);
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Lista de Dispositivos del distrito
        </h1>

        <InputFilterIoT
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
        />

        {/* Modal de mensajes */}
        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false);
              if (modalMessage === "Por favor, aplica al menos un filtro para ver resultados.") {
                setFilteredDispositivos(null);
              }
            }}
            title={modalMessage === "Dispositivo eliminado correctamente" ? "Éxito" : "Error"}
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {showDeleteModal && dispositivoToDelete && (
          <DeleteIoT
            dispositivo={dispositivoToDelete}
            showModal={showDeleteModal}
            setShowModal={setShowDeleteModal}
            onDeleteSuccess={handleDeleteSuccess}
            setModalMessage={setModalMessage}
            setShowErrorModal={setShowModal}
          />
        )}

        {/* Uso del componente DataTable - Solo mostrar cuando hay filtros aplicados */}
        {filteredDispositivos !== null && (
          <DataTable
            columns={getColumns()}
            data={filteredDispositivos}
            emptyMessage="No se encontraron dispositivos con los filtros aplicados."
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        
        {filteredDispositivos === null && (
          <div className="text-center my-10 text-gray-600">
            No hay dispositivos para mostrar. Aplica filtros para ver resultados.
          </div>
        )}
      </div>
    </div>
  );
};

export default DispositivosIoTList;