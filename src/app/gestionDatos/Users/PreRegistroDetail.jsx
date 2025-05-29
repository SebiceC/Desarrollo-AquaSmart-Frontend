import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import NavBar from "../../../components/NavBar"
import Modal from "../../../components/Modal"
import BackButton from "../../../components/BackButton"
import Button from "../../../components/Button"
import ErrorDisplay from "../../../components/error-display"
import Footer from "../../../components/Footer"

const PreRegistroDetail = () => {
  const { document } = useParams()
  const [registro, setRegistro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rejectReasonVisible, setRejectReasonVisible] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [buttonsVisible, setButtonsVisible] = useState(true)
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalTitle, setModalTitle] = useState("Alerta")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const personTypeNames = {
    1: "Natural",
    2: "Jurídica",
  }

  useEffect(() => {
    const fetchRegistro = async () => {
      try {
        const token = localStorage.getItem("token")
        const API_URL = import.meta.env.VITE_APP_API_URL
        const response = await axios.get(`${API_URL}/users/admin/update/${document}`, {
          headers: { Authorization: `Token ${token}` },
        })
        setRegistro(response.data)
        if (response.data.is_registered) {
          setButtonsVisible(false)
        }
      } catch (err) {
        console.error("Error al obtener el registro:", err)

        let errorMessage = "No se pudo cargar la información del registro."

        if (err.response) {
          if (err.response.status === 403) {
            errorMessage = "No tiene permisos para acceder a este registro."
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
          errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet."
        } else {
          errorMessage = `Error de configuración: ${err.message}`
        }

        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchRegistro()
  }, [document])

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="max-w-3xl mx-auto p-6 mt-30 bg-white rounded-lg shadow animate-pulse">
          <h1 className="text-xl font-medium text-center mb-2 bg-gray-300 h-6 w-1/3 mx-auto rounded"></h1>
          <p className="text-sm text-gray-400 text-center mb-6 bg-gray-200 h-4 w-1/2 mx-auto rounded"></p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
                <div className="bg-gray-200 h-6 w-full rounded"></div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-6 w-24 rounded"></div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <div className="bg-gray-400 h-10 w-24 rounded"></div>
            <div className="bg-gray-400 h-10 w-24 rounded"></div>
          </div>

          <div className="flex justify-start gap-2 mt-6">
            <div className="bg-gray-400 h-10 w-32 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <NavBar />
        <ErrorDisplay message={error} backTo="/gestionDatos/pre-registros" backText="Regresar a la lista" />
      </div>
    )
  }

  const handleReject = () => {
    setRejectReasonVisible(true)
    setButtonsVisible(false)
  }

  const handleRejectReasonChange = (event) => {
    const value = event.target.value
    setRejectReason(value)
    setIsSubmitEnabled(value.trim().length >= 5)
  }

  const handleSubmitRejection = async () => {
    if (rejectReason.trim().length < 5) {
      setModalTitle("Validación requerida")
      setModalMessage("La justificación debe tener al menos 5 caracteres para poder procesar el rechazo.")
      setShowModal(true)
      return
    }

    if (rejectReason.length > 200) {
      setModalTitle("Límite excedido")
      setModalMessage("La justificación no puede exceder los 200 caracteres. Por favor, reduzca el texto.")
      setShowModal(true)
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const API_URL = import.meta.env.VITE_APP_API_URL

      const response = await axios.post(
        `${API_URL}/users/reject-user/${document}`,
        {
          mensaje_rechazo: rejectReason,
        },
        {
          headers: { Authorization: `Token ${token}` },
        },
      )

      if (response.status === 200 || response.status === 201) {
        setModalTitle("Operación exitosa")
        setModalMessage(
          "El pre-registro ha sido rechazado correctamente. Se ha enviado una notificación al usuario con la justificación proporcionada.",
        )
        setRegistro((prev) => ({
          ...prev,
          is_registered: false,
          is_active: false,
          rejection_reason: rejectReason,
        }))
        setRejectReasonVisible(false)
      } else {
        setModalTitle("Error en la operación")
        setModalMessage("Hubo un problema al rechazar el pre-registro. Por favor, intente nuevamente.")
      }
    } catch (error) {
      console.error("Error al rechazar usuario:", error.response || error)

      let errorMessage =
        "Ocurrió un error al procesar la solicitud de rechazo. Verifique su conexión e intente nuevamente."

      if (error.response) {
        if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      }

      setModalTitle("Error en el servidor")
      setModalMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
      setShowModal(true)
    }
  }

  const handleAccept = async () => {
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const API_URL = import.meta.env.VITE_APP_API_URL

      const response = await axios.patch(
        `${API_URL}/users/admin/register/${document}`,
        {
          is_active: true,
          is_registered: true,
        },
        {
          headers: { Authorization: `Token ${token}` },
        },
      )

      if (response.status === 200) {
        setRegistro((prev) => ({
          ...prev,
          is_registered: true,
          is_active: true,
        }))
        setButtonsVisible(false)
        setModalTitle("Operación exitosa")
        setModalMessage(
          "El pre-registro ha sido aprobado exitosamente. Se ha enviado una notificación al usuario con sus credenciales de acceso.",
        )
      } else {
        setModalTitle("Error en la operación")
        setModalMessage("Hubo un problema al aprobar el pre-registro. Por favor, intente nuevamente.")
      }
    } catch (error) {
      console.error("Error al aprobar usuario:", error.response || error)

      let errorMessage =
        "Ocurrió un error al procesar la solicitud de aprobación. Verifique su conexión e intente nuevamente."

      if (error.response) {
        if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      }

      setModalTitle("Error en el servidor")
      setModalMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
      setShowModal(true)
    }
  }

  const handleCancelReject = () => {
    setRejectReasonVisible(false)
    setButtonsVisible(true)
    setRejectReason("")
  }

  return (
    <div>
      <NavBar />
      <div className="max-w-3xl mx-auto p-8 mt-32 mb-20 bg-white rounded-xl shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#365486] mb-2">Aprobación de Pre Registro</h1>
          <p className="text-sm text-gray-600">Información enviada por el usuario para su verificación</p>
          <div className="w-16 h-1 bg-[#365486] mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-black">Nombre: </span>
                <span className="text-gray-600 font-medium">{registro.first_name}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-black">Apellido: </span>
                <span className="text-gray-600 font-medium">{registro.last_name}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-black">Tipo de persona: </span>
                <span className="text-gray-600 font-medium">
                  {personTypeNames[registro.person_type] || "No disponible"}
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-black">ID: </span>
                <span className="text-gray-600 font-medium">{registro.document}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-black">Correo: </span>
                <span className="text-gray-600 font-medium">{registro.email}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-black">Teléfono: </span>
                <span className="text-gray-600 font-medium">{registro.phone}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-black">Contraseña: </span>
                <span className="text-gray-600 font-medium">{registro.password || "No disponible"}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-black">Confirmación de contraseña: </span>
                <span className="text-gray-600">{registro.password || "No disponible"}</span>
              </p>
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <p className="text-sm">
                <span className="font-medium text-black">Fecha: </span>
                <span className="text-gray-600">
                  {registro.date_joined
                    ? new Date(registro.date_joined).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "Fecha no disponible"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-md font-medium text-[#365486] mb-3">Documentos adjuntos</h3>
          {registro.drive_folder_id ? (
            <a
              href={`https://drive.google.com/drive/u/1/folders/${registro.drive_folder_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Ver documentos en Google Drive
            </a>
          ) : (
            <p className="text-sm text-gray-500 italic">No hay documentos disponibles para este usuario.</p>
          )}
        </div>

        {rejectReasonVisible && (
          <div className="bg-red-50 rounded-lg p-6 mb-8 border border-red-100">
            <h3 className="text-md font-medium text-red-700 mb-3">Justificación del rechazo</h3>
            <div className="flex flex-col gap-4">
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={handleRejectReasonChange}
                className="w-full p-3 border border-gray-300 rounded-md resize-none h-28 focus:ring-2 focus:ring-[#365486] focus:border-transparent transition-all"
                placeholder="Escribe aquí el motivo del rechazo (mínimo 5 caracteres)..."
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs ${rejectReason.length >= 195 ? "text-red-500 font-medium" : "text-gray-500"}`}
                >
                  {rejectReason.length}/200 caracteres
                </span>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCancelReject}
                    text="Cancelar"
                    color="bg-white"
                    hoverColor="hover:bg-gray-100"
                    textColor="text-gray-700"
                    size="px-5 py-2"
                  />
                  <Button
                    onClick={handleSubmitRejection}
                    text={isSubmitting ? "Enviando..." : "Enviar rechazo"}
                    color="bg-red-600"
                    hoverColor="hover:bg-red-700"
                    disabled={!isSubmitEnabled || isSubmitting}
                    size="px-5 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {buttonsVisible && !registro?.is_registered && (
          <div className="flex justify-center gap-5 my-8">
            <Button
              onClick={handleReject}
              text="Rechazar solicitud"
              color="bg-red-600"
              hoverColor="hover:bg-red-700"
              disabled={isSubmitting}
              size="px-6 py-2.5"
            />
            <Button
              onClick={handleAccept}
              text={isSubmitting ? "Procesando..." : "Aprobar solicitud"}
              disabled={isSubmitting}
              size="px-6 py-2.5"
            />
          </div>
        )}

        {registro?.is_registered && (
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 my-6 text-center">
            <p className="text-green-700 font-medium">Este pre-registro ya ha sido aprobado previamente.</p>
          </div>
        )}

        <div className="flex justify-start mt-8">
          <BackButton to="/gestionDatos/pre-registros" text="Regresar a la lista" className="hover:bg-blue-50" />
        </div>
      </div>

      {showModal && (
        <Modal
          showModal={showModal}
          onClose={() => {
            setShowModal(false)
            if (modalMessage.includes("rechazado")) {
              window.location.href = "/gestionDatos/pre-registros"
            }
          }}          
          title={modalTitle}
          btnMessage="Cerrar"
        >
          <p>{modalMessage}</p>
        </Modal>
      )}
      <Footer />
    </div>
  )
}

export default PreRegistroDetail