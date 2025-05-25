import React from 'react';

const TotalTable = ({ data, onDownloadPDF, onDownloadExcel }) => {
  // Función para calcular totalizaciones por estado
  const calculateTotals = () => {
    const totals = {
      pendiente: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      pagada: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      vencida: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      validada: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 }
    };

    console.log('Datos para calcular totales:', data);

    data.forEach((factura, index) => {
      const estado = factura.status?.toLowerCase();
      console.log(`Factura ${index + 1}:`, {
        estado,
        client_document: factura.client_document,
        property_id: factura.property_id,
        lot_code: factura.lot_code,
        lot: factura.lot,
        total_amount: factura.total_amount
      });

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
          console.log(`Procesando lot_code: "${lotCodeStr}"`);
          
          if (lotCodeStr.includes('-')) {
            // Formato xxxxxxx-xxx
            const partes = lotCodeStr.split('-');
            if (partes.length >= 2 && partes[0].length >= 7) {
              predioId = partes[0].substring(0, 7);
              console.log(`Predio extraído del formato con guión: "${predioId}"`);
            } else if (partes[0].length > 0) {
              predioId = partes[0];
              console.log(`Predio extraído (parte antes del guión): "${predioId}"`);
            }
          } else if (lotCodeStr.length >= 7) {
            // Sin guión pero con al menos 7 caracteres
            predioId = lotCodeStr.substring(0, 7);
            console.log(`Predio extraído (primeros 7 chars): "${predioId}"`);
          } else if (lotCodeStr.length > 0) {
            // Usar el código completo si es muy corto
            predioId = lotCodeStr;
            console.log(`Predio extraído (código completo): "${predioId}"`);
          }
        }
        
        // Fallbacks para predioId si no se pudo extraer del lot_code
        if (!predioId && factura.property_id) {
          predioId = factura.property_id.toString().trim();
          console.log(`Predio fallback a property_id: "${predioId}"`);
        } else if (!predioId && factura.client_document) {
          predioId = `predio_${factura.client_document.toString().trim()}`;
          console.log(`Predio fallback a client_document: "${predioId}"`);
        } else if (!predioId) {
          predioId = `predio_${index}`;
          console.log(`Predio fallback a index: "${predioId}"`);
        }
        
        if (predioId && predioId.trim() !== '') {
          totals[estado].predios.add(predioId.trim());
          console.log(`Predio agregado: "${predioId.trim()}"`);
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
      } else {
        console.warn(`Estado desconocido: ${estado}`);
      }
    });

    // Convertir Sets a números y mostrar debug
    Object.keys(totals).forEach(estado => {
      console.log(`${estado} antes de conversión:`, {
        usuarios: Array.from(totals[estado].usuarios),
        predios: Array.from(totals[estado].predios),
        lotes: Array.from(totals[estado].lotes)
      });
      
      totals[estado].usuarios = totals[estado].usuarios.size;
      totals[estado].predios = totals[estado].predios.size;
      totals[estado].lotes = totals[estado].lotes.size;
    });

    console.log('Totales calculados:', totals);
    return totals;
  };

  const totals = calculateTotals();
  
  // Calcular totales generales
  const totalFacturas = totals.pendiente.facturas + totals.pagada.facturas + totals.vencida.facturas + (totals.validada?.facturas || 0);
  const totalUsuarios = new Set();
  const totalPredios = new Set();
  const totalLotes = new Set();
  let totalMonto = 0;

  // Recalcular totales únicos globales
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

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
  };

  // Definir los estados que queremos mostrar
  const estadosAMostrar = [
    { key: 'pendiente', label: 'Pendiente', color: 'bg-fuchsia-500' },
    { key: 'pagada', label: 'Pagada', color: 'bg-green-500' },
    { key: 'vencida', label: 'Vencida', color: 'bg-red-500' },
    { key: 'validada', label: 'Validada', color: 'bg-blue-500' }
  ];

  return (
    <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Resumen de Facturas Filtradas</h2>
        <p className="text-sm text-gray-600 mt-1">Total de facturas analizadas: {data.length}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Estado de Factura
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Cantidad de Facturas
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Cantidad de Usuarios
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Cantidad de Predios
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Cantidad de Lotes
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Monto Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {estadosAMostrar.map((estadoInfo, index) => {
              const estadoData = totals[estadoInfo.key];
              // Solo mostrar filas que tengan al menos una factura
              if (!estadoData || estadoData.facturas === 0) {
                return null;
              }

              return (
                <tr key={estadoInfo.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center">
                      <span className={`w-3 h-3 ${estadoInfo.color} rounded-full mr-2`}></span>
                      <span className="text-sm font-medium text-gray-900">{estadoInfo.label}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {estadoData.facturas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {estadoData.usuarios}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {estadoData.predios}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {estadoData.lotes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                    {formatCurrency(estadoData.monto)}
                  </td>
                </tr>
              );
            })}
            {/* Fila de totales con valores reales */}
            <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totalFacturas}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totalUsuarios.size}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totalPredios.size}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totalLotes.size}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {formatCurrency(totalMonto)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Botones de descarga en la parte inferior derecha */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onDownloadPDF}
          className="flex items-center gap-2 bg-[#365486] text-white hover:bg-[#344663] px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          <img src="/img/pdf.png" alt="PDF Icon" width="20" height="20" />
          <span>Descargar PDF</span>
        </button>
        <button
          onClick={onDownloadExcel}
          className="flex items-center gap-2 bg-[#365486] text-white hover:bg-[#344663] px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          <img src="/img/csv.png" alt="Excel Icon" width="20" height="20" />
          <span>Descargar Excel</span>
        </button>
      </div>
    </div>
  );
};

export default TotalTable;