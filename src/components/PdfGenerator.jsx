import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Modal from '../components/Modal';

// Componente para el botón de descarga con jsPDF unificado
const PDFDownloadButton = ({ 
  data, 
  startDate, 
  endDate, 
  chartRef, 
  disabled,
  // Nuevos props para detectar el tipo de reporte
  reportType = null, // 'distrito', 'predio', 'lote' o null (auto-detectar)
  entityInfo = null, // Información de la entidad (predio, lote, distrito)
  title = null // Título personalizado
}) => {
  const [showModalErrorPDF, setShowModalErrorPDF] = useState(false);
  const [modalMessage, setModalMessage] = useState("¡Error al descargar el historial! Intenta más tarde");

  // Auto-detectar tipo de reporte basado en el título o entityInfo
  const detectReportType = () => {
    if (reportType) return reportType;
    
    if (title) {
      if (title.toLowerCase().includes('distrito')) return 'distrito';
      if (title.toLowerCase().includes('predio')) return 'predio';
      if (title.toLowerCase().includes('lote')) return 'lote';
    }
    
    if (entityInfo) {
      if (entityInfo.predioId || entityInfo.predioName) return 'predio';
      if (entityInfo.loteId || entityInfo.loteName) return 'lote';
      if (entityInfo.distritoId || entityInfo.distritoName) return 'distrito';
    }
    
    return 'distrito'; // Por defecto
  };

  const currentReportType = detectReportType();

  // Formatear las fechas para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Formatea la fecha para el nombre del archivo
  const getFileName = () => {
    const today = new Date();
    const typePrefix = {
      distrito: 'historial-consumo-distrito',
      predio: 'historial-consumo-predio',
      lote: 'historial-consumo-lote'
    };
    return `${typePrefix[currentReportType]}-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.pdf`;
  };

  // Función para dibujar la marca de agua
  const drawWatermark = (doc) => {
    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
  
      // Cargar la imagen de marca de agua
      const watermarkImg = new Image();
      watermarkImg.src = "/img/marca_de_agua.png";
  
      // Configurar posición centrada
      const watermarkWidth = 250;
      const watermarkHeight = 100;
      const x = (pageWidth - watermarkWidth) / 2;
      const y = (pageHeight - watermarkHeight) / 2;

      const positionConfig = {
        x: 12,  // Distancia desde el borde izquierdo
        y: 90   // Distancia desde el borde superior
      };
  
      // Guardar estado gráfico actual
      doc.saveGraphicsState();
  
      // Aplicar transparencia SOLO a la marca de agua
      doc.setGState(new doc.GState({ opacity: 0.09 })); // 9% de opacidad
  
      // Agregar la imagen con transparencia
      doc.addImage(
        watermarkImg,
        "PNG",
        positionConfig.x,
        positionConfig.y,
        watermarkWidth,
        watermarkHeight
      );
  
      // Restaurar estado gráfico anterior (sin transparencia)
      doc.restoreGraphicsState();
  
    } catch (error) {
      console.warn("No se pudo cargar la marca de agua:", error);
    }
  };

  // Función para dibujar el encabezado de la empresa
  const drawHeader = (doc) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo (si existe)
    try {
      const logoImg = new Image();
      logoImg.src = "/img/logo.png";
      doc.addImage(logoImg, "PNG", 15, 15, 80, 25); // define el ancho y el alto donde 15 es el eje x y 15 es el eje y
    } catch (error) {
      // Si no hay logo, dibujar un círculo como placeholder
      doc.setFillColor(52, 152, 219);
      doc.circle(27.5, 27.5, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("AS", 27.5, 31, { align: "center" });
    }

    // Información de la empresa (lado derecho)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("NIT: 891180084", pageWidth - 15, 20, { align: "right" })
    doc.text("Teléfono: 88754753", pageWidth - 15, 28, { align: "right" })
    doc.text("Av. Pastrana Borrero - Carrera 1", pageWidth - 15, 36, { align: "right" })

    return 50; // Retorna la posición Y donde termina el header
  };

  // Función para dibujar el fondo ondulado inferior con numeración mejorada
  const drawWaveFooter = (doc, currentPageNum, totalPages) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Dibujar onda decorativa en la parte inferior
    doc.setFillColor(64, 188, 165);

    // Crear rectángulo base de la onda
    const waveHeight = 40;
    const waveY = pageHeight - waveHeight;

    doc.setDrawColor(64, 188, 165);
    doc.setLineWidth(0);

    // Dibujar rectángulo base de la onda
    doc.rect(0, waveY + 15, pageWidth, waveHeight, "F");

    // Numeración de páginas mejorada
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(`Página ${currentPageNum} de ${totalPages}`, pageWidth - 30, pageHeight - 15, { align: "right" });
  };

  // Función auxiliar para dibujar cajas de información
  const drawInfoBox = (doc, x, y, width, height, label, value) => {
    // Fondo azul claro
    doc.setFillColor(230, 240, 255);
    doc.setDrawColor(200, 220, 240);
    doc.rect(x, y, width, height, "FD");

    // Texto del label
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text(label, x + 3, y + 8);

    // Texto del valor
    doc.setFont(undefined, "normal");
    doc.text(value, x + 3, y + 16);
  };

  // Función para dibujar información de la entidad según el tipo
  const drawEntityInfo = (doc, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título principal según el tipo
    const titles = {
      distrito: `HISTORIAL DEL CONSUMO DEL DISTRITO`,
      predio: `RESUMEN DE CONSUMO PREDIO ${entityInfo?.predioId || ''}`,
      lote: `RESUMEN DE CONSUMO LOTE ${entityInfo?.loteId || ''}`
    };

    doc.setTextColor(52, 84, 134);
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(titles[currentReportType], pageWidth / 2, startY, { align: "center" });

    // Fecha de creación
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(`Fecha creación de informe: ${formatDate(new Date().toISOString())}`, pageWidth / 2, startY + 15, {
      align: "center",
    });

    let currentY = startY + 35;

    // Información específica según el tipo de reporte
    if (currentReportType === 'predio' || currentReportType === 'lote') {
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Información mostrada:", 20, currentY);
      currentY += 20;

      // Crear cajas de información
      const boxWidth = 85;
      const boxHeight = 20;
      const gap = 10;
      const startX = 20;

      // Primera fila de cajas
      let boxX = startX;
      let boxY = currentY;

      // Caja ID predio/lote
      const entityLabel = currentReportType === 'predio' ? 'ID predio:' : 'ID lote:';
      const entityValue = currentReportType === 'predio' ? 
        (entityInfo?.predioId || 'N/A') : 
        (entityInfo?.loteId || 'N/A');
      drawInfoBox(doc, boxX, boxY, boxWidth, boxHeight, entityLabel, entityValue);

      // Caja Nombre predio/lote
      boxX += boxWidth + gap;
      const nameLabel = currentReportType === 'predio' ? 'Nombre predio:' : 'Nombre lote:';
      const nameValue = currentReportType === 'predio' ? 
        (entityInfo?.predioName || 'N/A') : 
        (entityInfo?.loteName || 'N/A');
      drawInfoBox(doc, boxX, boxY, boxWidth, boxHeight, nameLabel, nameValue);

      // Segunda fila de cajas
      boxX = startX;
      boxY += boxHeight + gap;

      // Caja ID dueño
      drawInfoBox(doc, boxX, boxY, boxWidth, boxHeight, 'ID dueño:', entityInfo?.ownerId || 'N/A');

      // Caja Nombre dueño
      boxX += boxWidth + gap;
      drawInfoBox(doc, boxX, boxY, boxWidth, boxHeight, 'Nombre dueño:', entityInfo?.ownerName || 'N/A');

      // Rango de fechas (caja más ancha)
      boxX = startX;
      boxY += boxHeight + gap;
      const dateBoxWidth = (boxWidth * 2) + gap;
      drawInfoBox(doc, boxX, boxY, dateBoxWidth, boxHeight, 'Rango fechas de consumo:', `${formatDate(startDate)} - ${formatDate(endDate)}`);

      currentY = boxY + boxHeight + 30;
    } else {
      // Para distrito, solo mostrar rango de fechas centrado
      doc.setFontSize(12);
      doc.text(`Período: ${formatDate(startDate)} - ${formatDate(endDate)}`, pageWidth / 2, currentY, { align: "center" });
      currentY += 30;
    }

    return currentY;
  };

  // Función auxiliar para filtrar datos
  const filterData = (data, filterStartDate, filterEndDate) => {
    if (!filterStartDate || !filterEndDate) return data;
    
    const startDateObj = new Date(filterStartDate);
    const endDateObj = new Date(filterEndDate);
    endDateObj.setHours(23, 59, 59, 999);
    
    return data.filter(item => {
      const itemDate = new Date(item.timestamp || item.date || item.name);
      return itemDate >= startDateObj && itemDate <= endDateObj;
    });
  };

  // Función auxiliar para calcular páginas necesarias para la tabla
  const calculateTablePages = (totalRows) => {
    if (totalRows === 0) return 1;
    
    const spacing = calculateTableSpacing();
    const maxRowsPerPage = Math.floor((spacing.availableHeight - spacing.rowHeight) / spacing.rowHeight);
    
    return Math.ceil(totalRows / maxRowsPerPage);
  };
  const calculateTableSpacing = () => {
    const pageHeight = 297; // A4 height in mm
    const headerHeight = 50;
    const footerHeight = 55; // Aumentado para más margen
    const safeMargin = 25; // Aumentado margen de seguridad para evitar solapamiento
    const totalRowHeight = 15; // Espacio adicional para la fila de total
    
    return {
      availableHeight: pageHeight - headerHeight - footerHeight - safeMargin - totalRowHeight,
      rowHeight: 12,
      minRowsForNewPage: 5 // Mínimo de filas para justificar una nueva página
    };
  };

  // Función para dibujar encabezados de tabla
  const drawTableHeader = (doc, tableX, currentY, tableWidth, colWidths, headers, rowHeight) => {
    // Encabezados con fondo verde
    doc.setFillColor(144, 198, 149);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");

    // Dibujar fondo del encabezado
    doc.rect(tableX, currentY, tableWidth, rowHeight, "F");

    let xPos = tableX;
    headers.forEach((header, index) => {
      doc.text(header, xPos + colWidths[index] / 2, currentY + rowHeight / 2 + 2, { align: "center" });
      xPos += colWidths[index];
    });

    return currentY + rowHeight;
  };

  // Función mejorada para dibujar la tabla de detalle de consumo
  const drawConsumptionTable = (doc, data, startY, filterStartDate = null, filterEndDate = null, forceNewPage = false) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const spacing = calculateTableSpacing();

    // Si forceNewPage es true (para lotes/predios), crear nueva página
    if (forceNewPage) {
      doc.addPage();
      drawWatermark(doc);
      startY = drawHeader(doc) + 20;
    }

    // Título
    doc.setTextColor(52, 84, 134);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("DETALLE DE CONSUMO", pageWidth / 2, startY, { align: "center" });

    const tableY = startY + 15;
    const tableWidth = 120;
    const tableX = (pageWidth - tableWidth) / 2;
    const rowHeight = spacing.rowHeight;
    const colWidths = [60, 60]; // Fecha y Consumo
    const headers = ["Fecha", "Consumo m³"];

    let currentY = tableY;

    console.log('Datos recibidos para la tabla PDF:', data);
    console.log('Cantidad de datos:', data.length);

    // Filtrar datos por rango de fechas si están definidas
    let filteredData = data;
    if (filterStartDate && filterEndDate) {
      const startDateObj = new Date(filterStartDate);
      const endDateObj = new Date(filterEndDate);
      endDateObj.setHours(23, 59, 59, 999); // Incluir todo el día final
      
      filteredData = data.filter(item => {
        const itemDate = new Date(item.timestamp || item.date || item.name);
        return itemDate >= startDateObj && itemDate <= endDateObj;
      });
      
      console.log(`Datos filtrados por fecha (${filterStartDate} a ${filterEndDate}):`, filteredData.length);
    }

    const totalRows = filteredData.length;
    if (totalRows === 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text("No hay datos de consumo para mostrar en el período seleccionado", pageWidth / 2, currentY + 30, { align: "center" });
      return currentY + 60;
    }

    // Si estamos en una página nueva (forzada), tenemos todo el espacio disponible
    const maxRowsCurrentPage = forceNewPage ? 
      Math.floor((spacing.availableHeight - rowHeight) / rowHeight) : 
      Math.floor((spacing.availableHeight - (currentY - 50) - rowHeight) / rowHeight);

    // Dibujar encabezado inicial
    currentY = drawTableHeader(doc, tableX, currentY, tableWidth, colWidths, headers, rowHeight);

    // Variables para manejo de páginas
    let totalConsumption = 0;
    let currentPageRows = 0;
    const maxRowsPerNewPage = Math.floor((spacing.availableHeight - rowHeight) / rowHeight);
    
    // Si estamos en página forzada, usar el máximo de filas completo
    const initialMaxRows = forceNewPage ? maxRowsPerNewPage : maxRowsCurrentPage;
    
    // Determinar número total de páginas necesarias para la tabla
    let totalPagesForTable = 1;
    let remainingRows = totalRows;
    remainingRows -= maxRowsCurrentPage; // Restar las que caben en la primera página
    
    if (remainingRows > 0) {
      totalPagesForTable += Math.ceil(remainingRows / maxRowsPerNewPage);
    }

    // Procesar cada fila de datos
    filteredData.forEach((item, index) => {
      const isLastRow = index === totalRows - 1;
      const currentMaxRows = (doc.internal.getNumberOfPages() === 1) ? maxRowsCurrentPage : maxRowsPerNewPage;
      
      // Verificar si necesitamos una nueva página
      const needsNewPage = currentPageRows >= currentMaxRows && !isLastRow;
      
      // Si necesitamos nueva página y quedan suficientes filas para justificarla
      const remainingRowsIncludingCurrent = totalRows - index;
      const shouldCreateNewPage = needsNewPage && remainingRowsIncludingCurrent >= spacing.minRowsForNewPage;

      if (shouldCreateNewPage) {
        // Completar página actual con footer
        const currentPageNum = doc.internal.getNumberOfPages();
        const totalPages = currentPageNum + Math.ceil((totalRows - index) / maxRowsPerNewPage) + 1; // +1 para la página del gráfico
        drawWaveFooter(doc, currentPageNum, totalPages);
        
        // Nueva página
        doc.addPage();
        drawWatermark(doc);
        currentY = drawHeader(doc) + 20;
        currentPageRows = 0;
        
        // Redibujar encabezados de tabla
        currentY = drawTableHeader(doc, tableX, currentY, tableWidth, colWidths, headers, rowHeight);
      }

      // Preparar datos de la fila
      let date = 'N/A';
      let consumption = 0;

      // Extraer fecha
      if (item.timestamp) {
        date = formatDate(item.timestamp);
      } else if (item.date) {
        date = formatDate(item.date);
      } else if (item.name) {
        date = item.name; // Para datos agrupados por día/semana/mes
      }

      // Extraer consumo - probar múltiples campos
      if (item.flowRate !== undefined && item.flowRate !== null) {
        consumption = Number(item.flowRate);
      } else if (item.flow_rate !== undefined && item.flow_rate !== null) {
        consumption = Number(item.flow_rate);
      } else if (item.consumption !== undefined && item.consumption !== null) {
        consumption = Number(item.consumption);
      } else if (item.value !== undefined && item.value !== null) {
        consumption = Number(item.value);
      } else if (item.total !== undefined && item.total !== null) {
        consumption = Number(item.total);
      } else if (item.y !== undefined && item.y !== null) {
        consumption = Number(item.y); // Para datos de gráficos
      }

      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development' && index < 3) {
        console.log(`Fila ${index}:`, {
          date,
          consumption,
          originalItem: item
        });
      }

      totalConsumption += consumption;

      // Alternar colores de fondo (blanco y gris muy claro)
      if (currentPageRows % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(tableX, currentY, tableWidth, rowHeight, "F");
      }

      // Dibujar datos de la fila
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");

      const rowData = [
        date,
        `${consumption.toFixed(2)} m³`
      ];

      let xPos = tableX;
      rowData.forEach((cellData, cellIndex) => {
        doc.text(cellData, xPos + colWidths[cellIndex] / 2, currentY + rowHeight / 2 + 2, { align: "center" });
        xPos += colWidths[cellIndex];
      });

      currentY += rowHeight;
      currentPageRows++;
    });

    // Fila de total
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.setFillColor(220, 220, 220);
    doc.rect(tableX, currentY, tableWidth, rowHeight, "F");

    doc.text("Total consumo:", tableX + colWidths[0] / 2, currentY + rowHeight / 2 + 2, { align: "center" });
    doc.text(`${totalConsumption.toFixed(2)} m³`, tableX + colWidths[0] + colWidths[1] / 2, currentY + rowHeight / 2 + 2, { align: "center" });

    // Agregar información adicional en el footer si hay espacio
    const addFooterInfo = (doc, currentY) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      const availableSpace = pageHeight - currentY - 60; // 60mm para footer y márgenes
      
      if (availableSpace > 30) { // Si hay al menos 30mm de espacio
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont(undefined, "italic");
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text("Reporte generado automáticamente por AquaSmart", pageWidth / 2, currentY + 20, { align: "center" });
      }
      
      return currentY;
    };
  };

  // Generar el PDF con jsPDF
  const generatePDF = async () => {
    // Verificar si la referencia al gráfico existe
    if (!chartRef?.current) {
      console.error('No se pudo encontrar la referencia al gráfico');
      setModalMessage("No se pudo encontrar la referencia al gráfico");
      setShowModalErrorPDF(true);
      return;
    }

    try {
      // Mostrar mensaje de carga
      const loadingIndicator = document.createElement('div');
      loadingIndicator.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 9999;
        color: white; font-size: 20px;
      `;
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

      // Páginas principales: Información principal
      drawWatermark(doc);
      let currentY = drawHeader(doc);
      currentY = drawEntityInfo(doc, currentY + 10);
      
      // Determinar si necesitamos forzar nueva página para la tabla
      const shouldForceNewPage = currentReportType === 'predio' || currentReportType === 'lote';
      
      // Si no es página forzada, agregar footer a la página de información
      if (shouldForceNewPage) {
        const currentPageNum = 1;
        // Calcular total de páginas: info + tabla(s) + gráfico
        const filteredData = filterData(data, startDate, endDate);
        const tablePagesNeeded = calculateTablePages(filteredData.length);
        const totalPages = 1 + tablePagesNeeded + 1; // info + tabla + gráfico
        
        drawWaveFooter(doc, currentPageNum, totalPages);
      }
      
      // Dibujar tabla de consumo
      const tableResult = drawConsumptionTable(doc, data, currentY, startDate, endDate, shouldForceNewPage);
      
      // Obtener número total de páginas después de la tabla
      const tablePages = doc.internal.getNumberOfPages();
      
      // Página final: Gráfica de totalización
      doc.addPage();
      drawWatermark(doc);
      currentY = drawHeader(doc);

      // Título de la gráfica
      doc.setTextColor(52, 84, 134);
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text("GRAFICA DE TOTALIZACIÓN DE CONSUMO", pageWidth / 2, currentY + 20, { align: "center" });

      // Agregar la imagen del gráfico
      const chartWidth = 170;
      const chartHeight = (canvas.height * chartWidth) / canvas.width;
      const chartX = (pageWidth - chartWidth) / 2;
      const chartY = currentY + 40;
      
      doc.addImage(chartImgData, 'PNG', chartX, chartY, chartWidth, chartHeight);

      // Calcular número total final de páginas
      const finalTotalPages = doc.internal.getNumberOfPages();

      // Actualizar numeración en todas las páginas
      for (let i = 1; i <= finalTotalPages; i++) {
        doc.setPage(i);
        drawWaveFooter(doc, i, finalTotalPages);
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