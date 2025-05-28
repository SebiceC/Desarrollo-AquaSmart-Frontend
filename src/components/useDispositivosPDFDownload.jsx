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

  // Nombre del archivo
  const getFileName = () => {
    const today = new Date()
    return `inventario-dispositivos-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.pdf`
  }

  // Función para dibujar la marca de agua
  const drawWatermark = (doc) => {
    try {
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Cargar la imagen de marca de agua
      const watermarkImg = new Image()
      watermarkImg.src = "../../public/img/marca_de_agua.png"

      // Configurar posición centrada
      const watermarkWidth = 250
      const watermarkHeight = 100
      const x = (pageWidth - watermarkWidth) / 2
      const y = (pageHeight - watermarkHeight) / 2

      const positionConfig = {
        x: 12,  // Distancia desde el borde izquierdo
        y: 90   // Distancia desde el borde superior
      }

      // Guardar estado gráfico actual
      doc.saveGraphicsState()

      // Aplicar transparencia SOLO a la marca de agua
      doc.setGState(new doc.GState({ opacity: 0.09 })) // 9% de opacidad

      // Agregar la imagen con transparencia
      doc.addImage(
        watermarkImg,
        "PNG",
        positionConfig.x,
        positionConfig.y,
        watermarkWidth,
        watermarkHeight
      )

      // Restaurar estado gráfico anterior (sin transparencia)
      doc.restoreGraphicsState()

    } catch (error) {
      console.warn("No se pudo cargar la marca de agua:", error)
    }
  }

  // Función para dibujar el encabezado de la empresa
  const drawHeader = (doc) => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Logo (si existe)
    try {
      const logoImg = new Image()
      logoImg.src = "/img/logo.png"
      doc.addImage(logoImg, "PNG", 15, 15, 80, 25) //define el ancho y el alto donde 15 es el eje x y 15 es el eje y
    } catch (error) {
      // Si no hay logo, dibujar un círculo como placeholder
      doc.setFillColor(52, 152, 219)
      doc.circle(27.5, 27.5, 12, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.text("AS", 27.5, 31, { align: "center" })
    }

    // Información de la empresa (lado derecho)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text("NIT: 891180084", pageWidth - 15, 20, { align: "right" })
    doc.text("Teléfono: 88754753", pageWidth - 15, 28, { align: "right" })
    doc.text("Av. Pastrana Borrero - Carrera 1", pageWidth - 15, 36, { align: "right" })

    return 50 // Retorna la posición Y donde termina el header
  }

  // Función para dibujar el fondo ondulado inferior
  const drawWaveFooter = (doc) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Dibujar onda decorativa en la parte inferior
    doc.setFillColor(64, 188, 165)

    // Crear path de onda
    const waveHeight = 40
    const waveY = pageHeight - waveHeight

    doc.setDrawColor(64, 188, 165)
    doc.setLineWidth(0)

    // Dibujar rectángulo base de la onda
    doc.rect(0, waveY + 15, pageWidth, waveHeight, "F")
  }

  // Función para dibujar filtros aplicados
  const drawFilters = (doc, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Título principal
    doc.setTextColor(52, 84, 134)
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.text("RESUMEN DE DISPOSITIVOS", pageWidth / 2, startY, { align: "center" })

    // Fecha de creación
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text(`Fecha creación de informe: ${formatDate(new Date().toISOString())}`, pageWidth / 2, startY + 15, {
      align: "center",
    })

    // Información de filtros en cajas
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")

    // Título filtros
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("Filtros aplicados:", 20, startY + 35)

    // Cajas de filtros - usar el mismo estilo del código de referencia
    const boxWidth = 30
    const boxHeight = 20
    const gap = 1
    const numBoxes = 5

    const totalBoxWidth = numBoxes * boxWidth + (numBoxes - 1) * gap
    const startX = (pageWidth - totalBoxWidth) / 2
    const boxY = startY + 45

    let boxX = startX
    boxX = drawFilterBox(doc, boxX, boxY, boxWidth, boxHeight, "ID dispositivo:", filters.iot_id || "Todas")
    boxX += gap // Agregar gap después de cada caja
    boxX = drawFilterBox(doc, boxX, boxY, boxWidth, boxHeight, "Nombre dispositivo:", filters.name || "Todos")
    boxX += gap
    boxX = drawFilterBox(doc, boxX, boxY, boxWidth, boxHeight, "ID predio:", filters.plotId || "Todos")
    boxX += gap
    boxX = drawFilterBox(doc, boxX, boxY, boxWidth, boxHeight, "Estado:", filters.isActive === "true" ? "Activo" : filters.isActive === "false" ? "Inactivo" : "Todos")
    boxX += gap
    boxX = drawFilterBox(
      doc,
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      "Fecha de creación:",
      filters.startDate || filters.endDate
        ? `${formatDate(filters.startDate) || "Todas"} - ${formatDate(filters.endDate) || "Todas"}`
        : "Todas",
    )

    return boxY + boxHeight + 20
  }

  // Función auxiliar para dibujar cajas de filtros
  const drawFilterBox = (doc, x, y, width, height, label, value) => {
    // Fondo azul claro
    doc.setFillColor(230, 240, 255)
    doc.setDrawColor(200, 220, 240)
    doc.rect(x, y, width, height, "FD")

    // Texto del label
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont(undefined, "bold")
    doc.text(label, x + 2, y + 8)

    // Texto del valor
    doc.setFont(undefined, "normal")
    doc.text(value, x + 2, y + 16)

    return x + width // devuelve solo la posición X sin gap
  }

  // Función para dibujar la tabla de detalle de dispositivos
  const drawDetailTable = (doc, data, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Título
    doc.setTextColor(52, 84, 134)
    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("DETALLE DE DISPOSITIVOS", pageWidth / 2, startY, { align: "center" })

    const tableY = startY + 15
    const tableWidth = 170
    const tableX = (pageWidth - tableWidth) / 2
    const rowHeight = 10
    const colWidths = [25, 30, 35, 25, 25, 30]

    let currentY = tableY
    let pageNumber = 1

    // Función para dibujar encabezados
    const drawHeaders = () => {
      // Encabezados con fondo verde
      doc.setFillColor(144, 198, 149)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont(undefined, "bold")

      doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

      const headers = ["ID Dispositivo", "Nombre", "Tipo", "ID Predio", "Estado", "Fecha Registro"]
      let xPos = tableX
      headers.forEach((header, index) => {
        doc.text(header, xPos + colWidths[index] / 2, currentY + rowHeight / 2 + 2, { align: "center" })
        xPos += colWidths[index]
      })

      currentY += rowHeight
    }

    // Dibujar encabezados iniciales
    drawHeaders()

    // Datos de las filas
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(7)
    doc.setFont(undefined, "normal")

    data.forEach((dispositivo, index) => {
      // Verificar si necesitamos una nueva página
      if (currentY > pageHeight - 60) {
        drawWaveFooter(doc)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont(undefined, "bold")
        // No mostrar total de páginas hasta que sepamos el número real
        doc.text(`Pagina ${pageNumber}`, pageWidth - 30, pageHeight - 15, { align: "right" })
        
        doc.addPage()
        pageNumber++
        drawWatermark(doc)
        currentY = drawHeader(doc) + 20

        // Redibujar encabezados
        drawHeaders()
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(7)
        doc.setFont(undefined, "normal")
      }

      // Alternar colores de fondo (blanco y gris muy claro)
      if (index % 2 === 1) {
        doc.setFillColor(248, 248, 248)
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

      let xPos = tableX
      rowData.forEach((cellData, cellIndex) => {
        const align = "center"
        const xPosition = xPos + colWidths[cellIndex] / 2
        // Truncar texto de manera más inteligente según el contenido
        let truncatedText = cellData
        if (cellIndex === 1 && cellData.length > 12) { // Nombre
          truncatedText = cellData.substring(0, 9) + "..."
        } else if (cellIndex === 2 && cellData.length > 15) { // Tipo
          truncatedText = cellData.substring(0, 12) + "..."
        } else if (cellData.length > 12) { // Otros campos
          truncatedText = cellData.substring(0, 9) + "..."
        }
        doc.text(truncatedText, xPosition, currentY + rowHeight / 2 + 2, { align })
        xPos += colWidths[cellIndex]
      })

      currentY += rowHeight
    })

    return { currentY: currentY + 20, pageNumber }
  }

  // Función para dibujar la tabla de totalización
  const drawTotalizationTable = (doc, totals, startY, pageNumber) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Verificar si necesitamos una nueva página para la tabla de totalización
    const requiredSpace = 100 + Object.keys(totals).length * 12 // Espacio estimado
    if (startY + requiredSpace > pageHeight - 60) {
      drawWaveFooter(doc)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text(`Pagina ${pageNumber}`, pageWidth - 30, pageHeight - 15, { align: "right" })
      
      doc.addPage()
      pageNumber++
      drawWatermark(doc)
      startY = drawHeader(doc) + 20
    }

    // Título
    doc.setTextColor(52, 84, 134)
    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("TABLA DE TOTALIZACIÓN", pageWidth / 2, startY, { align: "center" })

    const tableY = startY + 15
    const tableWidth = 170
    const tableX = (pageWidth - tableWidth) / 2
    const rowHeight = 12
    const colWidths = [60, 37, 37, 36]

    let currentY = tableY

    // Encabezados con fondo verde
    doc.setFillColor(144, 198, 149)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")

    doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

    const headers = ["Tipo de Dispositivo", "Activos", "Inactivos", "Total"]
    let xPos = tableX
    headers.forEach((header, index) => {
      doc.text(header, xPos + colWidths[index] / 2, currentY + rowHeight / 2 + 2, { align: "center" })
      xPos += colWidths[index]
    })

    currentY += rowHeight

    // Datos de las filas
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont(undefined, "normal")

    let totalActivos = 0
    let totalInactivos = 0
    let totalDispositivos = 0

    let rowIndex = 0
    Object.entries(totals).forEach(([typeId, typeData]) => {
      // Alternar colores de fondo
      if (rowIndex % 2 === 1) {
        doc.setFillColor(248, 248, 248)
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

      totalActivos += typeData.activos
      totalInactivos += typeData.inactivos
      totalDispositivos += typeData.total

      currentY += rowHeight
      rowIndex++
    })

    // Fila de totales
    doc.setFontSize(10)
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

    return { currentY: currentY + rowHeight + 20, pageNumber }
  }

  // Función para dibujar gráfica de barras
  const drawBarChart = (doc, totals, startY, pageNumber) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Verificar si necesitamos una nueva página para la gráfica
    if (startY + 120 > pageHeight - 60) {
      drawWaveFooter(doc)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text(`Pagina ${pageNumber}`, pageWidth - 30, pageHeight - 15, { align: "right" })
      
      doc.addPage()
      pageNumber++
      drawWatermark(doc)
      startY = drawHeader(doc) + 20
    }

    // Título
    doc.setTextColor(52, 84, 134)
    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("GRAFICA DE TOTALIZACIÓN", pageWidth / 2, startY, { align: "center" })

    const chartY = startY + 20

    // Leyenda
    const legendY = chartY + 10
    const colors = {
      activo: [91, 192, 222],
      inactivo: [52, 84, 134],
    }

    doc.setFontSize(9)
    let legendX = pageWidth / 2 - 30
    Object.entries(colors).forEach(([estado, color]) => {
      doc.setFillColor(color[0], color[1], color[2])
      doc.circle(legendX, legendY, 3, "F")
      doc.setTextColor(0, 0, 0)
      doc.text(estado.charAt(0).toUpperCase() + estado.slice(1), legendX + 8, legendY + 2)
      legendX += 40
    })

    // Área del gráfico
    const graphY = chartY + 25
    const graphHeight = 70
    const graphWidth = 150
    const graphX = (pageWidth - graphWidth) / 2

    // Encontrar valor máximo para escalar
    let maxValue = 0
    Object.values(totals).forEach((data) => {
      maxValue = Math.max(maxValue, data.activos, data.inactivos)
    })
    maxValue = Math.max(maxValue, 10) // Mínimo para que se vea bien la gráfica

    // Dibujar ejes
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.5)
    doc.line(graphX, graphY + graphHeight, graphX + graphWidth, graphY + graphHeight) // Eje X
    doc.line(graphX, graphY, graphX, graphY + graphHeight) // Eje Y

    // Calcular espacios dinámicamente para mejor organización
    const numTypes = Object.keys(totals).length
    const availableWidth = graphWidth - 40 // Márgenes
    const groupWidth = Math.max(18, availableWidth / numTypes)
    const barWidth = Math.min(10, groupWidth / 3)
    
    let groupIndex = 0
    Object.entries(totals).forEach(([typeId, typeData]) => {
      const groupX = graphX + 25 + groupIndex * groupWidth

      // Barra activos
      const activosHeight = (typeData.activos / maxValue) * (graphHeight - 25)
      const activosY = graphY + graphHeight - activosHeight
      doc.setFillColor(colors.activo[0], colors.activo[1], colors.activo[2])
      doc.rect(groupX, activosY, barWidth, activosHeight, "F")

      // Etiqueta activos
      if (typeData.activos > 0) {
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont(undefined, "bold")
        doc.text(typeData.activos.toString(), groupX + barWidth / 2, activosY + Math.max(activosHeight / 2, 8) + 1, { align: "center" })
      }

      // Barra inactivos
      const inactivosHeight = (typeData.inactivos / maxValue) * (graphHeight - 25)
      const inactivosY = graphY + graphHeight - inactivosHeight
      doc.setFillColor(colors.inactivo[0], colors.inactivo[1], colors.inactivo[2])
      doc.rect(groupX + barWidth + 3, inactivosY, barWidth, inactivosHeight, "F")

      // Etiqueta inactivos
      if (typeData.inactivos > 0) {
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont(undefined, "bold")
        doc.text(typeData.inactivos.toString(), groupX + barWidth + 3 + barWidth / 2, inactivosY + Math.max(inactivosHeight / 2, 8) + 1, { align: "center" })
      }

      // Etiqueta del tipo de dispositivo (rotada 45 grados como en el PDF original)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(7)
      let deviceLabel = typeData.name
      
      // Crear etiquetas más cortas y legibles
      if (deviceLabel.includes('Medidor de Flujo')) {
        deviceLabel = deviceLabel.replace('Medidor de Flujo', 'Med. Flujo')
      }
      if (deviceLabel.length > 18) {
        deviceLabel = deviceLabel.substring(0, 15) + "..."
      }
      
      const textX = groupX + barWidth / 2
      const textY = graphY + graphHeight + 20
      
      // Rotar texto 45 grados para mejor legibilidad
      doc.text(deviceLabel, textX, textY, { 
        align: "left",
        angle: 45
      })

      groupIndex++
    })

    // Escala Y con más detalle
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(7)
    const steps = 5
    for (let i = 0; i <= steps; i++) {
      const yValue = Math.round((maxValue / steps) * i)
      const yPos = graphY + graphHeight - (i * (graphHeight - 20)) / steps
      doc.text(yValue.toString(), graphX - 8, yPos + 2, { align: "right" })
      
      // Líneas de cuadrícula horizontales
      if (i > 0) {
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.2)
        doc.line(graphX, yPos, graphX + graphWidth, yPos)
      }
    }

    return pageNumber
  }

  // Función principal para generar el PDF
  const generatePDF = async () => {
    if (isGenerating) return

    try {
      setIsGenerating(true)

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

      // Primera página: Filtros y inicio de tabla de dispositivos
      drawWatermark(doc)
      let currentY = drawHeader(doc)
      currentY = drawFilters(doc, currentY + 10)
      
      // Tabla de detalles (puede ocupar múltiples páginas)
      const detailResult = drawDetailTable(doc, data, currentY + 10)
      
      // Calcular totales
      const totals = calculateTotals()
      
      // Tabla de totalización
      const totalizationResult = drawTotalizationTable(doc, totals, detailResult.currentY, detailResult.pageNumber)
      
      // Gráfica de barras
      const finalPageNumber = drawBarChart(doc, totals, totalizationResult.currentY, totalizationResult.pageNumber)

      // Ahora que sabemos el número total de páginas, actualizar todas las páginas
      const totalPages = finalPageNumber
      
      // Recorrer todas las páginas para actualizar la numeración
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        
        // Limpiar el área donde estaba la numeración anterior
        doc.setFillColor(64, 188, 165)
        doc.rect(pageWidth - 80, doc.internal.pageSize.getHeight() - 25, 80, 25, "F")
        
        // Agregar numeración correcta
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont(undefined, "bold")
        doc.text(`Pagina ${i} - ${totalPages}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 15, { align: "right" })
      }

      doc.save(getFileName())
      document.body.removeChild(loadingIndicator)
    } catch (error) {
      console.error("Error al generar PDF:", error)
      if (onError) {
        onError("Error al generar el PDF. Por favor, inténtalo de nuevo.")
      }

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