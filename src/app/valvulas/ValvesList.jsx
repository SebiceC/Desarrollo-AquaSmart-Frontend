"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import NavBar from "../../components/NavBar"
import Modal from "../../components/Modal"
import DataTable from "../../components/DataTable"
import { Search } from "lucide-react"

const ValvesList = () => {
  const navigate = useNavigate()
  const [valves, setValves] = useState([])
  const [plots, setPlots] = useState([]) // Añadido para almacenar los predios
  const [filteredValves, setFilteredValves] = useState([])
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("ERROR")
  const [filters, setFilters] = useState({
    id: "",
    name: "",
    plotId: "",
    status: "todos",
    startDate: "",
    endDate: "",
  })

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Lista de nombres que identifican a las válvulas
  const valveNames = ["válvula", "valvula", "electroválvula", "electrovalvula"]
  // Códigos de tipo para válvulas
  const valveTypeCodes = ["01", "03"] // 01 para Electroválvula, 03 para Válvula

  useEffect(() => {
    const fetchValves = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No hay una sesión activa. Por favor, inicie sesión.")
          return
        }

        // Obtener la lista de predios primero
        const plotsResponse = await axios.get(`${API_URL}/plot-lot/plots/list`, {
          headers: { Authorization: `Token ${token}` },
        })

        console.log("Predios obtenidos:", plotsResponse.data)
        setPlots(plotsResponse.data)

        // Obtener la lista de dispositivos IoT desde la API
        const devicesResponse = await axios.get(`${API_URL}/iot/iot-devices`, {
          headers: { Authorization: `Token ${token}` },
        })

        console.log("Dispositivos IoT obtenidos:", devicesResponse.data)

        // Verificar la estructura de los datos para depuración
        if (devicesResponse.data.length > 0) {
          console.log("Ejemplo de estructura de dispositivo:", devicesResponse.data[0])
          console.log("Propiedades disponibles:", Object.keys(devicesResponse.data[0]))

          // Mostrar todos los tipos de dispositivos únicos
          const deviceTypes = [
            ...new Set(devicesResponse.data.map((device) => device.device_type_name || device.type || "desconocido")),
          ]
          console.log("Tipos de dispositivos encontrados:", deviceTypes)
        }

        // Filtrar válvulas basado en el tipo de dispositivo y nombre como respaldo
        const valvesData = devicesResponse.data.filter((device) => {
          // 1. Verificar por device_type_name (como en DispositivosIoTList)
          if (device.device_type_name) {
            const typeLower = device.device_type_name.toLowerCase()
            // Verificar si contiene palabras clave de válvulas
            if (valveNames.some((name) => typeLower.includes(name))) {
              return true
            }
            // Verificar si contiene códigos de tipo de válvula
            if (valveTypeCodes.some((code) => device.device_type_name.includes(`(${code})`))) {
              return true
            }
          }

          // 2. Verificar por type
          if (device.type) {
            const typeLower = device.type.toLowerCase()
            // Verificar si contiene palabras clave de válvulas
            if (valveNames.some((name) => typeLower.includes(name))) {
              return true
            }
            // Verificar si contiene códigos de tipo de válvula
            if (valveTypeCodes.some((code) => device.type.includes(`(${code})`))) {
              return true
            }
          }

          // 3. Respaldo: verificar por nombre como se hacía originalmente
          if (device.name) {
            const nameLower = device.name.toLowerCase()
            if (valveNames.some((name) => nameLower.includes(name))) {
              return true
            }
          }

          return false
        })

        console.log("Válvulas filtradas por tipo y nombre:", valvesData)
        console.log("Cantidad de válvulas encontradas:", valvesData.length)

        // Mapear los datos para que coincidan con la estructura esperada por el componente
        // y añadir el nombre del predio
        const formattedValves = valvesData.map((device) => {
          // Buscar el predio asociado para obtener su nombre
          const associatedPlot = plotsResponse.data.find((plot) => plot.id_plot === device.id_plot)

          return {
            id: device.iot_id,
            name: device.name || "Sin nombre",
            assigned_plot: device.id_plot || "N/A",
            plot_name: associatedPlot ? associatedPlot.plot_name : "N/A",
            is_active: device.is_active,
            current_flow: device.current_flow || 0,
            max_flow: device.max_flow || 100,
            flow_unit: device.flow_unit || "L/min",
            valve_type: device.device_type_name || device.type || device.valve_type || "N/A",
            registration_date:
              device.registration_date ||
              (associatedPlot ? associatedPlot.registration_date : new Date().toISOString()),
            last_update: device.last_update || new Date().toISOString(),
            property: associatedPlot ? associatedPlot.property : "N/A",
          }
        })

        console.log("Válvulas formateadas con nombres de predios:", formattedValves)
        setValves(formattedValves)
        setFilteredValves([])
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

        setError(errorMessage)
      }
    }

    fetchValves()
  }, [API_URL])

  const openErrorModal = (message, title = "Error") => {
    console.log(`${title}: ${message}`)
    setModalTitle(title)
    setModalMessage(message)
    setShowModal(true)
  }

  const handleView = (valve) => {
    navigate(`/control-IoT/valvulas/${valve.id}`)
  }

  const handleEdit = (valve) => {
    if (!valve.is_active) {
      openErrorModal("No se puede ajustar el caudal de una válvula inactiva.", "Advertencia")
      return
    }
    navigate(`/control-IoT/valvulas/${valve.id}/update-flow`)
  }

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  const applyFilters = () => {
    try {
      let filtered = valves

      // Validación de ID de válvula
      if (filters.id.trim() !== "" && !/^V\d{3}$/.test(filters.id.trim()) && !/^\d+$/.test(filters.id.trim())) {
        setModalMessage(
          "El ID de válvula ingresado contiene un formato no válido. Por favor, verifique e intente nuevamente.",
        )
        setShowModal(true)
        return
      }

      // Validación de ID de predio
      if (
        filters.plotId.trim() !== "" &&
        !/^PR-\d{7}$/.test(filters.plotId.trim()) &&
        !/^\d+$/.test(filters.plotId.trim())
      ) {
        setModalMessage(
          "El ID de predio ingresado contiene un formato no válido. Por favor, verifique e intente nuevamente.",
        )
        setShowModal(true)
        return
      }

      // Validación de fechas
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage(
          "La fecha de inicio no puede ser posterior a la fecha de fin. Por favor, ajuste el rango de fechas.",
        )
        setShowModal(true)
        return
      }

      // Filtrado de válvulas
      if (filters.id.trim() !== "") {
        filtered = filtered.filter((valve) => valve.id.toLowerCase().includes(filters.id.trim().toLowerCase()))
      }

      if (filters.name.trim() !== "") {
        filtered = filtered.filter((valve) => valve.name.toLowerCase().includes(filters.name.trim().toLowerCase()))
      }

      if (filters.plotId.trim() !== "") {
        filtered = filtered.filter((valve) =>
          valve.assigned_plot.toLowerCase().includes(filters.plotId.trim().toLowerCase()),
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
        setShowModal(true)
      }

      setFilteredValves(filtered)
    } catch (error) {
      console.error("Error al aplicar filtros:", error)
      setModalMessage(
        "Ha ocurrido un error al procesar su solicitud de filtrado. Por favor, intente nuevamente o contacte al soporte técnico.",
      )
      setShowModal(true)
      setFilteredValves([])
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "NOMBRE" },
    { key: "assigned_plot", label: "ID PREDIO" },
    { key: "plot_name", label: "NOMBRE PREDIO", responsive: "hidden md:table-cell" },
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
      render: (valve) => new Date(valve.registration_date).toLocaleDateString(),
    },
  ]

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
                    placeholder="ID de predio"
                    className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                    value={filters.plotId}
                    onChange={(e) => handleFilterChange("plotId", e.target.value)}
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
                <p className="text-gray-500 text-sm text-center absolute md:top-[-20px] left-0 right-0">
                  Filtrar por fecha de registro
                </p>
                <div className="flex items-center bg-gray-100 rounded-full px-1 w-full border border-gray-300">
                  <span className="text-gray-400 pl-1 pr-0 flex-shrink-0">
                    <Search size={16} />
                  </span>

                  <input
                    type="date"
                    name="startDate"
                    className="w-full min-w-0 pl-1 pr-0 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
                    value={filters.startDate || ""}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />

                  <span className="text-gray-400 px-1 flex-shrink-0">|</span>

                  <input
                    type="date"
                    name="endDate"
                    className="w-full min-w-0 pl-0 pr-1 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
                    value={filters.endDate || ""}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  />
                </div>
                <div className="flex justify-between text-gray-400 text-xs px-2 mt-1">
                  <span>Inicio</span>
                  <span>Fin</span>
                </div>
              </div>

              <div className="w-full md:w-auto flex items-center md:self-start md:mt-0">
                <button
                  onClick={applyFilters}
                  className="bg-[#365486] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#344663] hover:scale-105 h-[38px]"
                >
                  Filtrar
                </button>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredValves.length > 0 ? filteredValves : []}
          emptyMessage="No hay válvulas para mostrar. Aplica filtros para ver resultados."
          onView={handleView}
          onEdit={handleEdit}
          actionLabels={{
            view: "Ver detalles",
            edit: "Ajustar caudal",
          }}
        />

        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false)
              setFilteredValves([])
            }}
            title={modalTitle}
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}
      </div>
    </div>
  )
}

export default ValvesList

