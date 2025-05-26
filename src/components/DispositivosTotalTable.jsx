"use client"

const DispositivosTotalTable = ({ data, onDownloadPDF, onDownloadExcel }) => {
  // Mapeo de tipos de dispositivos según el requerimiento
  const deviceTypeMap = {
    "01": "Antena",
    "02": "Servidor",
    "03": 'Medidor de Flujo 48"',
    "04": 'Medidor de Flujo 4"',
    "05": 'Válvula 48"',
    "06": 'Válvula 4"',
    "07": "Panel Solar",
    "08": 'Actuador 48"',
    "09": 'Actuador 4"',
    "10": "Controlador de Carga",
    "11": "Batería",
    "12": "Convertidor de Voltaje",
    "13": "Microcontrolador",
    "14": "Traductor de Información TTL",
  }

  // Función para calcular totalizaciones por tipo de dispositivo
  const calculateTotals = () => {
    const totals = {}

    // Inicializar contadores para todos los tipos
    Object.keys(deviceTypeMap).forEach((typeId) => {
      totals[typeId] = {
        name: deviceTypeMap[typeId],
        activos: 0,
        inactivos: 0,
        total: 0,
      }
    })

    // Contar dispositivos por tipo y estado
    data.forEach((dispositivo) => {
      const deviceType = dispositivo.device_type
      if (totals[deviceType]) {
        if (dispositivo.is_active) {
          totals[deviceType].activos += 1
        } else {
          totals[deviceType].inactivos += 1
        }
        totals[deviceType].total += 1
      }
    })

    // Filtrar solo los tipos que tienen dispositivos
    const filteredTotals = {}
    Object.keys(totals).forEach((typeId) => {
      if (totals[typeId].total > 0) {
        filteredTotals[typeId] = totals[typeId]
      }
    })

    return filteredTotals
  }

  const totals = calculateTotals()

  // Calcular totales generales
  const totalActivos = Object.values(totals).reduce((sum, type) => sum + type.activos, 0)
  const totalInactivos = Object.values(totals).reduce((sum, type) => sum + type.inactivos, 0)
  const totalDispositivos = totalActivos + totalInactivos

  return (
    <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Inventario de Dispositivos del Distrito</h2>
        <p className="text-sm text-gray-600 mt-1">Total de dispositivos analizados: {data.length}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Tipo de Dispositivo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Cantidad Estado Activo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Cantidad Estado Inactivo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(totals).map(([typeId, typeData], index) => (
              <tr key={typeId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{typeData.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{typeData.activos}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{typeData.inactivos}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                  {typeData.total}
                </td>
              </tr>
            ))}
            {/* Fila de totales */}
            <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totalActivos}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totalInactivos}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {totalDispositivos}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Botones de descarga en la parte inferior derecha */}
      <div className="flex justify-center gap-3 mt-6">
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
  )
}

export default DispositivosTotalTable
