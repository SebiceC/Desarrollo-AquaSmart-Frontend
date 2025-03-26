"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import DataTable from "../../../components/DataTable"
import { Search } from "lucide-react"

const PreRegistrosList = () => {
  const navigate = useNavigate()
  const [registros, setRegistros] = useState([])
  const [filteredRegistros, setFilteredRegistros] = useState([])
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [filters, setFilters] = useState({
    id: "",
    startDate: "",
    endDate: "",
    status: "todos",
  })

  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const token = localStorage.getItem("token")
        const API_URL = import.meta.env.VITE_APP_API_URL
        const response = await axios.get(`${API_URL}/users/admin/listed`, {
          headers: { Authorization: `Token ${token}` },
        })

        console.log("Respuesta del servidor:", response.data)
        setRegistros(response.data)
        setFilteredRegistros([])
      } catch (err) {
        console.error("Error al obtener los pre-registros:", err)

        // Extract detailed error message from response
        let errorMessage = "No se pudieron cargar los pre-registros."

        if (err.response) {
          // If we have a response object with data
          if (err.response.status === 403) {
            errorMessage = "No tiene permisos para acceder a los pre-registros."
            if (err.response.data?.detail) {
              errorMessage = err.response.data.detail
            }
          } else if (err.response.data?.detail) {
            errorMessage = err.response.data.detail
          } else if (err.response.data?.message) {
            errorMessage = err.response.data.message
          }

          console.log("Código de estado:", err.response.status)
          console.log("Mensaje de error:", errorMessage)
        } else if (err.request) {
          // Request was made but no response received
          errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet."
        } else {
          // Error in setting up the request
          errorMessage = `Error de configuración: ${err.message}`
        }

        setError(errorMessage)
      }
    }

    fetchRegistros()
  }, [])

  const openErrorModal = (message) => {
    console.log("Error message:", message)
    setModalMessage(message)
    setShowModal(true)
  }

  const handleRedirect = async (documentId) => {
    try {
      navigate(`/gestionDatos/pre-registros/${documentId}`)
    } catch (error) {
      console.error("Error al redirigir:", error)
      const errorMessage = error.response?.data?.message || "Ocurrió un error al intentar redirigir al registro."
      openErrorModal(errorMessage)
    }
  }

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  const applyFilters = () => {
    try {
      let filtered = registros

      if (filters.id.trim() !== "" && !/^\d+$/.test(filters.id.trim())) {
        setModalMessage("El campo de filtrado por ID contiene caracteres no válidos o el usuario no existe.")
        setShowModal(true)
        return
      }

      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.")
        setShowModal(true)
        return
      }

      if (filters.id.trim() !== "") {
        filtered = filtered.filter((registro) => registro.document.includes(filters.id.trim()))
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate).setHours(0, 0, 0, 0)
        filtered = filtered.filter((registro) => {
          const registroDate = new Date(registro.date_joined).setHours(0, 0, 0, 0)
          return registroDate >= startDate
        })
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate).setHours(23, 59, 59, 999)
        filtered = filtered.filter((registro) => {
          const registroDate = new Date(registro.date_joined).setHours(23, 59, 59, 999)
          return registroDate <= endDate
        })
      }

      if (filters.status !== "todos") {
        filtered = filtered.filter((registro) => {
          if (filters.status === "pendiente") {
            return !registro.is_active && !registro.is_registered
          } else if (filters.status === "aprobado") {
            return registro.is_active && registro.is_registered
          } else if (filters.status === "rechazado") {
            return !registro.is_active && registro.is_registered
          }
          return true
        })
      }

      if (filtered.length === 0) {
        openErrorModal("No se encontraron resultados para los filtros aplicados.")
      }

      setFilteredRegistros(filtered)
    } catch (error) {
      console.error("Error al aplicar filtros:", error)
      const errorMessage = error.response?.data?.message || "Ocurrió un error al aplicar los filtros."
      openErrorModal(errorMessage)
    }
  }

  const columns = [
    {
      key: "document",
      label: "ID del usuario",
      render: (item) => item.document,
    },
    {
      key: "date_joined",
      label: "Fecha",
      render: (item) =>
        item.date_joined
          ? new Date(item.date_joined).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          : "Fecha no disponible",
    },
    {
      key: "status",
      label: "Estado",
      render: (item) => (
        <span
          className={`font-bold
            ${item.is_active && item.is_registered ? "text-green-600" : ""}
            ${!item.is_active && item.is_registered ? "text-red-600" : ""}
            ${!item.is_registered ? "text-yellow-600" : ""}
          `}
        >
          {item.is_active && item.is_registered
            ? "Aprobado"
            : !item.is_active && item.is_registered
              ? "Inactivo"
              : "Pendiente"}
        </span>
      ),
    },
    {
      key: "action",
      label: "Acción",
      render: (item) => (
        <button
          onClick={() => handleRedirect(item.document)}
          className="bg-[#365486] hover:bg-[#42A5F5] text-white text-xs px-4 py-1 h-8 rounded-lg w-24"
        >
          {item.is_active && item.is_registered ? "Ver" : !item.is_active && item.is_registered ? "Ver" : "Responder"}
        </button>
      ),
    },
  ]

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">Solicitudes de pre registros</h1>

        {error && <p className="text-center text-red-600">{error}</p>}

        <div className="mb-6">
          <div className="p-4 rounded-lg flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between flex-wrap">
            <div className="relative w-full lg:w-[22%] xl:w-1/5">
              <span className="absolute left-3 top-2 text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Buscar por ID de usuario"
                className="w-full pl-10 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none text-sm"
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "")
                }}
                value={filters.id}
                onChange={(e) => handleFilterChange("id", e.target.value)}
                maxLength={15}
              />
            </div>

            <div className="relative w-full lg:w-[22%] xl:w-1/5">
              <select
                className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-full focus:outline-none appearance-none text-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="todos">ESTADO</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Inactivo</option>
              </select>
              <span className="absolute top-3 right-4 text-gray-400">
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            <div className="w-full lg:w-[30%] xl:w-1/3">
              <p className="text-gray-500 text-sm text-center mb-1">Filtrar por fecha de registro</p>
              <div className="flex items-center bg-gray-100 rounded-full px-1 w-full border border-gray-300">
                <span className="text-gray-400 px-2 flex-shrink-0">
                  <Search size={18} />
                </span>

                <input
                  type="date"
                  name="startDate"
                  className="w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
                  value={filters.startDate || ""}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />

                <span className="text-gray-400 px-2 flex-shrink-0">|</span>

                <input
                  type="date"
                  name="endDate"
                  className="w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none text-gray-500 text-sm"
                  value={filters.endDate || ""}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
              <div className="flex justify-between text-gray-400 text-xs px-2 mt-1">
                <span>Inicio</span>
                <span>Fin</span>
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="bg-[#365486] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#344663] hover:scale-105 w-full lg:w-auto"
            >
              Filtrar
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRegistros}
          emptyMessage="No hay usuarios para mostrar. Aplica filtros para ver resultados."
          actions={false}
        />
      </div>

      {showModal && (
        <Modal
          showModal={showModal}
          onClose={() => {
            setShowModal(false)
            setFilteredRegistros([])
          }}
          title="Error"
          btnMessage="Cerrar"
        >
          <p>{modalMessage}</p>
        </Modal>
      )}
    </div>
  )
}

export default PreRegistrosList