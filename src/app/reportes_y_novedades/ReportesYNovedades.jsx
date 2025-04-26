import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../components/NavBar'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

const ReportesYNovedades = () => {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([
    { id: 1, nombre: 'Solicitud de cambiar el caudal del lote' },
    { id: 2, nombre: 'Informe de Ventas Primer Trimestre' },
    { id: 3, nombre: 'Novedades del Sistema v2.3' },
    { id: 4, nombre: 'Reporte de Incidencias Técnicas' },
    { id: 5, nombre: 'Estado de Proyectos en Desarrollo' }
  ]);
  
  // Configuración de columnas para DataTable
  const getColumns = () => [
    { 
      key: "nombre", 
      label: "Nombre",
    },
  ];

  // Función para manejar la solicitud y redireccionar
  const handleSolicitar = () => {
    // Redireccionar a una página de solicitud o detalle con el ID del reporte
    navigate(`/reportes-y-novedades/lotes`);
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

        {/* DataTable con los reportes */}
        <DataTable
          columns={getColumns()}
          data={reportes}
          emptyMessage="No hay reportes o novedades disponibles."
          onConsult={handleSolicitar}
          actions={true}
          // Pasamos un objeto para centrar los botones de acción
          customStyles={customStyles}
        />
      </div>
    </div>
  );
};

export default ReportesYNovedades