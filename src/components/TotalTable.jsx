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
        
        // Agregar usuario único (usando client_document)
        if (factura.client_document) {
          totals[estado].usuarios.add(factura.client_document.toString());
        }
        
        // Agregar predio único (usando property_id como principal, client_document como fallback)
        const predioId = factura.property_id || factura.client_document || `predio_${index}`;
        if (predioId) {
          totals[estado].predios.add(predioId.toString());
        }
        
        // Agregar lote único (usando lot_code como principal, lot como fallback)
        const loteId = factura.lot_code || factura.lot || `lote_${index}`;
        if (loteId) {
          totals[estado].lotes.add(loteId.toString());
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
  const totalFacturas = totals.pendiente.facturas + totals.pagada.facturas + totals.vencida.facturas + (totals.validada?.facturas || 0);

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
            <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totalFacturas}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                -
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                -
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                -
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                -
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