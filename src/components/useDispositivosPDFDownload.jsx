"use client"

import { useState } from "react"
import jsPDF from "jspdf"

const useDispositivosPDFDownload = ({ data, filters, onError }) => {
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
    return `inventario-dispositivos-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.pdf`
  }

  // Función para dibujar la tabla de resumen
  const drawSummaryTable = (doc, totals, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const tableWidth = 170
    const tableX = (pageWidth - tableWidth) / 2
    const rowHeight = 10
    const colWidths = [60, 35, 35, 40] // Anchos de columnas

    let currentY = startY

    // Encabezados
    doc.setFillColor(240, 240, 240)
    doc.setDrawColor(200, 200, 200)
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(9)

    // Dibujar fondo del encabezado
    doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

    // Texto de encabezados
    const headers = ["Tipo de Dispositivo", "Activos", "Inactivos", "Total"]
    let xPos = tableX
    headers.forEach((header, index) => {
      doc.text(header, xPos + colWidths[index] / 2, currentY + rowHeight / 2 + 2, { align: "center" })
      xPos += colWidths[index]
    })

    currentY += rowHeight

    // Datos de las filas
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)

    let rowIndex = 0
    let totalActivos = 0
    let totalInactivos = 0
    let totalDispositivos = 0

    Object.entries(totals).forEach(([typeId, typeData]) => {
      // Alternar colores de fondo
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(tableX, currentY, tableWidth, rowHeight, "F")
      }

      const rowData = [
        typeData.name,
        typeData.activos.toString(),
        typeData.inactivos.toString(),
        typeData.total.toString(),
      ]

      xPos = tableX
      rowData.forEach((cellData, cellIndex) => {
        const align = cellIndex === 0 ? "left" : "center"
        const xPosition = cellIndex === 0 ? xPos + 3 : xPos + colWidths[cellIndex] / 2
        doc.text(cellData, xPosition, currentY + rowHeight / 2 + 2, { align })
        xPos += colWidths[cellIndex]
      })

      // Línea horizontal
      doc.setDrawColor(230, 230, 230)
      doc.line(tableX, currentY, tableX + tableWidth, currentY)

      totalActivos += typeData.activos
      totalInactivos += typeData.inactivos
      totalDispositivos += typeData.total

      currentY += rowHeight
      rowIndex++
    })

    // Fila de totales
    doc.setFontSize(9)
    doc.setFont(undefined, "bold")
    doc.setFillColor(220, 220, 220)
    doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

    const totalRow = ["Total", totalActivos.toString(), totalInactivos.toString(), totalDispositivos.toString()]

    xPos = tableX
    totalRow.forEach((cellData, cellIndex) => {
      const align = cellIndex === 0 ? "left" : "center"
      const xPosition = cellIndex === 0 ? xPos + 3 : xPos + colWidths[cellIndex] / 2
      doc.text(cellData, xPosition, currentY + rowHeight / 2 + 2, { align })
      xPos += colWidths[cellIndex]
    })

    // Líneas finales de la tabla
    doc.line(tableX, currentY, tableX + tableWidth, currentY)
    doc.line(tableX, currentY + rowHeight, tableX + tableWidth, currentY + rowHeight)

    return currentY + rowHeight + 15
  }

  // Función para dibujar la tabla de detalle de dispositivos
  const drawDetailTable = (doc, data, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const tableWidth = 170
    const tableX = (pageWidth - tableWidth) / 2
    const rowHeight = 8
    const colWidths = [25, 35, 35, 25, 25, 25] // Anchos de columnas

    let currentY = startY

    // Verificar si necesitamos una nueva página
    if (currentY > pageHeight - 50) {
      doc.addPage()
      currentY = 20
    }

    // Título de la segunda tabla
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text("Detalle de Dispositivos", pageWidth / 2, currentY, { align: "center" })
    currentY += 15

    // Encabezados
    doc.setFillColor(240, 240, 240)
    doc.setDrawColor(200, 200, 200)
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(8)

    // Dibujar fondo del encabezado
    doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

    // Texto de encabezados
    const headers = ["ID Dispositivo", "Nombre", "Tipo", "ID Predio", "Estado", "Registro"]
    let xPos = tableX
    headers.forEach((header, index) => {
      doc.text(header, xPos + colWidths[index] / 2, currentY + rowHeight / 2 + 2, { align: "center" })
      xPos += colWidths[index]
    })

    currentY += rowHeight

    // Datos de las filas
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(7)

    data.forEach((dispositivo, index) => {
      // Verificar si necesitamos una nueva página
      if (currentY > pageHeight - 20) {
        doc.addPage()
        currentY = 20

        // Redibujar encabezados en la nueva página
        doc.setFillColor(240, 240, 240)
        doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

        xPos = tableX
        headers.forEach((header, headerIndex) => {
          doc.text(header, xPos + colWidths[headerIndex] / 2, currentY + rowHeight / 2 + 2, { align: "center" })
          xPos += colWidths[headerIndex]
        })

        currentY += rowHeight
      }

      // Alternar colores de fondo
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(tableX, currentY, tableWidth, rowHeight, "F")
      }

      const deviceTypeName = deviceTypeMap[dispositivo.device_type] || "Desconocido"
      const statusText = dispositivo.is_active ? "Activo" : "Inactivo"
      const registrationDate = dispositivo.registration_date ? formatDate(dispositivo.registration_date) : "N/A"

      const rowData = [
        dispositivo.iot_id || "",
        dispositivo.name || "",
        deviceTypeName,
        dispositivo.id_plot || "",
        statusText,
        registrationDate,
      ]

      xPos = tableX
      rowData.forEach((cellData, cellIndex) => {
        const align = "center"
        const xPosition = xPos + colWidths[cellIndex] / 2
        // Truncar texto si es muy largo
        const truncatedText = cellData.length > 12 ? cellData.substring(0, 12) + "..." : cellData
        doc.text(truncatedText, xPosition, currentY + rowHeight / 2 + 2, { align })
        xPos += colWidths[cellIndex]
      })

      // Línea horizontal
      doc.setDrawColor(230, 230, 230)
      doc.line(tableX, currentY, tableX + tableWidth, currentY)

      currentY += rowHeight
    })

    // Línea final de la tabla
    doc.line(tableX, currentY, tableX + tableWidth, currentY)

    return currentY
  }

  // Función principal para generar el PDF
  const generatePDF = async () => {
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
      loadingIndicator.innerText = "Generando PDF..."
      document.body.appendChild(loadingIndicator)

      const doc = new jsPDF("p", "mm", "a4")
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Cargar y agregar logo
      const logoY = 20
      try {
        const logoImg = new Image()
        logoImg.src = "/img/logopdf.png"
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
        })
        doc.addImage(logoImg, "PNG", 20, logoY, 20, 20)
      } catch (error) {
        console.warn("No se pudo cargar el logo")
      }

      // Título principal
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 0)
      doc.text("AquaSmart", 45, 30)

      // Subtítulo
      doc.setFontSize(16)
      doc.text("Inventario de Dispositivos del Distrito", pageWidth / 2, 50, { align: "center" })

      // Información de fechas
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Fecha de creación: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 65, { align: "center" })

      if (filters.startDate || filters.endDate) {
        const startDateText = filters.startDate ? formatDate(filters.startDate) : "No especificada"
        const endDateText = filters.endDate ? formatDate(filters.endDate) : "No especificada"
        doc.text(`Fecha de inventario (inicio): ${startDateText}`, pageWidth / 2, 75, { align: "center" })
        doc.text(`Fecha de inventario (fin): ${endDateText}`, pageWidth / 2, 85, { align: "center" })
      }

      // Calcular totales y dibujar primera tabla
      const totals = calculateTotals()
      const firstTableStartY = 100

      // Título de la primera tabla
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "bold")
      doc.text("Resumen por Tipo de Dispositivo", pageWidth / 2, firstTableStartY - 10, { align: "center" })

      const firstTableEndY = drawSummaryTable(doc, totals, firstTableStartY)

      // Dibujar segunda tabla (detalle de dispositivos)
      drawDetailTable(doc, data, firstTableEndY)

      // Pie de página en la última página
      const footerText = `Generado por AquaSmart © ${new Date().getFullYear()}`
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" })

      // Guardar PDF
      doc.save(getFileName())

      // Remover indicador de carga
      document.body.removeChild(loadingIndicator)
    } catch (error) {
      console.error("Error al generar PDF:", error)
      if (onError) {
        onError("Error al generar el PDF. Por favor, inténtalo de nuevo.")
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

  return { generatePDF, isGenerating }
}

export default useDispositivosPDFDownload
