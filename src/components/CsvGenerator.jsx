import React, { useState } from 'react';
import Modal from '../components/Modal';

// Componente para el botón de descarga de CSV
const CSVDownloadButton = ({ data, startDate, endDate, disabled }) => {
  const [showModalErrorCSV, setShowModalErrorCSV] = useState(false);
  const [modalMessage, setModalMessage] = useState("¡Error al descargar el historial! Intenta más tarde");

  // Formatear las fechas para mostrar
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para generar el archivo CSV
  const generateCSV = () => {
    try {
      // Validar que existan datos
      if (!data || !Array.isArray(data) || data.length === 0) {
        setModalMessage("No hay datos disponibles para generar el CSV");
        setShowModalErrorCSV(true);
        return;
      }

      // Validar fechas
      if (!startDate || !endDate) {
        setModalMessage("Las fechas de inicio y fin son necesarias para generar el CSV");
        setShowModalErrorCSV(true);
        return;
      }

      // Mostrar mensaje de carga
      const loadingIndicator = document.createElement('div');
      loadingIndicator.style.position = 'fixed';
      loadingIndicator.style.top = '0';
      loadingIndicator.style.left = '0';
      loadingIndicator.style.width = '100%';
      loadingIndicator.style.height = '100%';
      loadingIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
      loadingIndicator.style.display = 'flex';
      loadingIndicator.style.justifyContent = 'center';
      loadingIndicator.style.alignItems = 'center';
      loadingIndicator.style.zIndex = '9999';
      loadingIndicator.style.color = 'white';
      loadingIndicator.style.fontSize = '20px';
      loadingIndicator.innerText = 'Generando CSV...';
      document.body.appendChild(loadingIndicator);

      // Crear el encabezado del CSV con título
      let csvContent = "Historial de Consumo AquaSmart\n";
      csvContent += `Periodo: ${formatDate(startDate)} - ${formatDate(endDate)}\n\n`;
      csvContent += "Fecha,Consumo (L)\n"; // Encabezados de columnas
      
      // Agregar los datos
      data.forEach(item => {
        // Validar que el item tenga las propiedades necesarias
        if (!item || (typeof item.flowRate !== 'number')) {
          throw new Error("Datos inválidos en el conjunto de datos");
        }

        // Determinar la fecha a mostrar
        const date = item.timestamp ? 
          formatDate(item.timestamp) : // Usar timestamp si está disponible
          (item.name || "Fecha desconocida"); // Usar name como alternativa o valor por defecto
        
        // Formatear el valor de consumo con 2 decimales
        const flowRate = item.flowRate.toFixed(2);
        
        // Agregar la fila al CSV
        csvContent += `${date},${flowRate}\n`;
      });
      
      // Crear un blob con el contenido CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Crear un URL para el blob
      const url = URL.createObjectURL(blob);
      
      // Crear un elemento <a> temporal para la descarga
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre del archivo
      const today = new Date();
      const fileName = `historial-consumo-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.csv`;
      link.setAttribute('download', fileName);
      
      // Ocultar el elemento
      link.style.visibility = 'hidden';
      
      // Agregar el elemento al DOM
      document.body.appendChild(link);
      
      // Simular clic para iniciar la descarga
      link.click();
      
      // Limpiar: eliminar el elemento y revocar el URL
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Eliminar el indicador de carga
      document.body.removeChild(loadingIndicator);
    } catch (error) {
      setShowModalErrorCSV(true);
      
      // Asegurarse de que se elimine el indicador de carga en caso de error
      const loadingIndicator = document.querySelector('div[style*="position: fixed"]');
      if (loadingIndicator) {
        document.body.removeChild(loadingIndicator);
      }
    }
  };

  return (
    <>
      <button
        onClick={disabled ? null : generateCSV}
        className={`flex items-center gap-2 ${
          disabled 
            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
            : "bg-[#4c84de] text-white hover:bg-[#689ce6]"
        } px-4 py-2 rounded-full text-md font-semibold`}
        disabled={disabled}
      >
        <img src="/img/csv.png" alt="CSV Icon" width="20" height="20" />
        <span>Descargar CSV</span>
      </button>

      <Modal
        showModal={showModalErrorCSV}
        onClose={() => setShowModalErrorCSV(false)}
        title="Error al generar el CSV"
        btnMessage="Aceptar"
      >
        <p>{modalMessage}</p>
      </Modal>
    </>
  );
};

export { CSVDownloadButton };