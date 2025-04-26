import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../components/NavBar'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

const ReportesYNovedades = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([
    { id: 1, nombre: 'Solicitud de cambio de caudal del lote', tipo: 'solicitud' },
    { id: 2, nombre: 'Informe de Ventas Primer Trimestre', tipo: 'reporte' },
    { id: 3, nombre: 'Novedades del Sistema v2.3', tipo: 'reporte' },
    { id: 4, nombre: 'Reporte de Incidencias Técnicas', tipo: 'reporte' },
    { id: 5, nombre: 'Solicitud de actualización de datos', tipo: 'solicitud' }
  ]);
  
  // Configuración de columnas para DataTable
  const getColumns = () => [
    { 
      key: "nombre", 
      label: "Nombre",
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (item) => {
        const isSolicitud = item.tipo === 'solicitud';
        const statusClass = isSolicitud
          ? "bg-blue-100 text-blue-800 border border-blue-200"
          : "bg-green-100 text-green-800 border border-green-200";

        return (
          <span className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-24`}>
            {isSolicitud ? "Solicitud" : "Reporte"}
          </span>
        );
      }
    },
  ];

  // Función para manejar la navegación según el tipo de elemento
  const handleConsult = (item) => {
    if (item.tipo === 'solicitud') {
      // Navegar a la página de solicitudes de lotes
      navigate('/reportes-y-novedades/lotes');
    } else {
      // Navegar a la página de lotes pero en modo reporte
      navigate('/reportes-y-novedades/lotes?mode=report');
    }
  };

  // Estilo personalizado para centrar los botones en la columna de acciones
  const customStyles = {
    tableStyles: "",
    tableHeadStyles: "",
    tableBodyStyles: "",
    tableRowStyles: "",
    tableCellStyles: "",
    // La siguiente clase se aplicará a la celda de acciones
    actionCellStyles: "flex justify-center items-center"
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
          Reportes y Novedades del Sistema
        </h1>

        {/* DataTable con los reportes y solicitudes */}
        <DataTable
          columns={getColumns()}
          data={items}
          emptyMessage="No hay reportes o solicitudes disponibles."
          onConsult={handleConsult}
          actions={true}
          // Pasamos un objeto para centrar los botones de acción
          customStyles={customStyles}
        />
      </div>
    </div>
  );
};

export default ReportesYNovedades