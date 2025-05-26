"use client"

import { useState } from "react"
import * as XLSX from "xlsx"

const useDispositivosExcelDownload = ({ data, filters, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false)

  // Mapeo de tipos de dispositivos
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

  // Formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("es-CO")
  }

  // Formatea la fecha para el nombre del archivo
  const getFileName = () => {
    const today = new Date()
    return `inventario-dispositivos-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.xlsx`
  }

  // Función principal para generar el Excel
  const generateExcel = async () => {
    if (isGenerating) return

    try {
      setIsGenerating(true)

      // Mostrar indicador de carga
      const loadingIndicator = document.createElement("div")
      loadingIndicator.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 9999;
        color: white; font-size: 20px;
      `
      loadingIndicator.innerText = "Generando Excel..."
      document.body.appendChild(loadingIndicator)

      // Calcular totales
      const totals = calculateTotals()

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new()

      // ========== HOJA 1: INFORMACIÓN GENERAL ==========
      const summaryData = [
        ["AQUASMART - INVENTARIO DE DISPOSITIVOS DEL DISTRITO"],
        [""],
        ["Fecha de creación:", formatDate(new Date().toISOString())],
        ["Total de dispositivos analizados:", data.length],
        [""],
        ["FILTROS APLICADOS:"],
      ]

      // Agregar información de filtros
      if (filters.startDate || filters.endDate) {
        const startDateText = filters.startDate ? formatDate(filters.startDate) : "No especificada"
        const endDateText = filters.endDate ? formatDate(filters.endDate) : "No especificada"
        summaryData.push(["Fecha de inventario (inicio):", startDateText])
        summaryData.push(["Fecha de inventario (fin):", endDateText])
      }
      if (filters.iot_id) {
        summaryData.push(["ID del dispositivo:", filters.iot_id])
      }
      if (filters.name) {
        summaryData.push(["Nombre del dispositivo:", filters.name])
      }
      if (filters.plotId) {
        summaryData.push(["ID del predio:", filters.plotId])
      }
      if (filters.isActive !== "") {
        const statusText = filters.isActive === "true" ? "Activos" : "Inactivos"
        summaryData.push(["Estado de dispositivo:", statusText])
      }

      summaryData.push(
        [""],
        ["RESUMEN POR TIPO DE DISPOSITIVO:"],
        [""],
        ["Tipo de Dispositivo", "Cantidad Estado Activo", "Cantidad Estado Inactivo", "Total"],
      )

      // Agregar filas de datos solo para tipos que tienen dispositivos
      let totalActivos = 0
      let totalInactivos = 0
      let totalDispositivos = 0

      Object.entries(totals).forEach(([typeId, typeData]) => {
        summaryData.push([typeData.name, typeData.activos, typeData.inactivos, typeData.total])
        totalActivos += typeData.activos
        totalInactivos += typeData.inactivos
        totalDispositivos += typeData.total
      })

      summaryData.push(["Total", totalActivos, totalInactivos, totalDispositivos])

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

      // Ajustar anchos de columnas
      summarySheet["!cols"] = [{ width: 30 }, { width: 25 }, { width: 25 }, { width: 15 }]

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen")

      // ========== HOJA 2: DETALLE DE DISPOSITIVOS ==========
      const dispositivoData = [
        ["DETALLE DE DISPOSITIVOS FILTRADOS"],
        [""],
        [
          "ID Dispositivo",
          "Nombre del Dispositivo",
          "Tipo del Dispositivo",
          "ID del Predio",
          "Estado",
          "Fecha de Registro",
        ],
      ]

      // Agregar datos de los dispositivos
      data.forEach((dispositivo) => {
        const deviceTypeName = deviceTypeMap[dispositivo.device_type] || "Desconocido"
        const statusText = dispositivo.is_active ? "Activo" : "Inactivo"
        const registrationDate = dispositivo.registration_date ? formatDate(dispositivo.registration_date) : "N/A"

        dispositivoData.push([
          dispositivo.iot_id || "",
          dispositivo.name || "",
          deviceTypeName,
          dispositivo.id_plot || "",
          statusText,
          registrationDate,
        ])
      })

      const dispositivoSheet = XLSX.utils.aoa_to_sheet(dispositivoData)

      // Ajustar anchos de columnas para la hoja de detalle
      dispositivoSheet["!cols"] = [
        { width: 15 },
        { width: 25 },
        { width: 25 },
        { width: 15 },
        { width: 12 },
        { width: 18 },
      ]

      // Agregar la hoja de detalle al libro
      XLSX.utils.book_append_sheet(workbook, dispositivoSheet, "Detalle de Dispositivos")

      // ========== HOJA 3: ESTADÍSTICAS ADICIONALES ==========
      const estadisticasData = [
        ["ESTADÍSTICAS ADICIONALES"],
        [""],
        ["DISTRIBUCIÓN POR TIPO:"],
        ["Tipo de Dispositivo", "Cantidad", "Porcentaje"],
      ]

      Object.entries(totals).forEach(([typeId, typeData]) => {
        const porcentaje = totalDispositivos > 0 ? ((typeData.total / totalDispositivos) * 100).toFixed(2) : 0
        estadisticasData.push([typeData.name, typeData.total, `${porcentaje}%`])
      })

      estadisticasData.push(
        [""],
        ["DISTRIBUCIÓN POR ESTADO:"],
        ["Estado", "Cantidad", "Porcentaje"],
        [
          "Activos",
          totalActivos,
          `${totalDispositivos > 0 ? ((totalActivos / totalDispositivos) * 100).toFixed(2) : 0}%`,
        ],
        [
          "Inactivos",
          totalInactivos,
          `${totalDispositivos > 0 ? ((totalInactivos / totalDispositivos) * 100).toFixed(2) : 0}%`,
        ],
      )

      const estadisticasSheet = XLSX.utils.aoa_to_sheet(estadisticasData)

      // Ajustar anchos de columnas para estadísticas
      estadisticasSheet["!cols"] = [{ width: 25 }, { width: 15 }, { width: 15 }]

      // Agregar la hoja de estadísticas al libro
      XLSX.utils.book_append_sheet(workbook, estadisticasSheet, "Estadísticas")

      // Generar y descargar el archivo
      XLSX.writeFile(workbook, getFileName())

      // Remover indicador de carga
      document.body.removeChild(loadingIndicator)
    } catch (error) {
      console.error("Error al generar Excel:", error)
      if (onError) {
        onError("Error al generar el archivo Excel. Por favor, inténtalo de nuevo.")
      }

      // Remover indicador de carga en caso de error
      const loadingIndicator = document.querySelector('div[style*="position: fixed"]')
      if (loadingIndicator) {
        document.body.removeChild(loadingIndicator)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return { generateExcel, isGenerating }
}

export default useDispositivosExcelDownload
