"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import NavBar from "../../components/NavBar"
import Modal from "../../components/Modal"
import { Search } from "lucide-react"
import Footer from "../../components/Footer"

const ValvesList = () => {
  const navigate = useNavigate()
  const [valves, setValves] = useState([])
  const [plots, setPlots] = useState([]) // Predios
  const [lots, setLots] = useState([]) // Lotes
  const [filteredValves, setFilteredValves] = useState([])
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("ERROR")
  const [filters, setFilters] = useState({
    id: "",
    name: "",
    locationId: "",
    status: "todos",
    startDate: "",
    endDate: "",
  })
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isPreloading, setIsPreloading] = useState(true) // Estado para controlar la precarga, pero no visible para el usuario

  const API_URL = import.meta.env.VITE_APP_API_URL

  // ID específico para Válvula 4"
  const VALVE_4_ID = "06"

  const openErrorModal = useCallback((message, title = "Error") => {
    console.log(`${title}: ${message}`)
    setModalTitle(title)
    setModalMessage(message)
    setShowModal(true)
  }, [])

  const handleEdit = useCallback(
    (valve) => {
      if (!valve.is_active) {
        openErrorModal("No se puede ajustar el caudal de una válvula inactiva.", "Advertencia")
        return
      }
      navigate(`/control-IoT/valvulas/${valve.id}/update-flow`)
    },
    [navigate, openErrorModal],
  )

  const handleFilterChange = useCallback((name, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }))
  }, [])

  // Función para cargar los datos desde la API - optimizada
  const loadDataFromAPI = useCallback(
    async (isInitialLoad = false) => {
      if (!isInitialLoad) {
        setLoading(true)
      }
      // No mostramos indicador visual durante la precarga

      setError(null)

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No hay una sesión activa. Por favor, inicie sesión.")
          if (!isInitialLoad) setLoading(false)
          setIsPreloading(false)
          return false
        }

        // Realizar todas las peticiones iniciales en paralelo
        const [plotsResponse, devicesResponse] = await Promise.all([
          axios.get(`${API_URL}/plot-lot/plots/list`, {
            headers: { Authorization: `Token ${token}` },
          }),
          axios.get(`${API_URL}/iot/iot-devices`, {
            headers: { Authorization: `Token ${token}` },
          }),
        ])

        console.log("Predios obtenidos:", plotsResponse.data)
        setPlots(plotsResponse.data)

        console.log("Dispositivos IoT obtenidos:", devicesResponse.data)

        // Filtrar SOLO las válvulas con device_type = 14 (Válvula 4")
        const valvesData = devicesResponse.data.filter((device) => {
          return device.device_type === VALVE_4_ID
        })

        console.log('Válvulas filtradas por tipo 14 (Válvula 4"):', valvesData)
        console.log("Cantidad de válvulas encontradas:", valvesData.length)

        // Obtener lotes en paralelo para todos los predios
        const lotPromises = plotsResponse.data.map((plot) =>
          axios
            .get(`${API_URL}/plot-lot/plots/${plot.id_plot}`, {
              headers: { Authorization: `Token ${token}` },
            })
            .then((response) => {
              if (response.data.lotes && Array.isArray(response.data.lotes)) {
                return response.data.lotes.map((lot) => ({
                  ...lot,
                  parent_plot_id: plot.id_plot,
                  parent_plot_name: plot.plot_name,
                }))
              }
              return []
            })
            .catch((err) => {
              console.error(`Error al obtener lotes del predio ${plot.id_plot}:`, err)
              return [] // Continuamos con el siguiente predio aunque haya error
            }),
        )

        const lotsArrays = await Promise.all(lotPromises)
        const allLots = lotsArrays.flat()

        console.log("Todos los lotes obtenidos:", allLots)
        setLots(allLots)

        // Mapear los datos para que coincidan con la estructura esperada por el componente
        const formattedValves = valvesData.map((device) => {
          // Verificar si la válvula está asociada a un predio
          const associatedPlot = plotsResponse.data.find((plot) => plot.id_plot === device.id_plot)

          // Verificar si la válvula está asociada a un lote
          const associatedLot = allLots.find((lot) => lot.id_lot === device.id_lot)

          // Determinar la ubicación (predio o lote)
          let locationId = "N/A"
          let locationType = "N/A"
          let locationName = "N/A"
          let parentPlotName = null

          if (associatedLot) {
            // Si está asociado a un lote, mostrar el ID del lote
            locationId = associatedLot.id_lot
            locationType = "lote"
            locationName = associatedLot.crop_type ? `${associatedLot.crop_name || "Sin variedad"}` : "Sin información"
            parentPlotName = associatedLot.parent_plot_name
          } else if (associatedPlot) {
            // Si no está asociado a un lote pero sí a un predio
            locationId = associatedPlot.id_plot
            locationType = "predio"
            locationName = associatedPlot.plot_name
          }

          // Usar actual_flow del dispositivo si existe, de lo contrario usar 0
          const currentFlow = device.actual_flow !== null && device.actual_flow !== undefined ? device.actual_flow : 0

          return {
            id: device.iot_id,
            name: device.name || "Sin nombre",
            location_id: locationId,
            location_type: locationType,
            location_name: locationName,
            parent_plot_name: parentPlotName,
            is_active: device.is_active,
            current_flow: currentFlow,
            max_flow: device.max_flow || 100,
            flow_unit: "L/s", // Según el modelo, la unidad es L/s (litros por segundo)
            valve_type: device.device_type_name || device.type || device.valve_type || "N/A",
            registration_date: device.registration_date || new Date().toISOString(),
          }
        })

        console.log("Válvulas formateadas con información de ubicación:", formattedValves)
        setValves(formattedValves)
        setDataLoaded(true) // Marcar que los datos ya fueron cargados
        setIsPreloading(false)
        return formattedValves
      } catch (err) {
        console.error("Error al cargar las válvulas:", err)

        // Extract detailed error message from response
        let errorMessage = "No se pudieron cargar las válvulas."

        if (err.response) {
          if (err.response.status === 403) {
            errorMessage = "No tiene permisos para acceder a las válvulas."
            if (err.response.data?.detail) {
              errorMessage = err.response.data.detail
            }
          } else if (err.response.data?.detail) {
            errorMessage = err.response.data.detail
          } else if (err.response.data?.message) {
            errorMessage = err.response.data.message
          }
        } else if (err.request) {
          errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet."
        } else {
          errorMessage = `Error de configuración: ${err.message}`
        }

        // Solo mostrar errores si no es la carga inicial
        if (!isInitialLoad) {
          setError(errorMessage)
          setModalMessage(errorMessage)
          setModalTitle("Error")
          setShowModal(true)
        } else {
          console.error("Error en precarga:", errorMessage)
        }

        setFilteredValves([])
        setIsPreloading(false)
        return false
      } finally {
        if (!isInitialLoad) {
          setLoading(false)
        }
      }
    },
    [API_URL, VALVE_4_ID],
  )

  // Precargar datos al montar el componente
  useEffect(() => {
    // Solo precargar si no hay datos cargados
    if (!dataLoaded) {
      loadDataFromAPI(true) // true indica que es una carga inicial (precarga)
    }
  }, [dataLoaded, loadDataFromAPI])

  // Función para aplicar filtros a los datos ya cargados - optimizada con useMemo
  const applyFiltersToData = useCallback(
    (data) => {
      let filtered = data

      // Filtrado de válvulas
      if (filters.id.trim() !== "") {
        filtered = filtered.filter((valve) => valve.id.toLowerCase().includes(filters.id.trim().toLowerCase()))
      }

      if (filters.name.trim() !== "") {
        filtered = filtered.filter((valve) => valve.name.toLowerCase().includes(filters.name.trim().toLowerCase()))
      }

      if (filters.locationId.trim() !== "") {
        filtered = filtered.filter((valve) =>
          valve.location_id.toLowerCase().includes(filters.locationId.trim().toLowerCase()),
        )
      }

      if (filters.status !== "todos") {
        filtered = filtered.filter((valve) => {
          if (filters.status === "activa") {
            return valve.is_active
          } else if (filters.status === "inactiva") {
            return !valve.is_active
          }
          return true
        })
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate).setHours(0, 0, 0, 0)
        filtered = filtered.filter((valve) => {
          const valveDate = new Date(valve.registration_date).setHours(0, 0, 0, 0)
          return valveDate >= startDate
        })
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate).setHours(23, 59, 59, 999)
        filtered = filtered.filter((valve) => {
          const valveDate = new Date(valve.registration_date).setHours(23, 59, 59, 999)
          return valveDate <= endDate
        })
      }

      if (filtered.length === 0) {
        setModalMessage(
          "No se encontraron válvulas que coincidan con los criterios de búsqueda. Por favor, intente con otros filtros.",
        )
        setModalTitle("Sin resultados")
        setShowModal(true)
      }

      return filtered
    },
    [filters],
  )

  const applyFilters = useCallback(async () => {
    // Validaciones de formato antes de hacer la petición
    if (filters.id.trim() !== "" && !/^V\d{3}$/.test(filters.id.trim()) && !/^\d+$/.test(filters.id.trim())) {
      setModalMessage(
        "El ID de válvula ingresado contiene un formato no válido. Por favor, verifique e intente nuevamente.",
      )
      setModalTitle("Error de validación")
      setShowModal(true)
      return
    }

    if (
      filters.locationId.trim() !== "" &&
      !/^PR-\d{7}$/.test(filters.locationId.trim()) &&
      !/^LT-\d{7}$/.test(filters.locationId.trim()) &&
      !/^\d+$/.test(filters.locationId.trim())
    ) {
      setModalMessage(
        "El ID de ubicación ingresado contiene un formato no válido. Por favor, verifique e intente nuevamente.",
      )
      setModalTitle("Error de validación")
      setShowModal(true)
      return
    }

    if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
      setModalMessage(
        "La fecha de inicio no puede ser posterior a la fecha de fin. Por favor, ajuste el rango de fechas.",
      )
      setModalTitle("Error de validación")
      setShowModal(true)
      return
    }

    // Si los datos ya están cargados, solo aplicamos los filtros sin hacer llamadas a la API
    if (dataLoaded && valves.length > 0) {
      setLoading(true)
      const filtered = applyFiltersToData(valves)
      setFilteredValves(filtered)
      setLoading(false)
    } else {
      // Si es la primera vez o no hay datos, cargamos desde la API
      const loadedData = await loadDataFromAPI()
      if (loadedData) {
        const filtered = applyFiltersToData(loadedData)
        setFilteredValves(filtered)
      }
    }
  }, [filters, dataLoaded, valves, loadDataFromAPI, applyFiltersToData])

  // Memoizar las columnas para evitar recreaciones innecesarias
  const columns = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "name", label: "NOMBRE" },
      { key: "location_id", label: "ID PROPIEDAD" },
      {
        key: "location_name",
        label: "NOMBRE PROPIEDAD",
        responsive: "hidden md:table-cell",
        render: (valve) => {
          if (valve.location_type === "lote" && valve.parent_plot_name) {
            return (
              <div>
                <span>{valve.location_name}</span>
                <span className="block text-xs text-gray-500">Predio: {valve.parent_plot_name}</span>
              </div>
            )
          }
          return valve.location_name
        },
      },
      {
        key: "is_active",
        label: "ESTADO",
        render: (valve) => {
          const statusText = valve.is_active ? "Activa" : "Inactiva"
          const statusClass = valve.is_active
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200"

          return (
            <span
              className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-18`}
            >
              {statusText}
            </span>
          )
        },
      },
      {
        key: "current_flow",
        label: "CAUDAL ACTUAL",
        render: (valve) => `${valve.current_flow} ${valve.flow_unit}`,
      },
      {
        key: "registration_date",
        label: "REGISTRO",
        responsive: "hidden sm:table-cell",
        render: (valve) => {
          try {
            return new Date(valve.registration_date).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          } catch (error) {
            return "Fecha no disponible"
          }
        },
      },
      {
        key: "action",
        label: "ACCIÓN",
        render: (valve) => (
          <button
            onClick={() => handleEdit(valve)}
            className={`px-2 py-2 rounded-lg w-full ${
              valve.is_active
                ? "bg-[#365486] hover:bg-[#42A5F5] text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!valve.is_active}
          >
            Ajustar caudal
          </button>
        ),
      },
    ],
    [handleEdit],
  )

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-12">Control de válvulas de riego</h1>

        {error && <p className="text-center text-red-600 mb-6">{error}</p>}

        <div className="mb-8">
          {/* Contenedor principal de filtros */}
          <div className="flex flex-col gap-4">
            {/* Fila única de filtros con etiqueta de fecha posicionada absolutamente */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 relative">
              <div className="w-full md:w-[15%]">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="ID de válvula"
                    className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                    value={filters.id}
                    onChange={(e) => handleFilterChange("id", e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="w-full md:w-[20%]">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Nombre de válvula"
                    className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="w-full md:w-[15%]">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="ID de propiedad"
                    className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                    value={filters.locationId}
                    onChange={(e) => handleFilterChange("locationId", e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="w-full md:w-[10%]">
                <div className="relative">
                  <select
                    className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                  >
                    <option value="todos">ESTADO</option>
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                  <span className="absolute top-3 right-4 text-gray-400">
                    <svg
                      className="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="w-full md:w-[25%] md:flex md:flex-col md:justify-end relative">
                <p className="text-gray-500 text-sm text-center mb-2 md:absolute md:top-[-20px] md:left-0 md:right-0">
                  Filtrar por fecha de registro
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1">
                  <div className="w-full sm:w-1/2 relative">
                    <input
                      type="date"
                      name="startDate"
                      className="w-full pl-3 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                      value={filters.startDate || ""}
                      onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    />
                    <span className="text-gray-400 text-xs absolute bottom-[-18px] left-4">Inicio</span>
                  </div>

                  <div className="w-full sm:w-1/2 relative">
                    <input
                      type="date"
                      name="endDate"
                      className="w-full pl-3 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                      value={filters.endDate || ""}
                      onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    />
                    <span className="text-gray-400 text-xs absolute bottom-[-18px] left-4">Fin</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex items-center md:self-start md:mt-0 mt-6">
                <button
                  onClick={applyFilters}
                  className={`${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#365486] hover:bg-[#344663] hover:scale-105"
                  } text-white px-6 py-2 rounded-full text-sm font-semibold h-[38px] w-full md:w-auto`}
                  disabled={loading}
                >
                  {loading ? "Cargando..." : "Filtrar"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.responsive ? column.responsive : ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredValves.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4 text-gray-500 text-sm">
                    No hay válvulas para mostrar. Aplica filtros para ver resultados.
                  </td>
                </tr>
              ) : (
                filteredValves.map((valve, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    {columns.map((column) => (
                      <td
                        key={`${index}-${column.key}`}
                        className={`px-4 py-4 whitespace-nowrap text-sm text-gray-900 ${
                          column.responsive ? column.responsive : ""
                        }`}
                      >
                        {column.render
                          ? column.render(valve)
                          : valve[column.key] !== undefined
                            ? valve[column.key]
                            : ""}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false)
              // Solo limpiamos los resultados filtrados si es un error
              if (modalTitle === "Error") {
                setFilteredValves([])
              }
            }}
            title={modalTitle}
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default ValvesList
