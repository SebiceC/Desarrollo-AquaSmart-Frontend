import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "../../components/Modal";
import DataTable from "../../components/DataTable";
import InputFilterFacturas from "../../components/InputFilterFacturas";
import TotalTable from "../../components/TotalTable";
import { PDFDownloadTotales } from "../../components/PDFDownloadTotales";
import { ExcelDownloadTotales } from "../../components/ExcelDownloadTotales";

const HistorialFacturasLote = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [filteredFacturas, setFilteredFacturas] = useState(null);
  const [showTotalizacion, setShowTotalizacion] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    id: "",
    ownerDocument: "",
    lotId: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  const API_URL = import.meta.env.VITE_APP_API_URL;

  // Usar los hooks de descarga
  const { generatePDF, isGenerating: isGeneratingPDF } = PDFDownloadTotales({
    data: filteredFacturas || [],
    filters,
    onError: handleDownloadError
  });

  const { generateExcel, isGenerating: isGeneratingExcel } = ExcelDownloadTotales({
    data: filteredFacturas || [],
    filters,
    onError: handleDownloadError
  });

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
      // Verificación inicial de los valores de fechas tal como los ingresa el usuario
      console.log("Fechas ingresadas:", {
        startDate: filters.startDate, 
        endDate: filters.endDate
      });
      
      // Crear un nuevo arreglo para almacenar los resultados filtrados
      let filteredResults = [...facturas];
      
      // PASO 1: Aplicar el filtro de fechas PRIMERO, de forma aislada
      if (filters.startDate || filters.endDate) {
        // Filtrar por fechas
        filteredResults = filteredResults.filter(factura => {
          // Convertir a fecha y remover componente de hora
          const facturaDate = new Date(factura.creation_date);
          const facturaDateOnly = new Date(
            facturaDate.getFullYear(), 
            facturaDate.getMonth(), 
            facturaDate.getDate()
          );
          
          let keepFactura = true;
          
          // Filtro de fecha inicial
          if (filters.startDate) {
            const startDateParts = filters.startDate.split('-');
            const startDate = new Date(
              parseInt(startDateParts[0]), // año
              parseInt(startDateParts[1]) - 1, // mes (0-11)
              parseInt(startDateParts[2]) // día
            );
            
            if (facturaDateOnly < startDate) {
              keepFactura = false;
            }
          }
          
          // Filtro de fecha final
          if (keepFactura && filters.endDate) {
            const endDateParts = filters.endDate.split('-');
            const endDate = new Date(
              parseInt(endDateParts[0]), // año
              parseInt(endDateParts[1]) - 1, // mes (0-11)
              parseInt(endDateParts[2]) // día
            );
            
            if (facturaDateOnly > endDate) {
              keepFactura = false;
            }
          }
          
          return keepFactura;
        });
      }
      
      // PASO 2: Aplicar el resto de los filtros
      filteredResults = filteredResults.filter(factura => {
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
          filters.status === "" ||
          (filters.status === "Pagada" && factura.status?.toLowerCase() === "pagada") ||
          (filters.status === "Pendiente" && factura.status?.toLowerCase() === "pendiente") ||
          (filters.status === "Validada" && factura.status?.toLowerCase() === "validada") ||
          (filters.status === "Vencida" && factura.status?.toLowerCase() === "vencida");
          
        return matchesId && matchesIdLote && matchesOwner && matchesStatus;
      });
      
      // Establecer los resultados filtrados
      setFilteredFacturas(filteredResults);
      // Ocultar la totalización cuando se aplican nuevos filtros
      setShowTotalizacion(false);
      
      // Mostrar mensaje si no hay resultados
      if (filteredResults.length === 0) {
        setModalMessage("No se encontraron facturas que coincidan con los filtros aplicados.");
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
      setModalMessage("Ocurrió un error al aplicar los filtros. Por favor, inténtalo de nuevo.");
      setShowModal(true);
    }
  };

  // Función para manejar la totalización
  const handleTotalizar = () => {
    if (filteredFacturas && filteredFacturas.length > 0) {
      setShowTotalizacion(true);
    } else {
      setModalMessage("Primero debe aplicar filtros para ver los resultados antes de totalizar.");
      setShowModal(true);
    }
  };

  // Función para manejar errores de descarga
  function handleDownloadError(message) {
    setModalMessage(message);
    setShowModal(true);
  }

  // Función para generar PDF - CORREGIDA
  const handleGeneratePDF = async () => {
    if (!filteredFacturas || filteredFacturas.length === 0) {
      handleDownloadError("No hay datos para exportar. Por favor, aplique filtros primero.");
      return;
    }

    try {
      await generatePDF();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      handleDownloadError("Error al generar el PDF. Por favor, inténtalo de nuevo.");
    }
  };

  // Función para generar Excel - CORREGIDA
  const handleGenerateExcel = async () => {
    if (!filteredFacturas || filteredFacturas.length === 0) {
      handleDownloadError("No hay datos para exportar. Por favor, aplique filtros primero.");
      return;
    }

    try {
      await generateExcel();
    } catch (error) {
      console.error("Error al generar Excel:", error);
      handleDownloadError("Error al generar el Excel. Por favor, inténtalo de nuevo.");
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
        const statusClass = factura.status?.toLowerCase() === "pendiente" 
          ? "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200" 
          : factura.status?.toLowerCase() === "validada"
          ? "bg-blue-100 text-blue-800 border border-blue-200"
          : factura.status?.toLowerCase() === "pagada"
          ? "bg-green-100 text-green-800 border border-green-200"
          : factura.status?.toLowerCase() === "vencida"
          ? "bg-red-100 text-red-800 border border-red-200"
          : "";

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

        {/* Botón Totalizar - Solo se muestra cuando hay filtros aplicados */}
        {filteredFacturas !== null && filteredFacturas.length > 0 && (
          <div className="flex justify-end my-1">
            <button
              onClick={handleTotalizar}
              className=" bg-[#365486]  hover:bg-blue-500 transition-colors p-1.5 w-50 rounded-full min-w-[28px] min-h-[28px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              disabled={isGeneratingPDF || isGeneratingExcel}
            >
              <p className="font-bold text-white">Totalizar</p>
            </button>
          </div>
        )}

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

        {/* Tabla de totalización - Solo se muestra cuando se ha hecho clic en Totalizar */}
        {showTotalizacion && filteredFacturas && filteredFacturas.length > 0 && (
          <TotalTable
            data={filteredFacturas}
            onDownloadPDF={handleGeneratePDF}
            onDownloadExcel={handleGenerateExcel}
          />
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