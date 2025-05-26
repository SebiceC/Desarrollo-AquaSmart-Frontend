import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../components/Modal';

const ExcelDownloadTotales = ({ data, filters, onError }) => {
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

  // Formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
  };

  // Formatea la fecha para el nombre del archivo
  const getFileName = () => {
    const today = new Date();
    return `resumen-facturas-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.xlsx`;
  };

  // Función principal para generar el Excel
  const generateExcel = async () => {
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
      loadingIndicator.innerText = 'Generando Excel...';
      document.body.appendChild(loadingIndicator);
      
      // Calcular totales
      const totals = calculateTotals();
      const totalFacturas = totals.pendiente.facturas + totals.pagada.facturas + totals.vencida.facturas + totals.validada.facturas;
      
      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new();
      
      // ========== HOJA 1: RESUMEN ==========
      const summaryData = [
        ['AQUASMART - RESUMEN DE FACTURAS FILTRADAS'],
        [''],
        ['Fecha de generación:', formatDate(new Date().toISOString())],
        ['Total de facturas analizadas:', data.length],
        [''],
        ['FILTROS APLICADOS:'],
      ];
      
      // Agregar información de filtros
      if (filters.startDate || filters.endDate) {
        summaryData.push(['Rango de fechas:', `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`]);
      }
      if (filters.id) {
        summaryData.push(['Código de factura:', filters.id]);
      }
      if (filters.ownerDocument) {
        summaryData.push(['Documento del propietario:', filters.ownerDocument]);
      }
      if (filters.lotId) {
        summaryData.push(['ID del lote:', filters.lotId]);
      }
      if (filters.isActive !== '') {
        const statusText = filters.isActive === 'true' ? 'Pagadas' : 'Pendientes';
        summaryData.push(['Estado de factura:', statusText]);
      }
      
      summaryData.push(
        [''],
        ['RESUMEN POR ESTADO DE FACTURA:'],
        [''],
        ['Estado de Factura', 'Cantidad de Facturas', 'Cantidad de Usuarios', 'Cantidad de Predios', 'Cantidad de Lotes', 'Monto Total']
      );

      // Agregar filas de datos solo para estados que tienen facturas
      const estadosConDatos = [
        { key: 'pendiente', label: 'Pendiente' },
        { key: 'pagada', label: 'Pagada' },
        { key: 'vencida', label: 'Vencida' },
        { key: 'validada', label: 'Validada' }
      ];

      estadosConDatos.forEach(estado => {
        if (totals[estado.key].facturas > 0) {
          summaryData.push([
            estado.label,
            totals[estado.key].facturas,
            totals[estado.key].usuarios,
            totals[estado.key].predios,
            totals[estado.key].lotes,
            totals[estado.key].monto
          ]);
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

      summaryData.push([
        'TOTAL', 
        totalFacturas, 
        totalUsuarios.size, 
        totalPredios.size, 
        totalLotes.size, 
        totalMonto
      ]);
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Ajustar anchos de columnas
      summarySheet['!cols'] = [
        { width: 25 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 }
      ];
      
      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
      
      // ========== HOJA 2: DETALLE DE FACTURAS ==========
      const facturaData = [
        ['DETALLE DE FACTURAS FILTRADAS'],
        [''],
        ['Código Factura', 'Código Lote', 'Nombre Cliente', 'Documento Cliente', 'Monto Total', 'Estado', 'Fecha Creación', 'Fecha Vencimiento']
      ];
      
      // Agregar datos de las facturas
      data.forEach(factura => {
        facturaData.push([
          factura.code || '',
          factura.lot_code || '',
          factura.client_name || '',
          factura.client_document || '',
          parseFloat(factura.total_amount || 0),
          factura.status || '',
          formatDate(factura.creation_date),
          formatDate(factura.due_payment_date)
        ]);
      });
      
      const facturaSheet = XLSX.utils.aoa_to_sheet(facturaData);
      
      // Ajustar anchos de columnas para la hoja de detalle
      facturaSheet['!cols'] = [
        { width: 15 },
        { width: 15 },
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 12 },
        { width: 15 },
        { width: 15 }
      ];
      
      // Agregar la hoja de detalle al libro
      XLSX.utils.book_append_sheet(workbook, facturaSheet, 'Detalle de Facturas');
      
      // ========== HOJA 3: ESTADÍSTICAS ADICIONALES ==========
      const estadisticasData = [
        ['ESTADÍSTICAS ADICIONALES'],
        [''],
        ['DISTRIBUCIÓN POR ESTADO:'],
        ['Estado', 'Cantidad', 'Porcentaje'],
      ];
      
      estadosConDatos.forEach(estado => {
        const cantidad = totals[estado.key].facturas;
        if (cantidad > 0) {
          const porcentaje = totalFacturas > 0 ? ((cantidad / totalFacturas) * 100).toFixed(2) : 0;
          estadisticasData.push([estado.label, cantidad, `${porcentaje}%`]);
        }
      });
      
      estadisticasData.push(
        [''],
        ['RESUMEN DE MONTOS:'],
        ['Estado', 'Monto Total', 'Promedio por Factura'],
      );
      
      estadosConDatos.forEach(estado => {
        const monto = totals[estado.key].monto;
        const cantidad = totals[estado.key].facturas;
        if (cantidad > 0) {
          const promedio = cantidad > 0 ? (monto / cantidad).toFixed(2) : 0;
          estadisticasData.push([estado.label, monto, promedio]);
        }
      });
      
      const estadisticasSheet = XLSX.utils.aoa_to_sheet(estadisticasData);
      
      // Ajustar anchos de columnas para estadísticas
      estadisticasSheet['!cols'] = [
        { width: 20 },
        { width: 20 },
        { width: 20 }
      ];
      
      // Agregar la hoja de estadísticas al libro
      XLSX.utils.book_append_sheet(workbook, estadisticasSheet, 'Estadísticas');
      
      // Generar y descargar el archivo
      XLSX.writeFile(workbook, getFileName());
      
      // Remover indicador de carga
      document.body.removeChild(loadingIndicator);
      
    } catch (error) {
      console.error('Error al generar Excel:', error);
      if (onError) {
        onError('Error al generar el archivo Excel. Por favor, inténtalo de nuevo.');
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

  return { generateExcel, isGenerating };
};

export { ExcelDownloadTotales };