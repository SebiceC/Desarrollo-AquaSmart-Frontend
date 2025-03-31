import React from 'react';

// Componente para el botón de descarga de CSV
const CSVDownloadButton = ({ data, startDate, endDate }) => {
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
    // Crear el encabezado del CSV con título
    let csvContent = "Historial de Consumo AquaSmart\n";
    csvContent += `Periodo: ${formatDate(startDate)} - ${formatDate(endDate)}\n\n`;
    csvContent += "Fecha,Consumo (m³)\n"; // Encabezados de columnas
    
    // Agregar los datos
    data.forEach(item => {
      // Determinar la fecha a mostrar
      const date = item.timestamp ? 
        formatDate(item.timestamp) : // Usar timestamp si está disponible
        item.name; // Usar name como alternativa
      
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
  };

  return (
    <button
      onClick={generateCSV}
      className="flex items-center gap-2 bg-[#4c84de] text-white px-4 py-2 rounded-full text-md font-semibold hover:bg-[#689ce6]"
    >
      <img src="/img/csv.png" alt="CSV Icon" width="20" height="20" />
      <span>Descargar CSV</span>
    </button>
  );
};

export { CSVDownloadButton };