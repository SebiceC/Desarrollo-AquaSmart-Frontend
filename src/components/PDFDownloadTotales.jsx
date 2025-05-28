"use client"

import { useState } from "react"
import jsPDF from "jspdf"

const PDFDownloadTotales = ({ data, filters, onError }) => {
  const [isGenerating, setIsGenerating] = useState(false)

  // Función para calcular totalizaciones por estado
  const calculateTotals = () => {
    const totals = {
      pendiente: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      pagada: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      vencida: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
      validada: { facturas: 0, usuarios: new Set(), predios: new Set(), lotes: new Set(), monto: 0 },
    }

    data.forEach((factura, index) => {
      const estado = factura.status?.toLowerCase()

      if (totals[estado]) {
        // Incrementar cantidad de facturas
        totals[estado].facturas += 1

        // Agregar usuario único (usando client_document)
        if (factura.client_document && factura.client_document !== null && factura.client_document !== undefined) {
          const clientDoc = factura.client_document.toString().trim()
          if (clientDoc !== "") {
            totals[estado].usuarios.add(clientDoc)
          }
        }

        // Extraer predio único del lot_code (primeros 7 dígitos)
        let predioId = null
        if (factura.lot_code && factura.lot_code !== null && factura.lot_code !== undefined) {
          const lotCodeStr = factura.lot_code.toString().trim()

          if (lotCodeStr.includes("-")) {
            const partes = lotCodeStr.split("-")
            if (partes.length >= 2 && partes[0].length >= 7) {
              predioId = partes[0].substring(0, 7)
            } else if (partes[0].length > 0) {
              predioId = partes[0]
            }
          } else if (lotCodeStr.length >= 7) {
            predioId = lotCodeStr.substring(0, 7)
          } else if (lotCodeStr.length > 0) {
            predioId = lotCodeStr
          }
        }

        if (!predioId && factura.property_id) {
          predioId = factura.property_id.toString().trim()
        } else if (!predioId && factura.client_document) {
          predioId = `predio_${factura.client_document.toString().trim()}`
        } else if (!predioId) {
          predioId = `predio_${index}`
        }

        if (predioId && predioId.trim() !== "") {
          totals[estado].predios.add(predioId.trim())
        }

        // Agregar lote único
        let loteId = null
        if (factura.lot_code && factura.lot_code !== null && factura.lot_code !== undefined) {
          loteId = factura.lot_code.toString().trim()
        } else if (factura.lot && factura.lot !== null && factura.lot !== undefined) {
          loteId = factura.lot.toString().trim()
        } else {
          loteId = `lote_${index}`
        }

        if (loteId && loteId !== "") {
          totals[estado].lotes.add(loteId)
        }

        // Sumar monto
        const monto = Number.parseFloat(factura.total_amount) || 0
        totals[estado].monto += monto
      }
    })

    // Convertir Sets a números y filtrar solo estados con facturas
    const filteredTotals = {}
    Object.keys(totals).forEach((estado) => {
      if (totals[estado].facturas > 0) {
        filteredTotals[estado] = {
          ...totals[estado],
          usuarios: totals[estado].usuarios.size,
          predios: totals[estado].predios.size,
          lotes: totals[estado].lotes.size,
        }
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
    return `resumen-facturas-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.pdf`
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return `$${Number.parseFloat(amount).toLocaleString("es-CO", { minimumFractionDigits: 2 })}`
  }

  // Función para dibujar la marca de agua
  const drawWatermark = (doc) => {
    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
  
      // Cargar la imagen de marca de agua
      const watermarkImg = new Image();
      watermarkImg.src = "../../public/img/marca_de_agua.png";
  
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
      doc.setGState(new doc.GState({ opacity: 0.09 })); // 15% de opacidad
  
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
    const pageWidth = doc.internal.pageSize.getWidth()

    // Logo (si existe)
    try {
      const logoImg = new Image()
      logoImg.src = "../../public/img/aqua.png"
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

    // Número de página en blanco sobre la onda
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
  }

  // Función para dibujar filtros aplicados
  const drawFilters = (doc, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Título principal
    doc.setTextColor(52, 84, 134)
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.text("RESUMEN DE FACTURAS", pageWidth / 2, startY, { align: "center" })

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

    // Cajas de filtros
    const boxWidth = 30
    const boxHeight = 20
    const gap = 1
    const numBoxes = 5

    const totalBoxWidth = numBoxes * boxWidth + (numBoxes - 1) * gap
    const startX = (pageWidth - totalBoxWidth) / 2
    const boxY = startY + 45

    let boxX = startX
    boxX = drawFilterBox(doc, boxX, boxY, boxWidth, boxHeight, "ID factura:", filters.id || "Todas")
    boxX += gap // Agregar gap después de cada caja
    boxX = drawFilterBox(doc, boxX, boxY, boxWidth, boxHeight, "Estado:", filters.status || "Todos")
    boxX += gap
    boxX = drawFilterBox(doc, boxX, boxY, boxWidth, boxHeight, "ID propietario:", filters.ownerDocument || "Todos")
    boxX += gap
    boxX = drawFilterBox(doc, boxX, boxY, boxWidth, boxHeight, "ID lotes:", filters.lotId || "Todos")
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

  // Función para dibujar la tabla de detalle de facturas
  const drawDetailTable = (doc, data, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Título
    doc.setTextColor(52, 84, 134)
    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("DETALLE DE FACTURAS", pageWidth / 2, startY, { align: "center" })

    const tableY = startY + 15
    const tableWidth = 170
    const tableX = (pageWidth - tableWidth) / 2
    const rowHeight = 12
    const colWidths = [25, 25, 30, 25, 30, 20, 15]

    // Encabezados con fondo verde
    doc.setFillColor(144, 198, 149)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont(undefined, "bold")

    let currentY = tableY

    // Dibujar fondo del encabezado
    doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

    const headers = ["Código", "Lote", "Cliente", "Documento", "Monto", "Estado", "F. Creación"]
    let xPos = tableX
    headers.forEach((header, index) => {
      doc.text(header, xPos + colWidths[index] / 2, currentY + rowHeight / 2 + 2, { align: "center" })
      xPos += colWidths[index]
    })

    currentY += rowHeight

    // Datos de las filas
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont(undefined, "normal")

    data.forEach((factura, index) => {
      // Verificar si necesitamos una nueva página
      if (currentY > pageHeight - 60) {
        drawWaveFooter(doc)
        doc.text(
          `Pagina ${doc.internal.getNumberOfPages()} - ${Math.ceil(data.length / 15) + 1}`,
          pageWidth - 30,
          pageHeight - 15,
          { align: "right" },
        )
        doc.addPage()
        // Agregar marca de agua a la nueva página
        drawWatermark(doc)
        currentY = drawHeader(doc) + 20

        // Redibujar encabezados
        doc.setFillColor(144, 198, 149)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont(undefined, "bold")
        doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

        xPos = tableX
        headers.forEach((header, headerIndex) => {
          doc.text(header, xPos + colWidths[headerIndex] / 2, currentY + rowHeight / 2 + 2, { align: "center" })
          xPos += colWidths[headerIndex]
        })
        currentY += rowHeight
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, "normal")
      }

      // Alternar colores de fondo (blanco y gris muy claro)
      if (index % 2 === 1) {
        doc.setFillColor(248, 248, 248)
        doc.rect(tableX, currentY, tableWidth, rowHeight, "F")
      }

      const statusText = factura.status ? factura.status.charAt(0).toUpperCase() + factura.status.slice(1) : ""
      const creationDate = factura.creation_date ? formatDate(factura.creation_date) : "N/A"

      const rowData = [
        factura.code || "",
        factura.lot_code || "",
        factura.client_name || "",
        factura.client_document || "",
        formatCurrency(factura.total_amount || 0),
        statusText,
        creationDate,
      ]

      xPos = tableX
      rowData.forEach((cellData, cellIndex) => {
        const align = cellIndex === 4 ? "right" : "center"
        let xPosition = xPos + colWidths[cellIndex] / 2
        if (cellIndex === 4) {
          xPosition = xPos + colWidths[cellIndex] - 2
        }

        const maxLength = cellIndex === 2 ? 12 : 10
        const truncatedText = cellData.length > maxLength ? cellData.substring(0, maxLength - 3) + "..." : cellData
        doc.text(truncatedText, xPosition, currentY + rowHeight / 2 + 2, { align })
        xPos += colWidths[cellIndex]
      })

      currentY += rowHeight
    })

    return currentY + 20
  }

  // Función para dibujar la tabla de totalización
  const drawTotalizationTable = (doc, totals, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Título
    doc.setTextColor(52, 84, 134)
    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("TABLA DE TOTALIZACIÓN", pageWidth / 2, startY, { align: "center" })

    const tableY = startY + 15
    const tableWidth = 170
    const tableX = (pageWidth - tableWidth) / 2
    const rowHeight = 12
    const colWidths = [34, 27, 27, 27, 27, 28]

    let currentY = tableY

    // Encabezados con fondo verde
    doc.setFillColor(144, 198, 149)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")

    doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

    const headers = ["Estado", "Facturas", "Usuarios", "Predios", "Lotes", "Monto Total"]
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

    const estadosLabels = {
      pendiente: "Pendiente",
      pagada: "Pagada",
      vencida: "Vencida",
      validada: "Validada",
    }

    let totalFacturas = 0
    let totalMonto = 0
    const totalUsuarios = new Set()
    const totalPredios = new Set()
    const totalLotes = new Set()

    // Calcular totales únicos globales
    data.forEach((factura, index) => {
      if (factura.client_document) {
        totalUsuarios.add(factura.client_document.toString().trim())
      }

      const predioId = factura.lot_code ? factura.lot_code.toString().substring(0, 7) : `predio_${index}`
      totalPredios.add(predioId)

      const loteId = factura.lot_code || factura.lot || `lote_${index}`
      totalLotes.add(loteId.toString())
    })

    let rowIndex = 0
    Object.entries(totals).forEach(([estado, data]) => {
      if (rowIndex % 2 === 1) {
        doc.setFillColor(248, 248, 248)
        doc.rect(tableX, currentY, tableWidth, rowHeight, "F")
      }

      const rowData = [
        estadosLabels[estado] || estado,
        data.facturas.toString(),
        data.usuarios.toString(),
        data.predios.toString(),
        data.lotes.toString(),
        formatCurrency(data.monto),
      ]

      xPos = tableX
      rowData.forEach((cellData, cellIndex) => {
        const align = cellIndex === 0 ? "left" : "center"
        const xPosition = cellIndex === 0 ? xPos + 3 : xPos + colWidths[cellIndex] / 2
        doc.text(cellData, xPosition, currentY + rowHeight / 2 + 2, { align })
        xPos += colWidths[cellIndex]
      })

      totalFacturas += data.facturas
      totalMonto += data.monto
      currentY += rowHeight
      rowIndex++
    })

    // Fila de totales
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.setFillColor(220, 220, 220)
    doc.rect(tableX, currentY, tableWidth, rowHeight, "F")

    const totalRow = [
      "Total",
      totalFacturas.toString(),
      totalUsuarios.size.toString(),
      totalPredios.size.toString(),
      totalLotes.size.toString(),
      formatCurrency(totalMonto),
    ]

    xPos = tableX
    totalRow.forEach((cellData, cellIndex) => {
      const align = cellIndex === 0 ? "left" : "center"
      const xPosition = cellIndex === 0 ? xPos + 3 : xPos + colWidths[cellIndex] / 2
      doc.text(cellData, xPosition, currentY + rowHeight / 2 + 2, { align })
      xPos += colWidths[cellIndex]
    })

    return currentY + rowHeight + 20
  }

  // Función para dibujar gráfica de barras
  const drawBarChart = (doc, totals, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Título
    doc.setTextColor(52, 84, 134)
    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("GRAFICA DE TOTALIZACIÓN", pageWidth / 2, startY, { align: "center" })

    const chartY = startY + 20
    const chartWidth = 150
    const chartHeight = 80
    const chartX = (pageWidth - chartWidth) / 2

    // Leyenda
    const legendY = chartY + 10
    const colors = {
      pagada: [144, 198, 149],
      pendiente: [91, 192, 222],
      vencida: [52, 84, 134],
    }

    doc.setFontSize(9)
    let legendX = chartX + 20
    Object.entries(colors).forEach(([estado, color]) => {
      doc.setFillColor(color[0], color[1], color[2])
      doc.circle(legendX, legendY, 3, "F")
      doc.setTextColor(0, 0, 0)
      doc.text(estado.charAt(0).toUpperCase() + estado.slice(1), legendX + 8, legendY + 2)
      legendX += 40
    })

    // Área del gráfico
    const graphY = chartY + 25
    const graphHeight = 50
    const graphWidth = 120
    const graphX = (pageWidth - graphWidth) / 2

    // Encontrar valor máximo para escalar
    const categories = ["Facturas", "Usuarios", "Predios", "Lotes"]
    let maxValue = 0
    categories.forEach((category) => {
      Object.values(totals).forEach((data) => {
        const value =
          category === "Facturas"
            ? data.facturas
            : category === "Usuarios"
              ? data.usuarios
              : category === "Predios"
                ? data.predios
                : data.lotes
        maxValue = Math.max(maxValue, value)
      })
    })

    // Dibujar ejes
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.5)
    doc.line(graphX, graphY + graphHeight, graphX + graphWidth, graphY + graphHeight) // Eje X
    doc.line(graphX, graphY, graphX, graphY + graphHeight) // Eje Y

    // Dibujar barras
    const barWidth = 8
    const groupWidth = 30
    const grupos = ["Facturas", "Usuarios", "Predios", "Lotes"]

    grupos.forEach((grupo, groupIndex) => {
      const groupX = graphX + 15 + groupIndex * groupWidth

      let barIndex = 0
      Object.entries(totals).forEach(([estado, data]) => {
        if (colors[estado]) {
          const value =
            grupo === "Facturas"
              ? data.facturas
              : grupo === "Usuarios"
                ? data.usuarios
                : grupo === "Predios"
                  ? data.predios
                  : data.lotes

          const barHeight = (value / Math.max(maxValue, 1)) * (graphHeight - 10)
          const barX = groupX + barIndex * (barWidth + 1)
          const barY = graphY + graphHeight - barHeight

          // Dibujar barra
          doc.setFillColor(colors[estado][0], colors[estado][1], colors[estado][2])
          doc.rect(barX, barY, barWidth, barHeight, "F")

          // Etiqueta del valor
          if (value > 0) {
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(8)
            doc.setFont(undefined, "bold")
            doc.text(value.toString(), barX + barWidth / 2, barY + barHeight / 2 + 2, { align: "center" })
          }

          barIndex++
        }
      })

      // Etiqueta del grupo
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.text(grupo, groupX + 10, graphY + graphHeight + 8, { align: "center" })
    })

    // Escala Y
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(7)
    for (let i = 0; i <= 4; i++) {
      const yValue = Math.round((maxValue / 4) * i)
      const yPos = graphY + graphHeight - (i * (graphHeight - 10)) / 4
      doc.text(yValue.toString(), graphX - 5, yPos + 2, { align: "right" })
    }

    return chartY + chartHeight + 20
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

      // Página 1: Detalle de facturas
      drawWatermark(doc) // Agregar marca de agua a la primera página
      let currentY = drawHeader(doc)
      currentY = drawFilters(doc, currentY + 10)
      drawDetailTable(doc, data, currentY + 10)
      drawWaveFooter(doc)
      doc.text("Pagina 1 - 2", pageWidth - 30, doc.internal.pageSize.getHeight() - 15, { align: "right" })

      // Página 2: Totalización y gráficas
      doc.addPage()
      drawWatermark(doc) // Agregar marca de agua a la segunda página
      currentY = drawHeader(doc)

      const totals = calculateTotals()
      currentY = drawTotalizationTable(doc, totals, currentY + 10)
      drawBarChart(doc, totals, currentY + 10)
      drawWaveFooter(doc)
      doc.text("Pagina 2 - 2", pageWidth - 30, doc.internal.pageSize.getHeight() - 15, { align: "right" })

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

export { PDFDownloadTotales }
