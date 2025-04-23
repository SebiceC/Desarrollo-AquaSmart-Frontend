import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "../../components/Modal";
import DataTable from "../../components/DataTable";
import InputFilterFacturas from "../../components/InputFilterFacturas";

const HistorialFacturasLote = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [filteredFacturas, setFilteredFacturas] = useState(null); // Null para controlar si se han aplicado filtros
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    id: "",
    ownerDocument: "",
    lotId: "",
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
        
        // Obtener la lista de facturas desde el endpoint
        const facturasResponse = await axios.get(`${API_URL}/billing/bills`, {
          headers: { Authorization: `Token ${token}` },
        });
        
        setFacturas(facturasResponse.data);
        console.log("Todas las facturas:", facturasResponse.data);
      } catch (error) {
        console.error("Error al obtener la lista de facturas:", error);
        setModalMessage("Error al cargar. Por favor, intente de nuevo o contacte al soporte técnico");
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
        filters.id.trim() !== "" || 
        filters.lotId.trim() !== "" || 
        filters.ownerDocument.trim() !== "" || 
        filters.startDate !== "" || 
        filters.endDate !== "" || 
        filters.isActive !== "";
      
      // Validación de código de factura
      if (filters.id.trim() !== "" && !/^[A-Za-z0-9]+$/.test(filters.id.trim())) {
        setModalMessage("El campo ID de factura contiene caracteres no válidos");
        setShowModal(true);
        setFilteredFacturas([]);
        return;
      }

      // Validación de formato del ID del lote
      if (filters.lotId.trim() !== "") {
        const isValidLoteFormat = /^(\d{1,7}|\d{1,7}-\d{0,3})$/.test(filters.lotId.trim());
        
        if (!isValidLoteFormat) {
          setModalMessage("El campo ID del lote contiene caracteres no válidos");
          setShowModal(true);
          setFilteredFacturas([]);
          return;
        }
      }

      // Validación de formato del documento del propietario
      if (filters.ownerDocument.trim() !== "" && !/^\d+$/.test(filters.ownerDocument.trim())) {
        setModalMessage("El campo ID del propietario contiene caracteres no válidos");
        setShowModal(true);
        setFilteredFacturas([]);
        return;
      }

      // Validación de fechas
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.");
        setShowModal(true);
        setFilteredFacturas([]);
        return;
      }

      // Filtrado de facturas
      const filtered = facturas.filter((factura) => {
        // Filtro por código de factura
        const matchesId = filters.id.trim() === "" ||
          (filters.id.trim().length > 0 &&
            factura.code?.toLowerCase().includes(filters.id.trim().toLowerCase()));
      
        // Filtro por ID del lote
        const matchesIdLote = filters.lotId.trim() === "" ||
          (filters.lotId.trim().length > 0 &&
            (factura.lot?.toLowerCase().includes(filters.lotId.trim().toLowerCase()) || 
             factura.lot_code?.toLowerCase().includes(filters.lotId.trim().toLowerCase())));
        
        // Filtro por documento del cliente/propietario
        const matchesOwner = filters.ownerDocument.trim() === "" ||
          factura.client_document?.includes(filters.ownerDocument.trim());

        // Filtro por estado de pago
        const matchesStatus =
          filters.isActive === "" ||
          (filters.isActive === "true" && factura.status?.toLowerCase() === "pagada") ||
          (filters.isActive === "false" && factura.status?.toLowerCase() === "pendiente");

        // Manejo de fechas para periodo de facturación (usando creation_date)
  let matchesDate = true;

  if (filters.startDate || filters.endDate) {
    try {
      // Obtener la fecha de creación de la factura como un objeto Date
      const facturaDate = new Date(factura.creation_date);
      // Convertimos la fecha de la factura a formato local y eliminamos la hora para la comparación
      const facturaDateOnly = new Date(facturaDate.getFullYear(), facturaDate.getMonth(), facturaDate.getDate());

      // Si hay fecha de inicio, verificar que la factura no sea anterior a la fecha de inicio
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        // Convertimos la fecha de inicio a la misma zona horaria y eliminamos la hora
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        
        // Comprobamos si la fecha de la factura es antes de la fecha de inicio
        if (facturaDateOnly < startDateOnly) {
          matchesDate = false;
        }
      }

      // Si hay fecha de fin, verificar que la factura no sea posterior a la fecha de fin
      if (matchesDate && filters.endDate) {
        const endDate = new Date(filters.endDate);
        // Convertimos la fecha de fin a la misma zona horaria y eliminamos la hora
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        // Comprobamos si la fecha de la factura es después de la fecha de fin
        if (facturaDateOnly > endDateOnly) {
          matchesDate = false;
        }
      }
    } catch (error) {
      console.error("Error al procesar fechas:", error, "para factura:", factura.code);
      matchesDate = false;
    }
  }

  return matchesId && matchesIdLote && matchesOwner && matchesDate && matchesStatus;
});
      // Validaciones adicionales para mostrar mensajes específicos
      if (filters.id.trim() !== "" && filtered.length === 0) {
        setModalMessage("La factura filtrada no existe.");
        setShowModal(true);
        setFilteredFacturas([]);
        return;
      }

      if (filters.lotId.trim() !== "" && filtered.length === 0) {
        setModalMessage("No hay facturas asociadas al lote filtrado.");
        setShowModal(true);
        setFilteredFacturas([]);
        return;
      }

      if (filters.ownerDocument.trim() !== "" && filtered.length === 0) {
        setModalMessage("El documento del propietario no se encuentra asociado a ninguna factura");
        setShowModal(true);
        setFilteredFacturas([]);
        return;
      }

      if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
        setModalMessage("No hay facturas en el periodo especificado.");
        setShowModal(true);
        setFilteredFacturas([]);
        return;
      }

      setFilteredFacturas(filtered);
    } catch (error) {
      setModalMessage("¡Las facturas filtradas no se pudieron mostrar correctamente! Vuelve a intentarlo más tarde…");
      setShowModal(true);
      setFilteredFacturas([]);
    }
  };

  // Configuración de columnas para DataTable
  const columns = [
    { key: "code", label: "Código Factura" },
    { key: "lot_code", label: "Código Lote" },
    { key: "client_name", label: "Nombre Cliente" },
    { key: "client_document", label: "Documento Cliente" },
    { key: "total_amount", label: "Monto Total", render: (factura) => 
      `$${parseFloat(factura.total_amount).toLocaleString('es-CO')}` 
    },
    {
      key: "status",
      label: "Estado",
      render: (factura) => {
        const isPaid = factura.status?.toLowerCase() === "pagada";
        const statusClass = isPaid
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200";

        return (
          <span className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-18`}>
            {factura.status?.charAt(0).toUpperCase() + factura.status?.slice(1)}
          </span>
        );
      }
    },
    {
      key: "creation_date",
      label: "Fecha Creación",
      responsive: "hidden sm:table-cell",
      render: (factura) => new Date(factura.creation_date).toLocaleDateString('es-CO')
    },
    {
      key: "due_payment_date",
      label: "Fecha Vencimiento",
      responsive: "hidden sm:table-cell",
      render: (factura) => new Date(factura.due_payment_date).toLocaleDateString('es-CO')
    }
  ];

  // Manejadores para las acciones
  const handleViewFactura = (factura) => {
    navigate(`/facturacion/detalle/${factura.id_bill}`);
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Historial de facturas
        </h1>

        <InputFilterFacturas
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          showPersonTypeFilter={false}
          showStatusFilter={true}
        />

        {/* Modal de mensajes */}
        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false);
              if (modalMessage === "Por favor, aplica al menos un filtro para ver resultados.") {
                setFilteredFacturas(null);
              }
            }}
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Uso del componente DataTable - Solo mostrar cuando hay filtros aplicados */}
        {filteredFacturas !== null && (
          <DataTable
            columns={columns}
            data={filteredFacturas}
            emptyMessage="No se encontraron facturas con los filtros aplicados."
            onViewFactura={handleViewFactura}
          />
        )}
        
        {filteredFacturas === null && (
          <div className="text-center my-10 text-gray-600">
            No hay facturas para mostrar. Aplica filtros para ver resultados.
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialFacturasLote;