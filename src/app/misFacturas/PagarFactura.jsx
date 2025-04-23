"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import NavBar from "../../components/NavBar"
import Modal from "../../components/Modal"
import BackButton from "../../components/BackButton"

const PagarFactura = () => {
  // Estados para manejar la factura y el proceso de pago
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [factura, setFactura] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [error, setError] = useState(null)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  // Estados para modales
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("")

  // Estado para la URL de redirección a Bold
  const [boldRedirectUrl, setBoldRedirectUrl] = useState("")

  const navigate = useNavigate()
  const location = useLocation()

  // Obtener el ID de la factura de la URL o del estado de navegación
  const getInvoiceId = () => {
    // Intentar obtener el ID de la factura del estado de navegación
    if (location.state && location.state.invoiceId) {
      return location.state.invoiceId
    }

    // Si no está en el estado, intentar extraerlo de la URL del referrer
    const referrer = document.referrer
    if (referrer && referrer.includes("/mis-facturas/detalle/")) {
      const parts = referrer.split("/")
      return parts[parts.length - 1]
    }

    // Si no se puede obtener, mostrar error
    return null
  }

  const API_URL = import.meta.env.VITE_APP_API_URL

  // Función para mostrar modal
  const showMessageModal = (message, title = "Información") => {
    setModalTitle(title)
    setModalMessage(message)
    setShowModal(true)
  }

  // Verificar autenticación y obtener datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          showMessageModal("No hay una sesión activa. Por favor, inicie sesión.", "Error de autenticación")
          setLoading(false)
          return
        }

        const userResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Token ${token}` },
        })

        setCurrentUser(userResponse.data)

        // Obtener el ID de la factura
        const invoiceId = getInvoiceId()

        if (!invoiceId) {
          showMessageModal(
            "No se pudo identificar la factura a pagar. Por favor, seleccione una factura desde el historial.",
            "Error",
          )
          setLoading(false)
          return
        }

        // Obtener datos de la factura
        const facturaResponse = await axios.get(`${API_URL}/billing/bills/${invoiceId}`, {
          headers: { Authorization: `Token ${token}` },
        })

        // Verificar si la factura pertenece al usuario
        if (facturaResponse.data.client_document !== userResponse.data.document) {
          showMessageModal("No tiene permisos para pagar esta factura.", "Acceso denegado")
          setLoading(false)
          return
        }

        // Verificar si la factura está pendiente o vencida
        const status = facturaResponse.data.status?.toLowerCase()
        if (status !== "pendiente" && status !== "vencida") {
          showMessageModal("Esta factura no requiere pago o ya ha sido pagada.", "Información")
          setLoading(false)
          return
        }

        setFactura(facturaResponse.data)
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        let errorMessage = "Error al cargar los datos. Por favor, intente de nuevo más tarde."

        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = "Su sesión ha expirado. Por favor, inicie sesión nuevamente."
            navigate("/login")
          } else if (error.response.data?.detail) {
            errorMessage = error.response.data.detail
          }
        }

        setError(errorMessage)
        showMessageModal(errorMessage, "ERROR")
        setLoading(false)
      }
    }

    fetchUserData()
  }, [API_URL, navigate])

  // Función para iniciar el proceso de pago
  const iniciarProcesoPago = async () => {
    try {
      setProcessingPayment(true)

      // Simulamos un pequeño retraso para mostrar el estado de procesamiento
      setTimeout(() => {
        // Abrir Bold en una nueva pestaña en lugar de redirigir
        window.open("https://bold.co/", "_blank")

        // Después de abrir Bold, simulamos que el pago fue exitoso
        setTimeout(() => {
          // Simular actualización del estado de la factura a "Pagada"
          if (factura) {
            // Crear una copia de la factura con estado actualizado
            const facturaActualizada = {
              ...factura,
              status: "Pagada",
            }

            // Actualizar el estado de la factura
            setFactura(facturaActualizada)

            // Marcar el pago como completado
            setPaymentCompleted(true)

            // Intentar actualizar la factura en el backend (simulado)
            try {
              const token = localStorage.getItem("token")

              // En un entorno real, esto actualizaría el estado en el backend
              console.log("Actualizando estado de factura en el backend:", facturaActualizada.id_bill)

              // Simulamos una actualización exitosa en el backend
              localStorage.setItem(`factura_${facturaActualizada.id_bill}_status`, "Pagada")
            } catch (error) {
              console.error("Error al actualizar estado en backend:", error)
            }

            // Mostrar mensaje de éxito
            showMessageModal("¡Pago procesado con éxito! La factura ha sido marcada como pagada.", "Pago Exitoso")

            // Finalizar el procesamiento
            setProcessingPayment(false)
          }
        }, 3000) // Simulamos que el pago toma 3 segundos en procesarse
      }, 1500)
    } catch (error) {
      console.error("Error al iniciar el pago:", error)
      const errorMessage = "Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico"

      setError(errorMessage)
      showMessageModal(errorMessage, "ERROR")
      setProcessingPayment(false)
    }
  }

  // Formatear número como moneda en COP
  const formatCurrency = (value) => {
    if (!value) return "$0"

    const numValue = Number.parseFloat(value)
    return `$${numValue.toLocaleString("es-CO")}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto p-4 md:p-8 pt-20">
        <h1 className="text-center my-10 text-2xl font-semibold">Pago de Factura</h1>

        {/* Modal para mensajes y errores */}
        <Modal
          showModal={showModal}
          onClose={() => {
            setShowModal(false)
            // Si hay error crítico o la factura ya está pagada, redirigir
            if (modalTitle === "Acceso denegado" || modalMessage.includes("ya ha sido pagada")) {
              navigate("/mis-facturas")
            }
            // Si es un mensaje de pago exitoso, redirigir al detalle de la factura
            else if (modalTitle === "Pago Exitoso" && factura) {
              // Antes de redirigir, intentamos actualizar la factura en el backend (simulado)
              try {
                const token = localStorage.getItem("token")

                // En un entorno real, esto actualizaría el estado en el backend
                console.log("Confirmando actualización de factura antes de redirigir:", factura.id_bill)

                // Simulamos una actualización exitosa en el backend
                localStorage.setItem(`factura_${factura.id_bill}_status`, "Pagada")

                // Redirigir al detalle de la factura con el ID y un parámetro para forzar la actualización
                navigate(`/mis-facturas/detalle/${factura.id_bill}?updated=true`)
              } catch (error) {
                console.error("Error al confirmar actualización:", error)
                navigate(`/mis-facturas/detalle/${factura.id_bill}`)
              }
            }
          }}
          title={modalTitle}
          btnMessage="Entendido"
        >
          <p>{modalMessage}</p>
        </Modal>

        {/* Estado de carga */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Cargando información de pago...</span>
          </div>
        )}

        {/* Procesando pago */}
        {processingPayment && (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <span className="text-gray-600 text-lg">Conectando con la pasarela de pago...</span>
            <p className="text-gray-500 mt-2">Por favor, no cierre esta ventana.</p>
          </div>
        )}

        {/* Información de pago */}
        {!loading && !processingPayment && factura && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Resumen de Pago</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Código de Factura:</span>
                  <span className="font-medium">{factura.code}</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Lote:</span>
                  <span className="font-medium">{factura.lot_code}</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{factura.client_name}</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Documento:</span>
                  <span className="font-medium">{factura.client_document}</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Fecha de Vencimiento:</span>
                  <span className="font-medium">{new Date(factura.due_payment_date).toLocaleDateString("es-CO")}</span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Estado:</span>
                  <span
                    className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                    ${factura.status.toLowerCase() === "pendiente" ? "bg-fuchsia-100 text-fuchsia-800" : ""} 
                    ${factura.status.toLowerCase() === "vencida" ? "bg-red-100 text-red-800" : ""}
                    ${factura.status.toLowerCase() === "pagada" ? "bg-green-100 text-green-800" : ""}
                  `}
                  >
                    {factura.status}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-gray-800 font-semibold text-lg">Total a Pagar:</span>
                  <span className="font-bold text-lg text-blue-800">{formatCurrency(factura.total_amount)}</span>
                </div>
              </div>

              {/* Mostrar mensaje de pago completado si corresponde */}
              {paymentCompleted && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md mb-6">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="font-medium">¡Pago completado con éxito! La factura ha sido marcada como pagada.</p>
                  </div>
                </div>
              )}

              {!paymentCompleted && (
                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <p className="text-sm text-gray-600">
                    Al hacer clic en "Proceder al Pago", será redirigido a la pasarela de pago Bold para completar la
                    transacción de forma segura.
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between space-y-3 md:space-y-0 md:space-x-3">
                <BackButton
                  to={`/mis-facturas/detalle/${factura.id_bill}`}
                  text="Cancelar"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                />

                {!paymentCompleted ? (
                  <button
                    onClick={iniciarProcesoPago}
                    className="bg-[#365486] text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-[#344663] transition-colors duration-200 flex-1 md:flex-none"
                  >
                    Proceder al Pago
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/mis-facturas/detalle/${factura.id_bill}`)}
                    className="bg-green-600 text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors duration-200 flex-1 md:flex-none"
                  >
                    Ver Factura Pagada
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de error si no hay factura */}
        {!loading && !processingPayment && !factura && error && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-red-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <BackButton
                to="/mis-facturas"
                text="Volver a Mis Facturas"
                className="bg-[#365486] text-white hover:bg-[#344663]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PagarFactura
