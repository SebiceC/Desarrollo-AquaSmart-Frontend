import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar';
import InputItem from '../../components/InputItem';
import { PiAsteriskSimpleBold } from 'react-icons/pi';
import BackButton from '../../components/BackButton';
import Modal from '../../components/Modal';
import axios from 'axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import Footer from '../../components/Footer';

const GestionFacturas = () => {
  const [formData, setFormData] = useState({
    tarifaPiscicultura: "",
    volumetricaPiscicultura: "",
    tarifaAgricolaComun: "",
    volumetricaAgricolaComun: "",
    iva: "",
    ica: "",
    nombreEmpresa: "",
    nit: "",
    address: "",
    phone: "",
    email: ""
  });
  // Añadir estado para almacenar los datos originales
  const [originalData, setOriginalData] = useState(null);
  const [errors, setErrors] = useState({});
  const [emptyFields, setEmptyFields] = useState([]);
  const [generalError, setGeneralError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const soloEnteros = (valor) => /^[0-9]*$/.test(valor);
  const conDecimales = (valor) => /^\d*\.?\d{0,2}$/.test(valor);
  const soloLetras = (valor) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(valor);
  const API_URL = import.meta.env.VITE_APP_API_URL

  const handleChange = (e) => {
    const { name, value } = e.target;
    let isValid = true;
    let errorMessage = "";

    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    if (value) {
      setEmptyFields(prev => prev.filter(field => field !== name));
    } else {
      setEmptyFields(prev => prev.includes(name) ? prev : [...prev, name]);
    }

    if (name === "nit") {
      if (value && !/^\d+$/.test(value)) {
        isValid = false;
        errorMessage = "El NIT solo puede contener números.";
      }
      // Verificar que el NIT tenga exactamente 9 caracteres solo si ya tiene 9 caracteres
      else if (value.length === 9 && !/^\d+$/.test(value)) {
        isValid = false;
        errorMessage = "El NIT solo puede contener números.";
      }
    } else if (name === "phone") {
      // Validación para teléfono: solo números sin restricción de longitud durante la edición
      if (value && !/^\d*$/.test(value)) {
        isValid = false;
        errorMessage = "El teléfono solo puede contener números.";
      }
      // Solo mostrar advertencia de longitud si ya tiene más de 0 caracteres pero no 10
      else if (value.length > 0 && value.length !== 10) {
        // Permitir la edición pero mostrar mensaje informativo
        errorMessage = "El teléfono debe tener exactamente 10 caracteres.";
        // No invalidamos el campo para permitir la edición
        isValid = true;
      }
    } else if (name === "email") {
      // Validación para email utilizando una expresión regular común
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        isValid = false;
        errorMessage = "Por favor, ingrese un correo electrónico válido.";
      }
    } else if (name === "address") {
      // Validación básica para dirección: no puede estar vacía y debe tener un formato válido
      if (value && value.length < 5) {
        isValid = false;
        errorMessage = "La dirección debe tener al menos 5 caracteres.";
      }
    }

    if (["tarifaPiscicultura", "volumetricaPiscicultura", "tarifaAgricolaComun", "volumetricaAgricolaComun"].includes(name)) {
      if (!soloEnteros(value)) {
        isValid = false;
        errorMessage = "Error, solo se permiten números enteros";
      }
    } else if (["iva", "ica"].includes(name)) {
      if (!conDecimales(value)) {
        isValid = false;
        errorMessage = "Error, solo se permiten 2 decimales";
      }
    } else if (["nombreEmpresa"].includes(name)) {
      if (!soloLetras(value)) {
        isValid = false;
        errorMessage = "Error, solo se permiten letras";
      }
    }

    // Actualizar el estado de errores - para teléfono, mostrar mensaje pero no impedir edición
    if (!isValid) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: errorMessage
      }));
    } else if (name === "phone" && errorMessage) {
      // Para teléfono con longitud incorrecta, mostrar mensaje pero permitir edición
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: errorMessage
      }));
    } else {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isFormValid = true;
    const newEmptyFields = [];

    // Verificar campos vacíos
    for (const field in formData) {
      if (!formData[field]) {
        isFormValid = false;
        newEmptyFields.push(field);
      }
    }

    // Verificación específica para NIT
    if (formData.nit.length < 1) {
      isFormValid = false;
      newErrors.nit = "El NIT debe tener más de 1 caracter.";
    } else if (!/^\d+$/.test(formData.nit)) {
      isFormValid = false;
      newErrors.nit = "El NIT solo puede contener números.";
    }

    // Verificación específica para teléfono
    if (formData.phone && formData.phone.length !== 10) {
      isFormValid = false;
      newErrors.phone = "El teléfono debe tener exactamente 10 caracteres.";
    } else if (formData.phone && !/^\d+$/.test(formData.phone)) {
      isFormValid = false;
      newErrors.phone = "El teléfono solo puede contener números.";
    }

    // Verificación específica para email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      isFormValid = false;
      newErrors.email = "Por favor, ingrese un correo electrónico válido.";
    }

    // Verificación para dirección
    if (formData.address && formData.address.length < 5) {
      isFormValid = false;
      newErrors.address = "La dirección debe tener al menos 5 caracteres.";
    }

    setEmptyFields(newEmptyFields);

    // Si hay campos vacíos, mostramos el error general
    if (!isFormValid && newEmptyFields.length > 0) {
      setGeneralError("Todos los campos son obligatorios.");
    } else {
      setGeneralError(""); // Solo si el formulario está completamente válido
    }

    setErrors(newErrors);

    return isFormValid && Object.keys(newErrors).length === 0;
  };

  // Función para verificar si hay cambios en el formulario
  const checkForChanges = () => {
    if (!originalData) return true; // Si no hay datos originales, consideramos que hay cambios

    // Comparar cada campo del formulario con los datos originales
    return Object.keys(formData).some(key => formData[key] !== originalData[key]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasChanges = checkForChanges();
    if (!hasChanges) {
      setErrorMessage("No se han realizado cambios. No es necesario actualizar.");
      setShowErrorModal(true);
      return;
    }

    setShowConfirmationModal(true); // Mostrar el modal de confirmación
  };
  // Manejar el envío del formulario
  const handleConfirm = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage("No se encontró un token de autenticación.");
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    const requestData = {
      company: {
        name: formData.nombreEmpresa,
        nit: formData.nit,
        address: formData.address,
        phone: formData.phone,
        email: formData.email

      },
      tax_rates: [
        { tax_type: "IVA", tax_value: formData.iva },
        { tax_type: "ICA", tax_value: formData.ica }
      ],
      consumption_rates: [
        {
          crop_type: 1,
          fixed_rate: parseFloat(formData.tarifaPiscicultura),
          volumetric_rate: parseFloat(formData.volumetricaPiscicultura)
        },
        {
          crop_type: 2,
          fixed_rate: parseFloat(formData.tarifaAgricolaComun),
          volumetric_rate: parseFloat(formData.volumetricaAgricolaComun)
        }
      ]
    };

    try {
      const response = await axios.patch(`${API_URL}/billing/rates-company`, requestData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        }
      });

      setShowSuccessModal(true);
      setLoading(false);
      setShowConfirmationModal(false); // Cerrar el modal de confirmación
    } catch (error) {
      setErrorMessage("Hubo un error al actualizar los datos.");
      setShowErrorModal(true);
      setLoading(false);
      setShowConfirmationModal(false); // Cerrar el modal de confirmación en caso de error
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("No se encontró un token de autenticación.");
      setShowErrorModal(true);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/billing/rates-company`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          }
        });

        const company = response.data.company || {};
        const taxRates = response.data.tax_rates || [];
        const consumptionRates = response.data.fixed_consumption_rates || [];
        const volumetricRates = response.data.volumetric_consumption_rates || [];

        const iva = taxRates.find(rate => rate.tax_type === "IVA")?.tax_value || "";
        const ica = taxRates.find(rate => rate.tax_type === "ICA")?.tax_value || "";

        const pisciculturaConsumption = consumptionRates.find(rate => rate.crop_type === 1) || {};
        const pisciculturaVolumetric = volumetricRates.find(rate => rate.crop_type === 1) || {};
        const agricolaConsumption = consumptionRates.find(rate => rate.crop_type === 2) || {};
        const agricolaVolumetric = volumetricRates.find(rate => rate.crop_type === 2) || {};

        const newFormData = {
          tarifaPiscicultura: pisciculturaConsumption.fixed_rate?.toString() || "",
          volumetricaPiscicultura: pisciculturaVolumetric.volumetric_rate?.toString() || "",
          tarifaAgricolaComun: agricolaConsumption.fixed_rate?.toString() || "",
          volumetricaAgricolaComun: agricolaVolumetric.volumetric_rate?.toString() || "",
          iva: iva.toString(),
          ica: ica.toString(),
          nombreEmpresa: company.name || "",
          nit: company.nit || "",
          address: company.address || "",
          phone: company.phone || "",
          email: company.email || ""
        };

        setFormData(newFormData);
        // Guardar los datos originales para comparar después
        setOriginalData(newFormData);

      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("Fallo en la conexión, intente de nuevo más tarde o contacte a soporte técnico.");
        setShowErrorModal(true);
      }
    };

    fetchData();
  }, []);

  const isFieldEmpty = (fieldName) => {
    return emptyFields.includes(fieldName);
  };

  return (
    <div className='w-full min-h-screen bg-white'>
      <NavBar />
      <div className='w-full min-h-screen flex flex-col items-center pt-30 mb-20 bg-white p-6'>
        <h1 className='text-center text-[#365486] text-2xl font-bold mb-4'>Gestión de Facturas</h1>

        <form onSubmit={handleSubmit} className='w-[80%] lg:w-[60%]'>
          <h1 className='mt-5 font-semibold'>ACTUALIZACIÓN TARIFAS DE CONSUMO</h1>
          <div className="flex flex-col lg:flex-row gap-5 mt-5">
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Tarifa fija piscicultura <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="tarifaPiscicultura"
                placeholder="Tarifa fija piscicultura"
                value={formData.tarifaPiscicultura}
                onChange={handleChange}
                style={isFieldEmpty("tarifaPiscicultura") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("tarifaPiscicultura") ? "border-red-300" : ""}
                maxLength={10}
              />
              {errors.tarifaPiscicultura && <p className="text-red-500 text-sm mt-1">{errors.tarifaPiscicultura}</p>}
            </div>
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Tarifa volumétrica piscicultura <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="volumetricaPiscicultura"
                placeholder="Tarifa volumétrica piscicultura"
                value={formData.volumetricaPiscicultura}
                onChange={handleChange}
                style={isFieldEmpty("volumetricaPiscicultura") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("volumetricaPiscicultura") ? "border-red-300" : ""}
                maxLength={10}
              />
              {errors.volumetricaPiscicultura && <p className="text-red-500 text-sm mt-1">{errors.volumetricaPiscicultura}</p>}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-5 mt-5">
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Tarifa fija agrícola común <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="tarifaAgricolaComun"
                placeholder="Tarifa fija agrícola común"
                value={formData.tarifaAgricolaComun}
                onChange={handleChange}
                style={isFieldEmpty("tarifaAgricolaComun") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("tarifaAgricolaComun") ? "border-red-300" : ""}
                maxLength={10}
              />
              {errors.tarifaAgricolaComun && <p className="text-red-500 text-sm mt-1">{errors.tarifaAgricolaComun}</p>}
            </div>
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Tarifa volumétrica agrícola común <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="volumetricaAgricolaComun"
                placeholder="Tarifa volumétrica agrícola común"
                value={formData.volumetricaAgricolaComun}
                onChange={handleChange}
                style={isFieldEmpty("volumetricaAgricolaComun") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("volumetricaAgricolaComun") ? "border-red-300" : ""}
                maxLength={10}
              />
              {errors.volumetricaAgricolaComun && <p className="text-red-500 text-sm mt-1">{errors.volumetricaAgricolaComun}</p>}
            </div>
          </div>
          <h1 className='mt-8 font-semibold'>ACTUALIZACIÓN TARIFAS DE IMPUESTOS</h1>
          <div className="flex flex-col lg:flex-row gap-5 mt-5">
            <div className="w-full">
              <InputItem
                label={
                  <>
                    IVA (%), los decimales con (.) <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="iva"
                placeholder="IVA"
                value={formData.iva}
                onChange={handleChange}
                style={isFieldEmpty("iva") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("iva") ? "border-red-300" : ""}
                maxLength={5}

              />
              {errors.iva && <p className="text-red-500 text-sm mt-1">{errors.iva}</p>}
            </div>
            <div className="w-full">
              <InputItem
                label={
                  <>
                    ICA (%), los decimales con (.) <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="ica"
                placeholder="ICA"
                value={formData.ica}
                onChange={handleChange}
                style={isFieldEmpty("ica") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("ica") ? "border-red-300" : ""}
                maxLength={5}
              />
              {errors.ica && <p className="text-red-500 text-sm mt-1">{errors.ica}</p>}
            </div>
          </div>
          <h1 className='mt-8 font-semibold'>ACTUALIZACIÓN DATOS DE LA EMPRESA</h1>
          <div className="flex flex-col lg:flex-row gap-5 mt-5">
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Nombre o razón social <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="nombreEmpresa"
                placeholder="Nombre o razón social"
                value={formData.nombreEmpresa}
                onChange={handleChange}
                style={isFieldEmpty("nombreEmpresa") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("nombreEmpresa") ? "border-red-300" : ""}
                maxLength={60}
              />
              {errors.nombreEmpresa && <p className="text-red-500 text-sm mt-1">{errors.nombreEmpresa}</p>}
            </div>
            <div className="w-full">
              <InputItem
                label={
                  <>
                    NIT <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="nit"
                placeholder="NIT"
                value={formData.nit}
                onChange={handleChange}
                style={isFieldEmpty("nit") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("nit") ? "border-red-300" : ""}
                maxLength={11}
              />
              {errors.nit && <p className="text-red-500 text-sm mt-1">{errors.nit}</p>}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-5 mt-5">
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Dirección <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="address"
                placeholder="Dirección"
                value={formData.address}
                onChange={handleChange}
                style={isFieldEmpty("direccion") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("direccion") ? "border-red-300" : ""}
                maxLength={35}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Teléfono <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="phone"
                placeholder="Teléfono"
                value={formData.phone}
                onChange={handleChange}
                style={isFieldEmpty("phone") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("phone") ? "border-red-300" : ""}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>
          <div className="flex gap-5 mt-5 w-full lg:w-[60%] mx-auto">
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Correo electrónico <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="email"
                name="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
                style={isFieldEmpty("email") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("email") ? "border-red-300" : ""}
                maxLength={50}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          {generalError && (
            <div className="mt-4 p-2 text-red-700 text-center">
              {generalError}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-2 justify-between w-[85%] mt-5">
            <BackButton to="/perfil" text="Regresar al perfil" />
            <button
              type="submit"
              className="bg-[#365486] text-white px-5 py-2 rounded-lg hover:bg-[#2f4275]"
              disabled={loading}
            >
              {loading ? "ACTUALIZANDO..." : "ACTUALIZAR"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        showModal={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)} // Cerrar el modal sin hacer nada
        onConfirm={handleConfirm} // Llamar a la función de confirmación
        message="¿Estás seguro de realizar la actualización?"
      />

      {/* Modal de éxito */}
      <Modal
        showModal={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Éxito!"
        btnMessage="Aceptar"
      >
        <p>Los datos han sido actualizados correctamente.</p>
      </Modal>

      {/* Modal de error general */}
      <Modal
        showModal={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        btnMessage="Aceptar"
      >
        <p>{errorMessage}</p>
      </Modal>
      <Footer />
    </div>
  )
}

export default GestionFacturas;