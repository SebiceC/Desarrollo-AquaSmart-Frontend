import React, { useState } from 'react';
import jsPDF from 'jspdf';
import Modal from './Modal';

const PDFDownloadTotales = ({ data, filters, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Función para calcular totalizaciones por estado - CORREGIDA
  const calculateTotals = () => {
    const totals = {
      pendiente: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      pagada: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      vencida: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      validada: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 }
    };

    data.forEach((factura, index) => {
      const estado = factura.status?.toLowerCase();

      if (totals[estado]) {
        // Incrementar cantidad de facturas
        totals[estado].facturas += 1;
        
        // Agregar usuario único (usando client_document) - Solo si existe y no es null/undefined
        if (factura.client_document && factura.client_document !== null && factura.client_document !== undefined) {
          const clientDoc = factura.client_document.toString().trim();
          if (clientDoc !== '') {
            totals[estado].usuarios.add(clientDoc);
          }
        }
        
        // Extraer predio único del lot_code (primeros 7 dígitos)
        let predioId = null;
        if (factura.lot_code && factura.lot_code !== null && factura.lot_code !== undefined) {
          const lotCodeStr = factura.lot_code.toString().trim();
          
          if (lotCodeStr.includes('-')) {
            // Formato xxxxxxx-xxx
            const partes = lotCodeStr.split('-');
            if (partes.length >= 2 && partes[0].length >= 7) {
              predioId = partes[0].substring(0, 7);
            } else if (partes[0].length > 0) {
              predioId = partes[0];
            }
          } else if (lotCodeStr.length >= 7) {
            // Sin guión pero con al menos 7 caracteres
            predioId = lotCodeStr.substring(0, 7);
          } else if (lotCodeStr.length > 0) {
            // Usar el código completo si es muy corto
            predioId = lotCodeStr;
          }
        }
        
        // Fallbacks para predioId si no se pudo extraer del lot_code
        if (!predioId && factura.property_id) {
          predioId = factura.property_id.toString().trim();
        } else if (!predioId && factura.client_document) {
          predioId = `predio_${factura.client_document.toString().trim()}`;
        } else if (!predioId) {
          predioId = `predio_${index}`;
        }
        
        if (predioId && predioId.trim() !== '') {
          totals[estado].predios.add(predioId.trim());
        }
        
        // Agregar lote único (usando lot_code como principal, lot como fallback)
        let loteId = null;
        if (factura.lot_code && factura.lot_code !== null && factura.lot_code !== undefined) {
          loteId = factura.lot_code.toString().trim();
        } else if (factura.lot && factura.lot !== null && factura.lot !== undefined) {
          loteId = factura.lot.toString().trim();
        } else {
          loteId = `lote_${index}`;
        }
        
        if (loteId && loteId !== '') {
          totals[estado].lotes.add(loteId);
        }
        
        // Sumar monto (asegurarse de que sea un número válido)
        const monto = parseFloat(factura.total_amount) || 0;
        totals[estado].monto += monto;
      }
    });

    // Convertir Sets a números
    Object.keys(totals).forEach(estado => {
      totals[estado].usuarios = totals[estado].usuarios.size;
      totals[estado].predios = totals[estado].predios.size;
      totals[estado].lotes = totals[estado].lotes.size;
    });

    return totals;
  };

  // Formatear fechas para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Formatea la fecha para el nombre del archivo
  const getFileName = () => {
    const today = new Date();
    return `resumen-facturas-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.pdf`;
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
  };

  // Función para dibujar la tabla de resumen
  const drawSummaryTable = (doc, totals, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = 170;
    const tableX = (pageWidth - tableWidth) / 2;
    const rowHeight = 12;
    const colWidths = [40, 25, 25, 25, 25, 30]; // Anchos de columnas
    
    let currentY = startY;
    
    // Encabezados
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(200, 200, 200);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    
    // Dibujar fondo del encabezado
    doc.rect(tableX, currentY, tableWidth, rowHeight, 'F');
    
    // Texto de encabezados
    const headers = ['Estado', 'Facturas', 'Usuarios', 'Predios', 'Lotes', 'Monto Total'];
    let xPos = tableX;
    headers.forEach((header, index) => {
      doc.text(header, xPos + colWidths[index]/2, currentY + rowHeight/2 + 2, { align: 'center' });
      xPos += colWidths[index];
    });
    
    currentY += rowHeight;
    
    // Datos de las filas - solo mostrar estados con facturas
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    
    const estados = [
      { key: 'pendiente', label: 'Pendiente' },
      { key: 'pagada', label: 'Pagada' },
      { key: 'vencida', label: 'Vencida' },
      { key: 'validada', label: 'Validada' }
    ];
    
    let rowIndex = 0;
    estados.forEach((estado) => {
      const data = totals[estado.key];
      // Solo mostrar si tiene facturas
      if (data.facturas > 0) {
        // Alternar colores de fondo
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(tableX, currentY, tableWidth, rowHeight, 'F');
        }
        
        const rowData = [
          estado.label,
          data.facturas.toString(),
          data.usuarios.toString(),
          data.predios.toString(),
          data.lotes.toString(),
          formatCurrency(data.monto)
        ];
        
        xPos = tableX;
        rowData.forEach((cellData, cellIndex) => {
          const align = cellIndex === 0 ? 'left' : 'center';
          const xPosition = cellIndex === 0 ? xPos + 3 : xPos + colWidths[cellIndex]/2;
          doc.text(cellData, xPosition, currentY + rowHeight/2 + 2, { align });
          xPos += colWidths[cellIndex];
        });
        
        // Línea horizontal
        doc.setDrawColor(230, 230, 230);
        doc.line(tableX, currentY, tableX + tableWidth, currentY);
        
        currentY += rowHeight;
        rowIndex++;
      }
    });
    
    // Calcular totales únicos globales
    const totalUsuarios = new Set();
    const totalPredios = new Set();
    const totalLotes = new Set();
    let totalMonto = 0;

    data.forEach((factura, index) => {
      // Usuarios únicos globales
      if (factura.client_document && factura.client_document !== null && factura.client_document !== undefined) {
        const clientDoc = factura.client_document.toString().trim();
        if (clientDoc !== '') {
          totalUsuarios.add(clientDoc);
        }
      }

      // Predios únicos globales
      let predioId = null;
      if (factura.lot_code && factura.lot_code !== null && factura.lot_code !== undefined) {
        const lotCodeStr = factura.lot_code.toString().trim();
        if (lotCodeStr.includes('-')) {
          const partes = lotCodeStr.split('-');
          if (partes.length >= 2 && partes[0].length >= 7) {
            predioId = partes[0].substring(0, 7);
          } else if (partes[0].length > 0) {
            predioId = partes[0];
          }
        } else if (lotCodeStr.length >= 7) {
          predioId = lotCodeStr.substring(0, 7);
        } else if (lotCodeStr.length > 0) {
          predioId = lotCodeStr;
        }
      }

      if (!predioId && factura.property_id) {
        predioId = factura.property_id.toString().trim();
      } else if (!predioId && factura.client_document) {
        predioId = `predio_${factura.client_document.toString().trim()}`;
      } else if (!predioId) {
        predioId = `predio_${index}`;
      }

      if (predioId && predioId.trim() !== '') {
        totalPredios.add(predioId.trim());
      }

      // Lotes únicos globales
      let loteId = null;
      if (factura.lot_code && factura.lot_code !== null && factura.lot_code !== undefined) {
        loteId = factura.lot_code.toString().trim();
      } else if (factura.lot && factura.lot !== null && factura.lot !== undefined) {
        loteId = factura.lot.toString().trim();
      } else {
        loteId = `lote_${index}`;
      }

      if (loteId && loteId !== '') {
        totalLotes.add(loteId);
      }

      // Sumar monto total
      const monto = parseFloat(factura.total_amount) || 0;
      totalMonto += monto;
    });
    
    // Fila de totales
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(220, 220, 220);
    doc.rect(tableX, currentY, tableWidth, rowHeight, 'F');
    
    const totalFacturas = totals.pendiente.facturas + totals.pagada.facturas + totals.vencida.facturas + totals.validada.facturas;
    const totalRow = [
      'Total', 
      totalFacturas.toString(), 
      totalUsuarios.size.toString(), 
      totalPredios.size.toString(), 
      totalLotes.size.toString(), 
      formatCurrency(totalMonto)
    ];
    
    xPos = tableX;
    totalRow.forEach((cellData, cellIndex) => {
      const align = cellIndex === 0 ? 'left' : 'center';
      const xPosition = cellIndex === 0 ? xPos + 3 : xPos + colWidths[cellIndex]/2;
      doc.text(cellData, xPosition, currentY + rowHeight/2 + 2, { align });
      xPos += colWidths[cellIndex];
    });
    
    // Líneas finales de la tabla
    doc.line(tableX, currentY, tableX + tableWidth, currentY);
    doc.line(tableX, currentY + rowHeight, tableX + tableWidth, currentY + rowHeight);
    
    return currentY + rowHeight + 10;
  };

  // Función principal para generar el PDF
  const generatePDF = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      
      // Mostrar indicador de carga
      const loadingIndicator = document.createElement('div');
      loadingIndicator.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 9999;
        color: white; font-size: 20px;
      `;
      loadingIndicator.innerText = 'Generando PDF...';
      document.body.appendChild(loadingIndicator);
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Cargar y agregar logo
      let logoY = 20;
      try {
        const logoImg = new Image();
        logoImg.src = '/img/logopdf.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        doc.addImage(logoImg, 'PNG', 20, logoY, 20, 20);
      } catch (error) {
        console.warn('No se pudo cargar el logo');
      }
      
      // Título principal
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('AquaSmart', 45, 30);
      
      // Subtítulo
      doc.setFontSize(16);
      doc.text('Resumen de Facturas Filtradas', pageWidth / 2, 50, { align: 'center' });
      
      // Información de filtros aplicados
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      let filterInfo = 'Filtros aplicados: ';
      let filterY = 65;
      
      if (filters.startDate || filters.endDate) {
        filterInfo += `Fechas: ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)} | `;
      }
      if (filters.id) {
        filterInfo += `Código: ${filters.id} | `;
      }
      if (filters.ownerDocument) {
        filterInfo += `Documento: ${filters.ownerDocument} | `;
      }
      if (filters.lotId) {
        filterInfo += `Lote: ${filters.lotId} | `;
      }
      if (filters.isActive !== '') {
        const statusText = filters.isActive === 'true' ? 'Pagadas' : 'Pendientes';
        filterInfo += `Estado: ${statusText} | `;
      }
      
      // Remover el último " | "
      filterInfo = filterInfo.replace(/ \| $/, '');
      
      doc.text(filterInfo, pageWidth / 2, filterY, { align: 'center' });
      
      // Calcular totales y dibujar tabla
      const totals = calculateTotals();
      const tableStartY = 80;
      
      const tableEndY = drawSummaryTable(doc, totals, tableStartY);
      
      // Información adicional
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total de facturas analizadas: ${data.length}`, pageWidth / 2, tableEndY + 20, { align: 'center' });
      doc.text(`Fecha de generación: ${formatDate(new Date().toISOString())}`, pageWidth / 2, tableEndY + 30, { align: 'center' });
      
      // Pie de página
      const footerText = `Generado por AquaSmart © ${new Date().getFullYear()}`;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Guardar PDF
      doc.save(getFileName());
      
      // Remover indicador de carga
      document.body.removeChild(loadingIndicator);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      if (onError) {
        onError('Error al generar el PDF. Por favor, inténtalo de nuevo.');
      }
      
      // Remover indicador de carga en caso de error
      const loadingIndicator = document.querySelector('div[style*="position: fixed"]');
      if (loadingIndicator) {
        document.body.removeChild(loadingIndicator);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePDF, isGenerating };
};

export { PDFDownloadTotales };