"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../../components/NavBar"
import Modal from "../../components/Modal"
import BackButton from "../../components/BackButton"

const ValveDetail = () => {
  const { id_valve } = useParams()
  const navigate = useNavigate()
  const [valve, setValve] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("Información")

  // Datos quemados para simular la respuesta de la API
  const mockValves = {
    "V001": {
      id: "V001",
      name: "Válvula Principal Sector Norte",
      assigned_plot: "Predio Las Palmas",
      property: "Finca El Paraíso",
      is_active: true,
      current_flow: 75,
      max_flow: 100,
      flow_unit: "L/min",
      valve_type: "Compuerta",
      last_update: "2023-11-15T10:30:00Z"
    },
    "V002": {
      id: "V002",
      name: "Válvula Secundaria Sector Este",
      assigned_plot: "Predio Los Pinos",
      property: "Finca La Esperanza",
      is_active: true,
      current_flow: 45,
      max_flow: 80,
      flow_unit: "L/min",
      valve_type: "Mariposa",
      last_update: "2023-11-14T16:45:00Z"
    },
    "V003": {
      id: "V003",
      name: "Válvula Auxiliar Sector Sur",
      assigned_plot: "Predio El Roble",
      property: "Finca Los Naranjos",
      is_active: false,
      current_flow: 0,
      max_flow: 120,
      flow_unit: "L/min",
      valve_type: "Globo",
      last_update: "2023-11-10T09:15:00Z"
    },
    "V004": {
      id: "V004",
      name: "Válvula Principal Sector Oeste",
      assigned_plot: "Predio La Colina",
      property: "Finca El Manantial",
      is_active: true,
      current_flow: 95,
      max_flow: 150,
      flow_unit: "L/min",
      valve_type: "Compuerta",
      last_update: "2023-11-16T11:20:00Z"
    },
    "V005": {
      id: "V005",
      name: "Válvula Reguladora Central",
      assigned_plot: "Predio Central",
      property: "Finca La Victoria",
      is_active: true,
      current_flow: 60,
      max_flow: 100,
      flow_unit: "L/min",
      valve_type: "Reguladora",
      last_update: "2023-11-15T14:10:00Z"
    }
  }

  useEffect(() => {
    // Simulamos una carga de datos con un pequeño retraso
    const timer = setTimeout(() => {
      if (mockValves[id_valve]) {
        setValve(mockValves[id_valve])
        setLoading(false)
      } else {
        setError("No se encontró la válvula solicitada.")
        setLoading(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [id_valve])

  const handleUpdateFlow = () => {
    navigate(`/control-IoT/valvulas/${id_valve}/update-flow`)
  }

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="container mx-auto p-6 mt-24">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 text-lg">Cargando información de la válvula...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <NavBar />
        <div className="container mx-auto p-6 mt-24">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <div className="mt-4">
            <BackButton to="/control-IoT/valvulas" text="Volver a la lista de válvulas" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <NavBar />

      <Modal showModal={showModal} onClose={() => setShowModal(false)} title={modalTitle} btnMessage="Aceptar">
        <p>{modalMessage}</p>
      </Modal>

      <div className="container mx-auto p-6 mt-16">
        <h1 className="text-2xl font-bold text-center mb-8">Detalles de la válvula</h1>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Información general</h2>
              <div className="space-y-3">
                <div>
                  <p>
                    <span className="font-medium">ID:</span> {valve.id}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Nombre:</span> {valve.name}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Predio asignado:</span> {valve.assigned_plot}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Fincario:</span> {valve.property}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Estado:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs ${valve.is_active ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"}`}
                    >
                      {valve.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Información técnica</h2>
              <div className="space-y-3">
                <div>
                  <p>
                    <span className="font-medium">Caudal actual:</span> {valve.current_flow} {valve.flow_unit}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Caudal máximo:</span> {valve.max_flow} {valve.flow_unit}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Tipo de válvula:</span> {valve.valve_type || "No especificado"}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Última actualización:</span>{" "}
                    {valve.last_update ? new Date(valve.last_update).toLocaleString() : "No disponible"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleUpdateFlow}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              disabled={!valve.is_active}
            >
              Ajustar caudal
            </button>
          </div>

          {!valve.is_active && (
            <p className="text-red-500 text-sm text-center mt-2">
              La válvula debe estar activa para poder ajustar el caudal
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-start">
          <BackButton to="/control-IoT/valvulas" text="Volver a la lista de válvulas" />
        </div>
      </div>
    </div>
  )
}

export default ValveDetail