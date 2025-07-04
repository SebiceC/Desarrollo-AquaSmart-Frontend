"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import InputItem from "../../../components/InputItem"
import Modal from "../../../components/Modal"
import NavBar from "../../../components/NavBar"
import BackButton from "../../../components/BackButton"
import { ChevronDown } from "lucide-react"
import { PiAsteriskSimpleBold } from "react-icons/pi"
import Footer from "../../../components/Footer"

const API_URL = import.meta.env.VITE_APP_API_URL

const LoteEdit = () => {
  const { id_lot } = useParams() // Obtener ID del lote a actualizar
  const [formData, setFormData] = useState({
    id_lot: "",
    nombre_cultivo: "",
    tipo_cultivo: "",
    predio_asignado: "",
    tipo_suelo: "",
    variedad_cultivo: "",
    is_activate: true,
  })

  const [soilTypes, setSoilTypes] = useState([])
  const [errors, setErrors] = useState({
    tipo_cultivo: false,
    predio_asignado: false,
    variedad_cultivo: false,
  })
  const [lotsStates] = useState([
    { value: true, label: "Activo" },
    { value: false, label: "Inactivo" },
  ])

  const [errorMessage, setErrorMessage] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const navigate = useNavigate()
  const [initialIsActive, setInitialIsActive] = useState(false)
  const [cropTypes, setCropTypes] = useState([])
  
  // Guardar los valores originales al cargar el lote
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setErrorMessage("No se encontró un token de autenticación.")
      return
    }

    const fetchOptions = async () => {
      try {
        const soilTypesResponse = await axios.get(`${API_URL}/plot-lot/soil-types`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        })
        const cropTypesResponse = await axios.get(`${API_URL}/plot-lot/crop-types`, {
          headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
          },
        });

        setCropTypes(cropTypesResponse.data);
        setSoilTypes(soilTypesResponse.data)
      } catch (error) {
        console.error("Error al obtener las opciones:", error)
      }
    }

    const fetchLot = async () => {
      try {
        const response = await axios.get(`${API_URL}/plot-lot/lots/${id_lot}`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        })
        setFormData({
          id_lot: response.data.id_lot || "",
          nombre_cultivo: response.data.crop_name || "",
          tipo_cultivo: response.data.crop_type || "",
          predio_asignado: response.data.plot || "",
          tipo_suelo: response.data.soil_type || "",
          variedad_cultivo: response.data.crop_variety || "",
          is_activate: response.data.is_activate === true || response.data.is_activate === "true",
        })
        setOriginalData({
          nombre_cultivo: response.data.crop_name || "",
          tipo_cultivo: response.data.crop_type || "",
          predio_asignado: response.data.plot || "",
          tipo_suelo: response.data.soil_type || "",
          variedad_cultivo: response.data.crop_variety || "",
          is_activate: response.data.is_activate === true || response.data.is_activate === "true",
        })
        setInitialIsActive(response.data.is_activate === true || response.data.is_activate === "true")        
      } catch (error) {
        setErrorMessage("No se pudo cargar la información del lote.")
        setShowSuccessModal(true)
      }
    }

    fetchOptions()
    fetchLot() // Obtener datos del lote a actualizar si el token está presente.
  }, [id_lot])

  const validateField = (name, value) => {
    if (name === "tipo_cultivo" || name === "variedad_cultivo" || name === "nombre_cultivo") {
      const regex = /^[A-Za-zÁÉÍÓÚáéíóú0-9\s]*$/ // Se agregan vocales con tilde
      return regex.test(value)
    } else if (name === "predio_asignado") {
      const regex = /^[A-Za-zÁÉÍÓÚáéíóú0-9]*-?[A-Za-zÁÉÍÓÚáéíóú0-9]*$/ // Se agregan vocales con tilde
      return regex.test(value)
    }
    return true
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({ ...prevData, [name]: value }))

    if (name === "tipo_cultivo" || name === "variedad_cultivo" || name === "predio_asignado") {
      const isValid = validateField(name, value)
      setErrors((prev) => ({ ...prev, [name]: !isValid }))

      if (!isValid) {
        setErrorMessage("ERROR, tipo de datos erróneo (solo números y letras)")
      } else {
        setErrorMessage("")
      }
    }
  }

  const validateForm = () => {
    const { nombre_cultivo, tipo_cultivo, predio_asignado, tipo_suelo, variedad_cultivo } = formData

    const newErrors = {} // Este objeto almacenará los errores para cada campo

    // Verificar campos obligatorios
    
    if (!nombre_cultivo.trim()) {
      newErrors.nombre_cultivo = " "
    }
    if (String(tipo_cultivo).trim().length === 0) {
      newErrors.tipo_cultivo = " "
    }
    if (!predio_asignado.trim()) {
      newErrors.predio_asignado = " "
    }
    if (!String(tipo_suelo).trim()) {
      newErrors.tipo_suelo = " "
    }

    // Validar tipo de cultivo
    if (!validateField("tipo_cultivo", tipo_cultivo)) {
      newErrors.tipo_cultivo = "ERROR, tipo de datos erróneo (solo números y letras)"
    }

    // Validar predio asignado
    if (!validateField("predio_asignado", predio_asignado)) {
      newErrors.predio_asignado = "ERROR, tipo de datos erróneo (solo números y letras)"
    }

    // Verificar variedad cultivo
    if (variedad_cultivo.trim() && !validateField("variedad_cultivo", variedad_cultivo)) {
      newErrors.variedad_cultivo = "ERROR, tipo de datos erróneo (solo números y letras)"
    }

    setErrors(newErrors) // Actualiza los errores en el estado

    // Si hay algún error, no permitas enviar el formulario
    if (Object.keys(newErrors).length > 0) {
      return false
    }

    return true // Si no hay errores, el formulario es válido
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitted(true)

    // Validar el formulario antes de enviar
    if (!validateForm()) return

    const token = localStorage.getItem("token")
    if (!token) {
      setErrorMessage("No se encontró un token de autenticación.")
      return
    }

    // Solo enviar los campos que han cambiado respecto a los valores originales
    let changedFields = {};
    if (originalData) {
      if (formData.nombre_cultivo !== originalData.nombre_cultivo) changedFields.crop_name = formData.nombre_cultivo;
      if (formData.tipo_cultivo !== originalData.tipo_cultivo) changedFields.crop_type = formData.tipo_cultivo;
      if (formData.predio_asignado !== originalData.predio_asignado) changedFields.plot = formData.predio_asignado;
      if (formData.tipo_suelo !== originalData.tipo_suelo) changedFields.soil_type = formData.tipo_suelo;
      if (formData.variedad_cultivo !== originalData.variedad_cultivo) changedFields.crop_variety = formData.variedad_cultivo;
      if (formData.is_activate !== originalData.is_activate) changedFields.is_activate = formData.is_activate;
    }
    if (Object.keys(changedFields).length === 0) {
      setErrorMessage("No se han realizado cambios para actualizar.");
      return;
    }
    try {
      const response = await axios.patch(`${API_URL}/plot-lot/lots/${id_lot}/update`, changedFields, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 200) {
        setShowSuccessModal(true) // Mostrar modal de éxito
      }
    } catch (error) {
      if (error.response) {
        const newErrors = {}
        if (error.response.data.plot) {
          newErrors.predio_asignado = " "
          setErrorMessage(error.response.data.plot[0])
        }
        if (error.response.data.error) {
          setErrorMessage(error.response.data.error)
        }
        if (error.response.data.non_field_errors) {
          setErrorMessage(error.response.data.non_field_errors[0])
        }
        setErrors(newErrors)
      } else {
        setErrorMessage("Error de conexión con el servidor.")
      }
    }
  }

  return (
    <div>
      <NavBar />
      <div className="w-full min-h-screen flex flex-col items-center pt-34 bg-white p-6">
        <div className="w-full max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-[#365486] mb-2">Actualización de Lote</h2>
        </div>
        <div className="bg-white p-6 w-full max-w-3xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <InputItem
            label={
                <>
                    Nombre del cultivo <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                </>
            }
            type="text"
            name="nombre_cultivo"
            placeholder="Ej: Cacao"
            value={formData.nombre_cultivo}
            onChange={handleChange}
            maxLength={20}
            error={errors.nombre_cultivo}
            className={`${errors.nombre_cultivo ? "border-red-500" : "border-gray-300"}`} // Condición de borde rojo
           />
           {/* {errors.nombre_cultivo && <p className="text-[#F90000] text-sm mt-1">{errors.nombre_cultivo}</p>} */}

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID lote
                <span className="ml-1 text-xs text-gray-500">(No editable)</span>
              </label>
              <input
                type="text"
                name="id_lot"
                value={formData.id_lot || ""}
                className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-gray-500 cursor-not-allowed"
                disabled
                readOnly
                aria-label="ID lote (no editable)"
              />
              {errors.id_lot && <p className="text-[#F90000] text-sm mt-1">{errors.id_lot}</p>}
            </div>
            <div className="relative mt-2 flex flex-col">
              <label htmlFor="tipo_cultivo" className="text-sm font-medium text-gray-700">
                  Tipo de Cultivo <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
              </label>
              <select
                  id="tipo_cultivo"
                  name="tipo_cultivo"
                  value={formData.tipo_cultivo}
                  onChange={handleChange}
                  className="w-[85%] border border-gray-300 rounded px-3 py-2 pr-8 appearance-none"
              >
                  <option value="">SELECCIÓN DE TIPO DE CULTIVO</option>
                  {cropTypes.map((type, index) => (
                      <option key={index} value={type.id}>
                          {type.name}
                      </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-14 lg:right-16 top-1/2 transform lg:-translate-y-0 text-gray-500 w-4 h-4 pointer-events-none" />
          </div>
            <InputItem
              label="Predio a asignar"
              type="text"
              name="predio_asignado"
              placeholder="ID (letras, números y un guión)"
              value={formData.predio_asignado}
              onChange={handleChange}
              error={errors.predio_asignado} // Mostrar el error aquí
              maxLength={20}
              className={`${errors.predio_asignado ? "border-red-500" : "border-gray-300"}`} // Condición de borde rojo
            />

            <div className="relative mt-2 flex flex-col">
              <label htmlFor="tipo_suelo" className="text-sm font-medium text-gray-1000">
                Tipo de Suelo <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
              </label>
              <select
                id="tipo_suelo"
                name="tipo_suelo"
                value={formData.tipo_suelo}
                onChange={handleChange}
                className="w-[85%] border border-gray-300 rounded px-3 py-2 pr-8 appearance-none"
              >
                <option value="">SELECCIÓN DE TIPO DE SUELO</option>
                {soilTypes.map((type, index) => (
                  <option key={index} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-14 lg:right-15 top-1/2 transform lg:-translate-y-0 text-gray-500 w-4 h-4 pointer-events-none" />
            </div>

            <InputItem
              label="Variedad de cultivo"
              type="text"
              name="variedad_cultivo"
              placeholder="Ej: Floral"
              value={formData.variedad_cultivo}
              onChange={handleChange}
              error={errors.variedad_cultivo}
              maxLength={20}
            />

            <div className="relative">
              <label className="block text-sm font-medium text-gray-1000 mb-1">Estado del lote</label>
              <div className="relative">
                <select
                  className={`w-[85%] border border-gray-300 rounded px-3 py-2 appearance-none ${errors.is_activate ? "bg-red-100" : formData.is_activate ? "bg-gray-200 cursor-not-allowed" : "bg-white"}`}
                  name="is_activate"
                  value={formData.is_activate === undefined ? "" : formData.is_activate.toString()}
                  onChange={(e) => {
                    const value = e.target.value === "true"
                    setFormData((prev) => ({
                      ...prev,
                      is_activate: value,
                    }))
                    setErrors((prev) => ({ ...prev, is_activate: "" }))
                  }}
                  disabled={initialIsActive}
                >
                  <option value="">SELECCIÓN DE ESTADO</option>
                  {lotsStates.map((state, index) => (
                    <option key={index} value={state.value.toString()}>
                      {state.label}
                    </option>
                  ))}
                </select>

                <ChevronDown className="absolute right-14 lg:right-15 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {errors.is_activate && <p className="text-red-500 text-sm mt-1">{errors.is_activate}</p>}
            </div>

            {/* Contenedor para mensajes de error y botones */}
            <div className="col-span-1 md:col-span-2 flex flex-col items-start mt-4">
              {/* Mensajes de error */}
              {errorMessage && <p className="text-[#F90000] text-sm mb-4 w-full">{errorMessage}</p>}

              {/* Botones de acción */}
              <div className="flex flex-col lg:flex-row justify-between w-[85%] gap-2 lg:w-[92%]">
                <BackButton to="/gestionDatos/lotes" text="Regresar al listado de lotes" />
                <button type="submit" className="bg-[#365486] text-white px-5 py-2 rounded-lg hover:bg-[#2f4275]">
                  Actualizar
                </button>
              </div>
            </div>
          </form>
        </div>

        <Modal
          showModal={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false)
            navigate("/gestionDatos/lotes")
          }}
          title="Actualización Exitosa"
          btnMessage="Aceptar"
        >
          <p>El lote ha sido actualizado con éxito.</p>
        </Modal>
      </div>
      <Footer />
    </div>
  )
}
export default LoteEdit

