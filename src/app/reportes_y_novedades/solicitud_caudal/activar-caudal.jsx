"use client"

import { useEffect, useState } from "react"
import NavBar from "../../../components/NavBar"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import InputFilterLoteReportes from "../../../components/InputFilterLoteReportes"
import Modal from "../../../components/Modal"
import ActivationRequestModal from "./ActivationRequestModal"
import DataTable from "../../../components/DataTable"

const ActivarCaudal = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [lotes, setLotes] = useState([])
  const [predios, setPredios] = useState([])
  const [filteredLotes, setFilteredLotes] = useState(null)
  const [modalMessage, setModalMessage] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [selectedLote, setSelectedLote] = useState(null)
  // Determinar si es modo reporte o solicitud basado en la ruta o parámetro
  const [isReportMode, setIsReportMode] = useState(false)
  const [filters, setFilters] = useState({
    id: "",
    ownerDocument: "",
    plotId: "",
    lotId: "",
    cropType: "",
    startDate: "",
    endDate: "",
    isActive: "",
  })
  // Estado para almacenar los dispositivos IoT
  const [iotDevices, setIotDevices] = useState([])

  const API_URL = import.meta.env.VITE_APP_API_URL
  const cropTypeMap = {
    1: "Piscicultura",
    2: "Agricultura",
  }

  // ID específico para Válvula 4"
  const VALVE_4_ID = "06"

  useEffect(() => {
    // Determinar si estamos en modo reporte o solicitud
    // Esto podría venir como un state desde la navegación o un query param
    const searchParams = new URLSearchParams(location.search)
    const mode = searchParams.get("mode")
    setIsReportMode(mode === "report")

    const fetchUserAndLotes = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setModalMessage("No hay una sesión activa. Por favor, inicie sesión.")
          setShowModal(true)
          setLoading(false)
          return
        }

        // Obtener información del usuario actual
        const userResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Token ${token}` },
        })

        setCurrentUser(userResponse.data)

        // Obtener la lista de predios
        const prediosResponse = await axios.get(`${API_URL}/plot-lot/plots/list`, {
          headers: { Authorization: `Token ${token}` },
        })

        // Filtrar solo los predios del usuario actual
        const userPredios = prediosResponse.data.filter((predio) => predio.owner === userResponse.data.document)

        setPredios(userPredios)

        // Obtener la lista de lotes
        const lotesResponse = await axios.get(`${API_URL}/plot-lot/lots/list`, {
          headers: { Authorization: `Token ${token}` },
        })

        // Obtener la lista de dispositivos IoT
        const iotResponse = await axios.get(`${API_URL}/iot/iot-devices`, {
          headers: { Authorization: `Token ${token}` },
        })

        setIotDevices(iotResponse.data)

        // Filtrar solo los lotes que pertenecen a los predios del usuario actual
        const userPrediosIds = userPredios.map((predio) => predio.id_plot)
        const userLotes = lotesResponse.data.filter((lote) => userPrediosIds.includes(lote.plot))

        // Combinar la información de lotes y predios
        const lotesConPredios = userLotes.map((lote) => {
          // Buscar el predio correspondiente
          const predio = userPredios.find((p) => p.id_plot === lote.plot)

          // Buscar si el lote tiene una válvula 4" asignada
          const hasValve4 = iotResponse.data.some(
            (device) => device.id_lot === lote.id_lot && device.device_type === VALVE_4_ID,
          )

          // Buscar el dispositivo IoT asociado al lote para obtener el caudal actual
          const iotDevice = iotResponse.data.find(
            (device) => device.id_lot === lote.id_lot && device.device_type === VALVE_4_ID,
          )

          // Determinar si el caudal está cancelado (0) o no
          const flowCanceled = iotDevice ? iotDevice.actual_flow === 0 : false

          return {
            ...lote,
            predioOwner: predio ? predio.owner : "No disponible",
            hasValve4: hasValve4,
            flowCanceled: flowCanceled,
            iotDevice: iotDevice,
          }
        })

        // Store all plots, both active and inactive
        setLotes(lotesConPredios)
        console.log("Lotes del usuario con propietarios y válvulas:", lotesConPredios)
        setLoading(false)
      } catch (error) {
        console.error("Error al obtener la lista de lotes o predios:", error)
        setModalMessage("Error al cargar los datos. Por favor, intente más tarde.")
        setShowModal(true)
        setLoading(false)
      }
    }

    fetchUserAndLotes()
  }, [API_URL, location.search, VALVE_4_ID])

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  const applyFilters = () => {
    try {
      // Verificamos si hay al menos un filtro aplicado
      const hasActiveFilters =
        filters.id.trim() !== "" ||
        filters.lotId.trim() !== "" ||
        filters.ownerDocument.trim() !== "" ||
        filters.startDate !== "" ||
        filters.endDate !== "" ||
        filters.isActive !== ""

      // Validación de ID
      if (filters.id.trim() !== "") {
        // Verifica si es un prefijo válido del formato PR-NNNNNNN
        const isPrefixValid = /^(P|PR|PR-\d{0,7})$/.test(filters.id.trim())

        // Verifica si son solo dígitos (cualquier cantidad)
        const isOnlyDigits = /^\d+$/.test(filters.id.trim())

        // Si no cumple ninguna de las condiciones permitidas
        if (!isPrefixValid && !isOnlyDigits) {
          setModalMessage("El campo ID del predio contiene caracteres no válidos")
          setShowModal(true)
          setFilteredLotes([])
          return
        }
      }

      // Validación de formato del ID del  lote
      if (filters.lotId.trim() !== "") {
        // Validación de formato del ID del lote
        const isValidLoteFormat = /^(\d{1,7}|\d{1,7}-\d{0,3})$/.test(filters.lotId.trim())

        if (!isValidLoteFormat) {
          setModalMessage("El campo ID del lote contiene caracteres no válidos")
          setShowModal(true)
          setFilteredLotes([])
          return
        }
      }

      // Validación de formato del documento del propietario
      if (filters.ownerDocument.trim() !== "" && !/^\d+$/.test(filters.ownerDocument.trim())) {
        setModalMessage("El campo ID del propietario contiene caracteres no válidos")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      // Validación de fechas
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      // Filtrado de lotes
      const filtered = lotes.filter((lots) => {
        // Modificación para permitir búsqueda parcial por ID
        const matchesId =
          filters.id.trim() === "" ||
          (filters.id.trim().length > 0 && lots.plot.toLowerCase().includes(filters.id.trim().toLowerCase()))

        // Modificación para permitir búsqueda parcial por ID del lote
        const matchesIdlote =
          filters.lotId.trim() === "" ||
          (filters.lotId.trim().length > 0 &&
            (lots.id_lot?.toLowerCase().includes(filters.lotId.trim().toLowerCase()) ||
              lots.id?.toLowerCase().includes(filters.lotId.trim().toLowerCase())))
        // Ahora buscamos en el predioOwner en lugar de owner
        const matchesOwner =
          filters.ownerDocument.trim() === "" || lots.predioOwner.includes(filters.ownerDocument.trim())

        // Modificado para incluir lotes tanto activos como inactivos
        const matchesStatus = filters.isActive === "" || lots.is_activate === (filters.isActive === "true")

        // Manejo de fechas - enfoque idéntico al que funciona en UserList
        let matchesDate = true // Por defecto asumimos que coincide

        if (filters.startDate !== "" || filters.endDate !== "") {
          // Solo verificamos fechas si hay algún filtro de fecha

          // Convertir fecha de predio a formato YYYY-MM-DD
          const loteDate = new Date(lots.registration_date)
          const loteDateStr = loteDate.toISOString().split("T")[0] // formato YYYY-MM-DD

          // Verificar límite inferior
          if (filters.startDate !== "") {
            const startDateStr = new Date(filters.startDate).toISOString().split("T")[0]
            if (loteDateStr < startDateStr) {
              matchesDate = false
            }
          }

          // Verificar límite superior
          if (matchesDate && filters.endDate !== "") {
            const endDateStr = new Date(filters.endDate).toISOString().split("T")[0]
            if (loteDateStr > endDateStr) {
              matchesDate = false
            }
          }
        }

        return matchesId && matchesIdlote && matchesOwner && matchesDate && matchesStatus
      })

      // Validación adicional para ID del predio no existente
      if (filters.id.trim() !== "" && filtered.length === 0) {
        setModalMessage("El predio filtrado no existe.")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      // Validación adicional para ID del lote no existente
      if (filters.lotId.trim() !== "" && filtered.length === 0) {
        setModalMessage("El lote filtrado no existe.")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      // Validación adicional para documento del propietario no existente
      if (filters.ownerDocument.trim() !== "" && filtered.length === 0) {
        setModalMessage("El ID del propietario no se encuentra asociado a ningún registro")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      // Validación para rango de fechas sin resultados
      if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
        setModalMessage("No hay lotes registrados en el rango de fechas especificado.")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      setFilteredLotes(filtered) // Actualiza filteredLotes solo cuando se aplican filtros
    } catch (error) {
      setModalMessage("¡El lote filtrado no se pudo mostrar correctamente! Vuelve a intentarlo más tarde…")
      setShowModal(true)
      setFilteredLotes([])
    }
  }

  // Manejador para el botón "Solicitar" o "Reportar" según el modo
  const handleRequest = (lote) => {
    if (isReportMode) {
      // Lógica para manejo de reportes
      console.log("Generando reporte para el lote:", lote)
      setModalMessage("Reporte generado correctamente para el lote " + lote.id_lot)
      setShowModal(true)
    } else {
      // Lógica para solicitudes de activación

      // Validar primero si el lote tiene una válvula 4" asignada
      if (!lote.hasValve4) {
        setModalMessage('El lote no cuenta con una válvula 4" asignada, no se puede realizar la solicitud.')
        setShowModal(true)
        return
      }

      // Validar si el caudal ya está activo (no está cancelado)
      if (!lote.flowCanceled) {
        setModalMessage("El caudal del lote ya está activo. No es necesario solicitar activación.")
        setShowModal(true)
        return
      }

      // Si el lote tiene válvula y el caudal está cancelado, mostrar el modal de solicitud de activación
      setSelectedLote(lote)
      setShowActivationModal(true)
    }
  }

  // Manejador para mensajes de éxito
  const handleRequestSuccess = (message) => {
    setModalMessage(message)
    setShowModal(true)
  }

  // Función para verificar si un lote puede solicitar activación de caudal
  const canRequestActivation = (lote) => {
    // En modo reporte, permitimos siempre acciones
    if (isReportMode) return true
    // En modo solicitud, solo si tiene válvula 4" y el caudal está cancelado
    return lote.hasValve4 && lote.flowCanceled
  }

  // Configuración de columnas para DataTable
  const columns = [
    { key: "id_lot", label: "ID Lote" },
    {
      key: "crop_type",
      label: "Tipo de Cultivo",
      render: (lote) => cropTypeMap[lote.crop_type] || `Tipo ${lote.crop_type}`,
    },
    { key: "plot", label: "ID Predio" },
    {
      key: "hasValve4",
      label: "Estado válvula",
      render: (lote) => {
        const statusText = lote.hasValve4 ? "Asignada" : "Sin válvula"
        const statusClass = lote.hasValve4
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"

        return (
          <span
            className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-24`}
          >
            {statusText}
          </span>
        )
      },
    },
    {
      key: "flowCanceled",
      label: "Estado caudal",
      render: (lote) => {
        if (!lote.hasValve4) {
          return (
            <span className="flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 w-24">
              N/A
            </span>
          )
        }

        const statusText = lote.flowCanceled ? "Cancelado" : "Activo"
        const statusClass = lote.flowCanceled
          ? "bg-red-100 text-red-800 border border-red-200"
          : "bg-green-100 text-green-800 border border-green-200"

        return (
          <span
            className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-24`}
          >
            {statusText}
          </span>
        )
      },
    },
    {
      key: "registration_date",
      label: "Registro",
      responsive: "hidden sm:table-cell",
      render: (lote) => new Date(lote.registration_date).toLocaleDateString(),
    },
  ]

  // Texto para el botón según el modo
  const actionButtonText = isReportMode ? "Reportar" : "Solicitar"

  // Mensaje para el tooltip en modo solicitud cuando está deshabilitado
  const disabledTooltip = isReportMode
    ? ""
    : 'No se puede solicitar activación. El lote no tiene válvula 4" asignada o el caudal ya está activo.'

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">Activación de caudal</h1>

        {loading ? (
          <div className="text-center my-10">Cargando...</div>
        ) : (
          <>
            <InputFilterLoteReportes
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={applyFilters}
              showPersonTypeFilter={false}
            />

            {/* Modal de mensajes */}
            {showModal && (
              <Modal
                showModal={showModal}
                onClose={() => {
                  setShowModal(false)
                  if (modalMessage === "Por favor, aplica al menos un filtro para ver resultados.") {
                    setFilteredLotes(null)
                  }
                }}
                title={
                  modalMessage.includes("correctamente")
                    ? "Éxito"
                    : modalMessage.includes("ya está activo")
                      ? "Advertencia"
                      : "Error"
                }
                btnMessage="Cerrar"
              >
                <p>{modalMessage}</p>
              </Modal>
            )}

            {/* Modal de solicitud de activación de caudal (solo en modo solicitud) */}
            {!isReportMode && showActivationModal && selectedLote && (
              <ActivationRequestModal
                showModal={showActivationModal}
                onClose={() => setShowActivationModal(false)}
                lote={selectedLote}
                onSuccess={handleRequestSuccess}
                API_URL={API_URL}
              />
            )}

            {/* Uso del componente DataTable - Solo mostrar cuando hay filtros aplicados */}
            {filteredLotes !== null && (
              <DataTable
                columns={columns}
                data={filteredLotes}
                emptyMessage="No se encontraron lotes con los filtros aplicados."
                onRequest={handleRequest}
                // Pasar el texto del botón según el modo
                actionButtonText={actionButtonText}
                // Pasar una función para determinar si el botón debe estar habilitado
                isActionEnabled={canRequestActivation}
                // Agregar tooltip para el botón deshabilitado
                disabledTooltip={disabledTooltip}
              />
            )}

            {filteredLotes === null && (
              <div className="text-center my-10 text-gray-600">
                No hay lotes para mostrar. Aplica filtros para ver resultados.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ActivarCaudal
