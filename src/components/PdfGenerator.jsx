import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Modal from '../components/Modal';

// Componente para el botón de descarga con jsPDF
const PDFDownloadButton = ({ data, startDate, endDate, chartRef, disabled }) => {
  const [showModalErrorPDF, setShowModalErrorPDF] = useState(false);
  const [modalMessage, setModalMessage] = useState("¡Error al descargar el historial! Intenta más tarde");

  // Formatear las fechas para mostrar
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Formatea la fecha para el nombre del archivo
  const getFileName = () => {
    const today = new Date();
    return `historial-consumo-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.pdf`;
  };

  // Función para dibujar una tabla en el PDF
  const drawTable = (doc, data, startIndex, maxRows, tableX, startY, colWidth, rowHeight, isFirstPage) => {
    let currentY = startY;
    let endIndex = Math.min(startIndex + maxRows, data.length);
    
    // Dibujar encabezados de la tabla
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(200, 200, 200);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    
    const tableWidth = colWidth.reduce((a, b) => a + b, 0);
    
    // Dibujar fondo del encabezado
    doc.rect(tableX, currentY, tableWidth, rowHeight, 'F');
    
    // Dibujar texto del encabezado
    doc.text('Fecha', tableX + colWidth[0]/2, currentY + rowHeight/2 + 2, { align: 'center' });
    doc.text('Consumo L', tableX + colWidth[0] + colWidth[1]/2, currentY + rowHeight/2 + 2, { align: 'center' });
    
    currentY += rowHeight;
    
    // Dibujar filas de datos
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    
    for (let i = startIndex; i < endIndex; i++) {
      // Alternar colores de fondo para las filas
      if ((i - startIndex) % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(tableX, currentY, tableWidth, rowHeight, 'F');
      }
      
      const item = data[i];
      const date = item.timestamp ? formatDate(item.timestamp) : item.name;
      const flowRate = `${item.flowRate.toFixed(2)} L`;
      
      // Dibujar texto de las celdas
      doc.text(date, tableX + colWidth[0]/2, currentY + rowHeight/2 + 2, { align: 'center' });
      doc.text(flowRate, tableX + colWidth[0] + colWidth[1]/2, currentY + rowHeight/2 + 2, { align: 'center' });
      
      // Dibujar líneas de la tabla
      doc.setDrawColor(230, 230, 230);
      doc.line(tableX, currentY, tableX + tableWidth, currentY);
      
      currentY += rowHeight;
    }
    
    // Dibujar línea inferior de la tabla
    doc.line(tableX, currentY, tableX + tableWidth, currentY);
    
    return endIndex;
  };

  // Generar el PDF con jsPDF sin usar autoTable y con soporte para múltiples páginas
  const generatePDF = async () => {
    // Verificar si la referencia al gráfico existe
    if (!chartRef.current) {
      console.error('No se pudo encontrar la referencia al gráfico');
      setModalMessage("No se pudo encontrar la referencia al gráfico");
      setShowModalErrorPDF(true);
      return;
    }

    try {
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
      loadingIndicator.innerText = 'Generando PDF...';
      document.body.appendChild(loadingIndicator);

      // Capturar el gráfico como una imagen
      const canvas = await html2canvas(chartRef.current, {
        scale: 2, // Escala para mejor calidad
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const chartImgData = canvas.toDataURL('image/png');
      
      // Crear un nuevo documento PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Cargar el logo
      let logoWidth = 20;
      let logoHeight = 20;
      let logoX = 20;
      let logoY = 20;

      try {
        // Esperar a que se cargue el logo
        const logoImg = new Image();
        logoImg.src = '/img/logopdf.png';
        // Podemos esperar a que la imagen cargue
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn('No se pudo cargar el logo, continuando sin él', error);
      }
      
      // Agregar título
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('AquaSmart', 45, 30);
      
      // Agregar subtítulo
      doc.setFontSize(16);
      doc.text(document.querySelector('h1').textContent, pageWidth / 2, 50, { align: 'center' });
      
      // Agregar rango de fechas
      doc.setFontSize(12);
      doc.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, pageWidth / 2, 60, { align: 'center' });
      
      
      // Agregar la imagen del gráfico
      const chartWidth = 170;
      const chartHeight = (canvas.height * chartWidth) / canvas.width;
      const chartX = (pageWidth - chartWidth) / 2;
      const chartY = 70 + 10;
      
      doc.addImage(chartImgData, 'PNG', chartX, chartY, chartWidth, chartHeight);
      
      // Configuración de la tabla
      const tableY = chartY + chartHeight + 10;
      const colWidth = [100, 50]; // Ancho de las columnas
      const rowHeight = 8; // Alto de filas
      const tableWidth = colWidth.reduce((a, b) => a + b, 0);
      const tableX = (pageWidth - tableWidth) / 2;
      
      // Configuración para paginación de la tabla
      const maxRowsFirstPage = Math.floor((pageHeight - tableY - 20) / rowHeight); // Filas que caben en la primera página
      const maxRowsOtherPages = Math.floor((pageHeight - 40 - 20) / rowHeight); // Filas que caben en otras páginas
      
      // Dibujar la primera parte de la tabla en la primera página
      let currentDataIndex = 0;
      
      currentDataIndex = drawTable(
        doc, 
        data, 
        currentDataIndex, 
        maxRowsFirstPage, 
        tableX, 
        tableY, 
        colWidth, 
        rowHeight,
        true
      );
      
      // Agregar pie de página
      const footerText = `Generado por AquaSmart © ${new Date().getFullYear()} - Página 1`;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Si hay más datos, continuar en páginas adicionales
      let pageNum = 1;
      
      while (currentDataIndex < data.length) {
        // Añadir nueva página
        doc.addPage();
        pageNum++;
        
        // Agregar encabezado simple para las páginas adicionales
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Historial de consumo (continuación)', pageWidth / 2, 20, { align: 'center' });
        
        // Dibujar la siguiente parte de la tabla
        currentDataIndex = drawTable(
          doc, 
          data, 
          currentDataIndex, 
          maxRowsOtherPages, 
          tableX, 
          40, // Comenzar la tabla más abajo para dejar espacio al encabezado
          colWidth, 
          rowHeight,
          false
        );
        
        // Agregar pie de página para esta página
        const pageFooter = `Generado por AquaSmart © ${new Date().getFullYear()} - Página ${pageNum}`;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(pageFooter, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      // Guardar el PDF
      doc.save(getFileName());
      
      // Eliminar el indicador de carga
      document.body.removeChild(loadingIndicator);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      setModalMessage(`¡Error al descargar el historial! Intenta más tarde`);
      setShowModalErrorPDF(true);
      
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
        onClick={disabled ? null : generatePDF}
        className={`flex items-center gap-2 ${
          disabled 
            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
            : "bg-[#4c84de] text-white hover:bg-[#689ce6]"
        } px-4 py-2 rounded-full text-md font-semibold`}
        disabled={disabled}
      >
        <img src="/img/pdf.png" alt="PDF Icon" width="25" height="25" />
        <span>Descargar PDF</span>
      </button>
      
      <Modal
        showModal={showModalErrorPDF}
        onClose={() => setShowModalErrorPDF(false)}
        title="Error al generar el PDF"
        btnMessage="Aceptar"
      >
        <p>{modalMessage}</p>
      </Modal>
    </>
  );
};

export { PDFDownloadButton };