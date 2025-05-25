"use client"

import { useEffect, useState } from "react"
import NavBar from "../../../components/NavBar"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import InputFilterLote from "../../../components/InputFilterLote"
import Modal from "../../../components/Modal"
import DataTable from "../../../components/DataTable"
import { Brain, User } from "lucide-react"

const MisPredicciones = () => {
  const navigate = useNavigate()
  const [lotes, setLotes] = useState([])
  const [predios, setPredios] = useState([])
  const [filteredLotes, setFilteredLotes] = useState(null)
  const [modalMessage, setModalMessage] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [userDocument, setUserDocument] = useState("")
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    id: "",
    lotId: "",
    startDate: "",
    endDate: "",
  })

  const API_URL = import.meta.env.VITE_APP_API_URL
  const cropTypeMap = {
    1: "Piscicultura",
    2: "Agricultura",
  }

  // Obtener información del usuario autenticado y sus lotes
  useEffect(() => {
    const fetchUserAndLotes = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          setModalMessage("No hay una sesión activa. Por favor, inicie sesión.")
          setShowModal(true)
          return
        }

        // Obtener información del usuario actual
        const userResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Token ${token}` },
        })

        setUserDocument(userResponse.data.document)

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

        // Filtrar solo los lotes que pertenecen a los predios del usuario actual y están activos
        const userPrediosIds = userPredios.map((predio) => predio.id_plot)
        const userLotes = lotesResponse.data.filter(
          (lote) => userPrediosIds.includes(lote.plot) && lote.is_activate === true,
        )

        // Combinar la información de lotes y predios
        const lotesConPredios = userLotes.map((lote) => {
          const predio = userPredios.find((p) => p.id_plot === lote.plot)
          return {
            ...lote,
            predioOwner: predio ? predio.owner : userResponse.data.document,
          }
        })

        setLotes(lotesConPredios)
        console.log("Lotes del usuario con propietarios:", lotesConPredios)
      } catch (error) {
        console.error("Error al obtener los lotes del usuario:", error)
        if (error.response?.status === 401) {
          setModalMessage("Sesión expirada. Por favor, inicie sesión nuevamente.")
          setShowModal(true)
        } else {
          setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico")
          setShowModal(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndLotes()
  }, [API_URL])

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  const applyFilters = () => {
    try {
      // Validación de ID del predio
      if (filters.id.trim() !== "") {
        const isPrefixValid = /^(P|PR|PR-\d{0,7})$/.test(filters.id.trim())
        const isOnlyDigits = /^\d+$/.test(filters.id.trim())

        if (!isPrefixValid && !isOnlyDigits) {
          setModalMessage("El campo ID del predio contiene caracteres no válidos")
          setShowModal(true)
          setFilteredLotes([])
          return
        }
      }

      // Validación de ID del lote (máximo 11 caracteres según requerimiento)
      if (filters.lotId.trim() !== "") {
        if (filters.lotId.trim().length > 11) {
          setModalMessage("El campo ID del lote no puede tener más de 11 caracteres")
          setShowModal(true)
          setFilteredLotes([])
          return
        }

        const isValidLoteFormat = /^(\d{1,11}|\d{1,11}-\d{0,3})$/.test(filters.lotId.trim())
        if (!isValidLoteFormat) {
          setModalMessage("El campo ID del lote contiene caracteres no válidos")
          setShowModal(true)
          setFilteredLotes([])
          return
        }
      }

      // Validación de fechas
      if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
        setModalMessage("La fecha de inicio no puede ser mayor que la fecha de fin.")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      // Filtrado de lotes
      const filtered = lotes.filter((lote) => {
        const matchesId = filters.id.trim() === "" || lote.plot.toLowerCase().includes(filters.id.trim().toLowerCase())

        const matchesIdlote =
          filters.lotId.trim() === "" ||
          lote.id_lot?.toLowerCase().includes(filters.lotId.trim().toLowerCase()) ||
          lote.id?.toLowerCase().includes(filters.lotId.trim().toLowerCase())

        let matchesDate = true
        if (filters.startDate !== "" || filters.endDate !== "") {
          const loteDate = new Date(lote.registration_date)
          const loteDateStr = loteDate.toISOString().split("T")[0]

          if (filters.startDate !== "") {
            const startDateStr = new Date(filters.startDate).toISOString().split("T")[0]
            if (loteDateStr < startDateStr) {
              matchesDate = false
            }
          }

          if (matchesDate && filters.endDate !== "") {
            const endDateStr = new Date(filters.endDate).toISOString().split("T")[0]
            if (loteDateStr > endDateStr) {
              matchesDate = false
            }
          }
        }

        return matchesId && matchesIdlote && matchesDate
      })

      // Validaciones específicas según requerimiento
      if (filters.id.trim() !== "" && filtered.length === 0) {
        setModalMessage("El predio filtrado no existe")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      if (filters.lotId.trim() !== "" && filtered.length === 0) {
        setModalMessage("El lote filtrado no existe")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      if (filters.startDate !== "" && filters.endDate !== "" && filtered.length === 0) {
        setModalMessage("No hay lotes registrados en el rango de fechas especificado.")
        setShowModal(true)
        setFilteredLotes([])
        return
      }

      setFilteredLotes(filtered)
    } catch (error) {
      setModalMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico")
      setShowModal(true)
      setFilteredLotes([])
    }
  }

  const handleSelectLote = (lote) => {
    navigate(`/mis-predicciones/${lote.id_lot}`)
  }

  // Configuración de columnas para DataTable
  const columns = [
    { key: "id_lot", label: "ID Lote" },
    {
      key: "crop_type",
      label: "Variedad del Cultivo",
      render: (lote) => cropTypeMap[lote.crop_type] || `Tipo ${lote.crop_type}`,
    },
    { key: "plot", label: "ID Predio" },
    {
      key: "registration_date",
      label: "Fecha Registro",
      responsive: "hidden sm:table-cell",
      render: (lote) => new Date(lote.registration_date).toLocaleDateString("es-ES"),
    },
    {
      key: "actions",
      label: "Acción",
      render: (lote) => (
        <button
          onClick={() => handleSelectLote(lote)}
          className="font-bold py-2 px-4 rounded transition-colors bg-[#365486] hover:bg-blue-700 text-white"
          title="SELECCIONAR"
        >
          Seleccionar
        </button>
      ),
    },
  ]

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="container mx-auto p-4 md:p-8 lg:p-20">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#365486] mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando mis lotes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-20">
        <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">Mis Lotes</h1>

        {/* Header con información del usuario */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="text-blue-600" size={16} />
              <span className="text-blue-800 font-medium">Usuario: {userDocument}</span>
            </div>
            {filteredLotes !== null && (
              <span className="text-blue-600 font-medium">{filteredLotes.length} lotes disponibles</span>
            )}
          </div>
        </div>

        <InputFilterLote
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          showPersonTypeFilter={false}
          showStatusFilter={false}
        />

        {/* Modal de mensajes */}
        {showModal && (
          <Modal
            showModal={showModal}
            onClose={() => {
              setShowModal(false)
              if (modalMessage.includes("sesión")) {
                navigate("/login")
              }
            }}
            title="Error"
            btnMessage="Cerrar"
          >
            <p>{modalMessage}</p>
          </Modal>
        )}

        {/* Tabla de lotes */}
        {filteredLotes !== null ? (
          <DataTable
            columns={columns}
            data={filteredLotes}
            emptyMessage="No se encontraron lotes con los filtros aplicados."
            actions={false}
          />
        ) : (
          <div className="text-center my-10">
            {lotes.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <Brain className="mx-auto text-yellow-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No tienes lotes registrados</h3>
                <p className="text-yellow-700">
                  Para usar las predicciones de consumo, necesitas tener al menos un lote activo registrado a tu nombre.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MisPredicciones
