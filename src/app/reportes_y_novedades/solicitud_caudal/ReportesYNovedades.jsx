import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../../components/NavBar'
import DataTable from '../../../components/DataTable'
import Modal from '../../../components/Modal'

const ReportesYNovedades = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([
    { id: 1, nombre: 'Solicitud para cambiar el caudal del lote', tipo: 'solicitud' },
    { id: 2, nombre: 'Solicitar activación de caudal del lote', tipo: 'solicitud' },
    { id: 3, nombre: 'Solicitar cancelación de caudal del lote', tipo: 'solicitud' },
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
    switch (item.nombre) {
      case 'Solicitud para cambiar el caudal del lote':
        navigate('/reportes-y-novedades/lotes');
        break;
      case 'Solicitar activación de caudal del lote':
        navigate('/reportes-y-novedades/activar-caudal');
        break;
      case 'Solicitar cancelación de caudal del lote':
        navigate('/reportes-y-novedades/cancelacion_caudal');
        break;
      default:
        navigate('/reportes-y-novedades/lotes');
    }
  };


  // Estilo personalizado para centrar los botones en la columna de acciones
  const customStyles = {
    tableStyles: "",
    tableHeadStyles: "",
    tableBodyStyles: "",
    tableRowStyles: "",
    tableCellStyles: "",
    actionCellStyles: "flex justify-center items-center"
  };

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-2xl font-bold mb-6">
          SOLICITUDES DE CAUDAL
        </h1>

        {/* DataTable con los reportes y solicitudes */}
        <DataTable
          columns={getColumns()}
          data={items}
          emptyMessage="No hay reportes o solicitudes disponibles."
          onApplication={handleConsult}
          actions={true}
          // Pasamos un objeto para centrar los botones de acción
          customStyles={customStyles}
        />
      </div>
    </div>
  );
};

export default ReportesYNovedades