import React, { useEffect, useState } from 'react'
import NavBar from '../../components/NavBar';
import InputItem from '../../components/InputItem';
import { PiAsteriskSimpleBold } from 'react-icons/pi';
import BackButton from '../../components/BackButton';
import Modal from '../../components/Modal';
import axios from 'axios';

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
    ciudad: ""
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

  const soloEnteros = (valor) => /^[0-9]*$/.test(valor);
  const conDecimales = (valor) => /^\d*\.?\d{0,2}$/.test(valor);
  const soloLetras = (valor) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(valor);
  const API_URL = import.meta.env.VITE_APP_API_URL

  const handleChange = (e) => {
    const { name, value } = e.target;
    let isValid = true;
    let errorMessage = "";

    if (name === "nit") {
      // Verificar que solo se permiten números
      if (value && !/^\d+$/.test(value)) {
        isValid = false;
        errorMessage = "El NIT solo puede contener números.";
      }
      // Verificar que el NIT tenga exactamente 9 caracteres solo si ya tiene 9 caracteres
      else if (value.length > 9) {
        isValid = false;
        errorMessage = "El NIT no puede tener más de 9 caracteres.";
      } 
      else if (value.length === 9 && !/^\d+$/.test(value)) {
        isValid = false;
        errorMessage = "El NIT solo puede contener números.";
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
    } else if (["nombreEmpresa", "ciudad"].includes(name)) {
      if (!soloLetras(value)) {
        isValid = false;
        errorMessage = "Error, solo se permiten letras";
      }
    }
  
    // Actualizar el estado de errores
    if (!isValid) {
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
  
    if (value) {
      setEmptyFields(prev => prev.filter(field => field !== name));
    }
  
    if (isValid) {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
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
    if (formData.nit.length !== 9) {
      isFormValid = false;
      newErrors.nit = "El NIT debe tener exactamente 9 caracteres.";
    } else if (!/^\d+$/.test(formData.nit)) {
      isFormValid = false;
      newErrors.nit = "El NIT solo puede contener números.";
    }
  
    setEmptyFields(newEmptyFields);
  
    // Si hay campos vacíos, mostramos el error general
    if (!isFormValid && newEmptyFields.length > 0) {
      setGeneralError("Todos los campos son obligatorios.");
    } else {
      setGeneralError(""); // Solo si el formulario está completamente válido
    }
  
    setErrors(newErrors);
  
    return isFormValid && Object.keys(errors).length === 0;
  };
  
  
  

  // Función para verificar si hay cambios en el formulario
  const checkForChanges = () => {
    if (!originalData) return true; // Si no hay datos originales, consideramos que hay cambios

    // Comparar cada campo del formulario con los datos originales
    return Object.keys(formData).some(key => formData[key] !== originalData[key]);
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Verificar si hubo cambios en el formulario
    const hasChanges = checkForChanges();
    if (!hasChanges) {
      setErrorMessage("No se han realizado cambios. No es necesario actualizar.");
      setShowErrorModal(true);
      return;
    }

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
        nombre: formData.nombreEmpresa,
        nit: formData.nit,
        ciudad: formData.ciudad
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
    } catch (error) {
      console.error("Error updating data:", error);

      let errorMsg = "";

      if (error.response && error.response.data) {
        if (error.response.data.error) {
          errorMsg = error.response.data.error;
        }
        else if (typeof error.response.data === 'object' && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
        else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        }
        else if (typeof error.response.data === 'object' && error.response.data.error === 'Formulario sin cambios. No se realizó ningún cambio en la información.') {
          errorMsg = "No se realizó ningún cambio en la información.";
        }
        else {
          errorMsg = `Error al actualizar los datos. Código: ${error.response.status}`;
        }
      } else {
        errorMsg = "Error de conexión con el servidor.";
      }

      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      setLoading(false);
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
        const consumptionRates = response.data.consumption_rates || [];

        const iva = taxRates.find(rate => rate.tax_type === "IVA")?.tax_value || "";
        const ica = taxRates.find(rate => rate.tax_type === "ICA")?.tax_value || "";

        const piscicultura = consumptionRates.find(rate => rate.crop_type === 1) || {};
        const agricola = consumptionRates.find(rate => rate.crop_type === 2) || {};

        const newFormData = {
          tarifaPiscicultura: piscicultura.fixed_rate?.toString() || "",
          volumetricaPiscicultura: piscicultura.volumetric_rate?.toString() || "",
          tarifaAgricolaComun: agricola.fixed_rate?.toString() || "",
          volumetricaAgricolaComun: agricola.volumetric_rate?.toString() || "",
          iva: iva.toString(),
          ica: ica.toString(),
          nombreEmpresa: company.nombre || "",
          nit: company.nit || "",
          ciudad: company.ciudad || ""
        };

        setFormData(newFormData);
        // Guardar los datos originales para comparar después
        setOriginalData(newFormData);

      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("Error al cargar los datos de la empresa.");
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
      <div className='w-full min-h-screen flex flex-col items-center pt-30 bg-white p-6'>
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
                    IVA (%) <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="iva"
                placeholder="IVA"
                value={formData.iva}
                onChange={handleChange}
                style={isFieldEmpty("iva") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("iva") ? "border-red-300" : ""}
              />
              {errors.iva && <p className="text-red-500 text-sm mt-1">{errors.iva}</p>}
            </div>
            <div className="w-full">
              <InputItem
                label={
                  <>
                    ICA (%) <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="ica"
                placeholder="ICA"
                value={formData.ica}
                onChange={handleChange}
                style={isFieldEmpty("ica") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("ica") ? "border-red-300" : ""}
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
                maxLength={9}
              />
              {errors.nit && <p className="text-red-500 text-sm mt-1">{errors.nit}</p>}
            </div>
          </div>
          <div className="flex gap-5 mt-5 w-full lg:w-[60%] mx-auto">
            <div className="w-full">
              <InputItem
                label={
                  <>
                    Ciudad <PiAsteriskSimpleBold size={12} className="inline text-red-500" />
                  </>
                }
                type="text"
                name="ciudad"
                placeholder="Ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                style={isFieldEmpty("ciudad") ? { backgroundColor: "#FFEBEE" } : {}}
                className={isFieldEmpty("ciudad") ? "border-red-300" : ""}
              />
              {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>}
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

      <Modal
        showModal={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Éxito!"
        btnMessage="Aceptar"
      >
        <p>Los datos han sido actualizados correctamente.</p>
      </Modal>

      <Modal
        showModal={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        btnMessage="Cerrar"
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  )
}

export default GestionFacturas;