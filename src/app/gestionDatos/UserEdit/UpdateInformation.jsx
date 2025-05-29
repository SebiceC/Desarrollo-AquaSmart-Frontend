import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import InputItem from "../../../components/InputItem"
import { validateField } from "../../../components/ValidationRules"
import Modal from "../../../components/Modal"
import NavBar from "../../../components/NavBar"
import BackButton from "../../../components/BackButton"
import { ChevronDown, Upload } from "lucide-react"
import Footer from "../../../components/Footer"

const UpdateInformation = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL
  const navigate = useNavigate()
  const { document: userId } = useParams()

  // Estados para el formulario
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    document: "",
    email: "",
    phone: "",
    person_type_name: "",
    is_active: true,
    attachments: [],
  })
  const [originalData, setOriginalData] = useState({})
  const [personTypes, setPersonTypes] = useState([])
  const [userStates] = useState([
    { value: true, label: "Activo" },
    { value: false, label: "Inactivo" },
  ])

  // Estados para errores y carga
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Estados para modales
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showErrorModal2, setShowErrorModal2] = useState(false)
  const [showNoChangesModal, setShowNoChangesModal] = useState(false)

  // Cargar tipos de persona
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const personTypesResponse = await axios.get(`${API_URL}/users/list-person-type`)
        console.log("Tipos de persona disponibles:", personTypesResponse.data)
        setPersonTypes(personTypesResponse.data)
      } catch (error) {
        console.error("Error al obtener las opciones:", error)
      }
    }

    fetchOptions()
  }, [API_URL])

  // Cargar datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          setErrorMessage("No hay sesión activa.")
          setLoading(false)
          return
        }

        // Obtener datos del usuario
        const usersResponse = await axios.get(`${API_URL}/users/admin/listed`, {
          headers: { Authorization: `Token ${token}` },
        })

        const userData = usersResponse.data.find((user) => user.document === userId)
        console.log("Datos del usuario:", userData)

        if (!userData) {
          throw new Error("Usuario no encontrado")
        }

        // Obtener permisos del usuario
        let role = "Sin rol asignado"
        try {
          const permissionsResponse = await axios.get(`${API_URL}/users/${userData.id || userId}/permissions`, {
            headers: { Authorization: `Token ${token}` },
          })

          if (permissionsResponse.data && permissionsResponse.data.role) {
            role = permissionsResponse.data.role
          }
        } catch (permissionsError) {
          console.warn("No se pudieron obtener los permisos del usuario:", permissionsError)
        }

        // Asegurar que is_active sea booleano
        const userWithCorrectTypes = {
          ...userData,
          role,
          is_active: userData.is_active === true || userData.is_active === "true" ? true : false,
        }

        setUser(userWithCorrectTypes)

        // Recuperar el tipo de persona
        let personTypeName = ""
        if (userData.person_type) {
          if (typeof userData.person_type === "number") {
            const personType = personTypes.find((type) => type.personTypeId === userData.person_type)
            personTypeName = personType ? personType.typeName : ""
          } else if (userData.person_type.typeName) {
            personTypeName = userData.person_type.typeName
          }
        }

        const formattedData = {
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          document: userData.document || "",
          role: role,
          email: userData.email || "",
          phone: userData.phone || "",
          person_type_name: personTypeName,
          is_active: userData.is_active === true || userData.is_active === "true",
          attachments: userData.attachments || [],
        }

        setFormData(formattedData)
        setOriginalData(formattedData)
        setLoading(false)
      } catch (err) {
        console.error("Error al cargar los datos:", err)
        setLoading(false)
        setShowErrorModal2(true)
      }
    }

    if (API_URL && userId && personTypes.length > 0) {
      fetchUserData()
    }
  }, [API_URL, userId, personTypes])

  // Función para obtener los campos que han sido modificados
  const getChangedFields = (formData, originalData) => {
    const changedFields = {}

    // Excluir campo document ya que no debe modificarse
    const fieldsToCheck = Object.keys(formData).filter((key) => key !== "document" && key !== "role")

    fieldsToCheck.forEach((key) => {
      // Manejo especial para attachments
      if (key === "attachments") {
        // Solo incluir attachments si hay nuevos archivos
        const hasNewFiles = formData[key].some((file) => file instanceof File)
        if (hasNewFiles) {
          changedFields[key] = formData[key]
        }
      }
      // Manejo especial para person_type_name
      else if (key === "person_type_name") {
        // Comparar directamente con el valor original
        if (formData[key] !== originalData[key]) {
          changedFields[key] = formData[key]
        }
      }
      // Manejo especial para is_active (comparar como booleanos)
      else if (key === "is_active") {
        // Asegurar que ambos valores sean booleanos para comparación
        const originalValue = originalData[key] === true || originalData[key] === "true"
        const currentValue = formData[key] === true || formData[key] === "true"

        if (originalValue !== currentValue) {
          changedFields[key] = currentValue
        }
      }
      // Para todos los demás campos, verificar si los valores han cambiado
      else if (formData[key] !== originalData[key]) {
        changedFields[key] = formData[key]
      }
    })

    console.log("Campos modificados:", changedFields)
    return changedFields
  }

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {}
    const changedFields = getChangedFields(formData, originalData)
    let isValid = true

    // Solo validar campos que han cambiado
    Object.keys(changedFields).forEach((key) => {
      // Omitir validación de document ya que no debe modificarse
      if (key !== "document") {
        const fieldErrors = validateField(key, formData[key], formData)
        if (fieldErrors[key]) {
          newErrors[key] = fieldErrors[key]
          isValid = false
        }
      }
    })

    // Validación especial para attachments
    if (changedFields.attachments) {
      const fieldErrors = validateField("attachments", formData.attachments, formData)
      if (fieldErrors.attachments) {
        newErrors.attachments = fieldErrors.attachments
        isValid = false
      }
    }

    // Validación específica para el campo is_active
    if (changedFields.is_active !== undefined && formData.is_active === undefined) {
      newErrors.is_active = "El estado del usuario es requerido"
      isValid = false
    }

    setErrors(newErrors)

    if (!isValid) {
      setErrorMessage("Por favor, complete todos los campos obligatorios correctamente.")
    }

    return isValid
  }

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target

    // No permitir cambios en el campo documento
    if (name === "document") return

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpiar mensaje de error general
    setErrorMessage("")

    // Validar el campo en tiempo real usando ValidationRules
    const fieldErrors = validateField(name, value, formData)
    setErrors((prev) => ({
      ...prev,
      [name]: fieldErrors[name] || "",
    }))
  }

  // Manejar cambios en los archivos
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    const currentFiles = formData.attachments || []
    const allFiles = [...currentFiles, ...newFiles]

    // Validar archivos usando ValidationRules
    const fieldErrors = validateField("attachments", allFiles, formData)
    if (fieldErrors.attachments) {
      setErrors((prev) => ({
        ...prev,
        attachments: fieldErrors.attachments,
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      attachments: allFiles,
    }))
    setErrors((prev) => ({ ...prev, attachments: "" }))
  }

  // Eliminar un archivo
  const handleRemoveFile = (index) => {
    const updatedFiles = formData.attachments.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, attachments: updatedFiles }))

    if (updatedFiles.length > 0) {
      const fieldErrors = validateField("attachments", updatedFiles, formData)
      setErrors((prev) => ({
        ...prev,
        attachments: fieldErrors.attachments || "",
      }))
    } else {
      setErrors((prev) => ({ ...prev, attachments: "" }))
    }
  }

  // Validación de datos sin cambios
  const validateChanges = () => {
    const changedFields = getChangedFields(formData, originalData)
    console.log("Validando cambios:", formData, originalData)
    console.log("Campos detectados como modificados:", changedFields)

    if (Object.keys(changedFields).length === 0) {
      setShowNoChangesModal(true)
      return false
    }
    return true
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Evitar múltiples envíos
    if (submitting) return

    // Limpiar errores previos
    setErrors({})
    setErrorMessage("")

    // Validaciones
    if (!validateChanges()) {
      return
    }

    if (!validateForm()) {
      return
    }

    // Iniciar proceso de envío
    setSubmitting(true)

    // Obtener solo los campos que han cambiado
    const changedFields = getChangedFields(formData, originalData)

    // Crear FormData con solo los campos modificados
    const formDataToSend = new FormData()

    Object.keys(changedFields).forEach((key) => {
      if (key !== "attachments") {
        // Convertir person_type_name a person_type (ID) para la API
        if (key === "person_type_name") {
          const selectedPersonType = personTypes.find((type) => type.typeName === changedFields[key])
          if (selectedPersonType) {
            formDataToSend.append("person_type", selectedPersonType.personTypeId)
          }
        }
        // Manejo especial para el campo is_active (booleano)
        else if (key === "is_active") {
          const boolValue = changedFields[key] === true || changedFields[key] === "true"
          formDataToSend.append("is_active", boolValue ? "true" : "false")
        } else {
          formDataToSend.append(key, changedFields[key])
        }
      }
    })

    // Añadir archivos adjuntos si existen en changedFields
    if (changedFields.attachments) {
      changedFields.attachments.forEach((file) => {
        // Solo añadir objetos File reales, no cadenas o archivos existentes
        if (file instanceof File) {
          // Cambiar el nombre del campo a "files" o consultar la documentación de la API
          // para saber el nombre correcto del campo para archivos
          formDataToSend.append("files", file)
        }
      })
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMessage("No hay sesión activa. Por favor, inicie sesión nuevamente.")
        setTimeout(() => navigate("/login"), 2000)
        return
      }

      // Enviar la solicitud con solo los campos modificados
      const response = await axios.patch(`${API_URL}/users/admin/update/${userId}`, formDataToSend, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.status === "success") {
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error("Error al actualizar el usuario:", error)

      // Manejar errores específicos del backend
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message)

        // Manejar errores específicos de campos
        if (error.response.data.message.includes("documento")) {
          setErrors((prev) => ({
            ...prev,
            document: "El documento de identidad no puede ser modificado",
          }))
        }
      } else {
        setErrorMessage("Error en envío de formulario. Por favor, intente de nuevo o más tarde.")
      }

      setShowErrorModal(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Renderizar pantalla de carga
  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="max-w-4xl mx-auto p-6 mt-24 bg-white rounded-lg shadow animate-pulse">
          <h1 className="text-xl font-medium text-center mb-2 bg-gray-300 h-6 w-1/3 mx-auto rounded"></h1>
          <p className="text-sm text-gray-400 text-center mb-6 bg-gray-200 h-4 w-1/2 mx-auto rounded"></p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2 mb-4">
                <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
                <div className="bg-gray-200 h-10 w-full rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <NavBar />
      <div className="w-full min-h-screen flex flex-col items-center pt-24 bg-white p-6">
        <div className="w-full max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-[#365486] mb-2">Actualización de Usuario</h2>
        </div>

        <div className="bg-white p-6 w-full max-w-3xl ">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primera fila: Documento de identidad | Tipo de persona */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento de identidad
                <span className="ml-1 text-xs text-gray-500">(No editable)</span>
              </label>
              <input
                type="text"
                name="document"
                value={formData.document || ""}
                className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-gray-500 cursor-not-allowed"
                disabled
                readOnly
              />
              {errors.document && <p className="text-red-500 text-sm mt-1">{errors.document}</p>}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de persona</label>
              <div className="relative">
                <select
                  className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${errors.person_type_name ? "border-red-300" : ""
                    }`}
                  name="person_type_name"
                  value={formData.person_type_name || ""}
                  onChange={handleChange}
                >
                  {personTypes.map((type, index) => (
                    <option key={index} value={type.typeName}>
                      {type.typeName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {errors.person_type_name && <p className="text-red-500 text-sm mt-1">{errors.person_type_name}</p>}
            </div>

            {/* Segunda fila: Nombre | Apellido */}
            <InputItem
              id="first_name"
              name="first_name"
              labelName="Nombre"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Ingrese el nombre"
              error={errors.first_name}
              maxLength={20}
            />

            <InputItem
              id="last_name"
              name="last_name"
              labelName="Apellidos"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Ingrese los apellidos"
              error={errors.last_name}
              maxLength={20}
            />

            {/* Tercera fila: Correo electrónico | Teléfono */}
            <InputItem
              id="email"
              name="email"
              labelName="Correo electrónico"
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              error={errors.email}
              maxLength={50}
            />

            <InputItem
              id="phone"
              name="phone"
              labelName="Teléfono"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ej: 3201234567"
              error={errors.phone}
              maxLength={10}
            />

            {/* Cuarta fila: Estado del usuario */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado del usuario</label>
              <div className="relative">
                <select
                  className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${errors.is_active ? "border-red-300" : ""
                    } ${formData.is_active === true ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  name="is_active"
                  value={formData.is_active === undefined ? "" : formData.is_active.toString()}
                  onChange={(e) => {
                    const value = e.target.value === "true";
                    setFormData((prev) => ({
                      ...prev,
                      is_active: value,
                    }));
                    setErrors((prev) => ({ ...prev, is_active: "" }));
                  }}
                  disabled={originalData.is_active === true}  // Solo deshabilitado si originalmente venía activo
                >
                  <option value="">SELECCIÓN DE ESTADO</option>
                  {userStates.map((state, index) => (
                    <option key={index} value={state.value.toString()}>
                      {state.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {errors.is_active && <p className="text-red-500 text-sm mt-1">{errors.is_active}</p>}
            </div>

            {/* Sección de archivos adjuntos */}
            {/* Sección de documentos en Google Drive */}
            <div className="col-span-1 md:col-span-2 mt-4">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <h3 className="text-md font-medium text-[#365486] mb-3">Documentos adjuntos</h3>
                {user?.drive_folder_id ? (
                  <a
                    href={`https://drive.google.com/drive/u/1/folders/${user.drive_folder_id}`}
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
                <p className="text-xs text-gray-500 mt-3">
                  Los archivos de este usuario se gestionan directamente en Google Drive. Para actualizar los documentos, acceda a la carpeta del usuario a través del enlace.
                </p>
              </div>
            </div>



            {/* Botones de acción */}
            <div className="col-span-1 md:col-span-2 flex flex-col lg:flex-row gap-2 justify-between w-full mt-6">
              <BackButton to="/gestionDatos/users" text="Regresar al listado de usuarios" />
              <button
                type="submit"
                className={`bg-[#365486] hover:bg-[#2f4275] text-white px-5 py-2 rounded-lg transition-colors ${submitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                disabled={submitting}
              >
                {submitting ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de éxito */}
      <Modal
        showModal={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          window.location.reload();
        }}
        title="Actualización Exitosa"
        btnMessage="Aceptar"
      >
        <p>El usuario ha sido actualizado con éxito.</p>
      </Modal>

      {/* Modal de error */}
      <Modal showModal={showErrorModal} onClose={() => setShowErrorModal(false)} title="Error" btnMessage="Volver">
        <p>{errors.submit || "Ha ocurrido un error al actualizar el usuario"}</p>
      </Modal>

      {/* Modal de error al cargar datos */}
      <Modal
        showModal={showErrorModal2}
        onClose={() => {
          setShowErrorModal2(false)
          navigate("/gestionDatos/users")
        }}
        title="Error"
        btnMessage="Volver"
      >
        <p>Error al cargar los datos del usuario. Por favor, intente nuevamente.</p>
      </Modal>

      {/* Modal de datos sin cambios */}
      <Modal
        showModal={showNoChangesModal}
        onClose={() => setShowNoChangesModal(false)}
        title="Sin Cambios"
        btnMessage="Cerrar"
      >
        <p>No se han detectado cambios en los datos del usuario.</p>
      </Modal>
      <Footer />
    </div>
  )
}

export default UpdateInformation