import React, { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar';
import axios from 'axios';
import Modal from '../../components/Modal'; // Asegúrate de que esta ruta sea correcta
import { useNavigate } from 'react-router-dom';

const ControlBocatoma = () => {
  const [estado, setEstado] = useState('inactiva');
  const [formData, setFormData] = useState({
    caudal: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Por favor, complete correctamente todos los campos obligatorios.');
  const [caudalActual, setCaudalActual] = useState('0 L/min');
  const [dispositivo, setDispositivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate()

  // Constantes para los límites de caudal
  const CAUDAL_MINIMO = 0;
  const CAUDAL_MAXIMO = 180;
  const MAX_CARACTERES = 3;

  const API_URL = import.meta.env.VITE_APP_API_URL;
  const token = localStorage.getItem("token");

  // Función asincrónica para obtener los dispositivos
  const obtenerDispositivos = async () => {
    setLoading(true);
    try {
      // Realizar la solicitud GET con Axios
      const dispositivosResponse = await axios.get(`${API_URL}/iot/iot-devices`, {
        headers: { Authorization: `Token ${token}` },
      });

      // Filtrar el dispositivo con device_type = "03"
      const dispositivoIoT = dispositivosResponse.data.find(device => device.device_type === "03");
      
      if (dispositivoIoT) {
        // Actualizar el estado con la información del dispositivo
        setDispositivo(dispositivoIoT);
        setEstado(dispositivoIoT.is_active ? 'activa' : 'inactiva');
        
        // Verificar si actual_flow existe y convertirlo a string con formato
        if (dispositivoIoT.actual_flow !== undefined) {
          setCaudalActual(`${dispositivoIoT.actual_flow} L/s`);
          // Actualizar correctamente el valor del caudal en el formulario
          setFormData({
            caudal: dispositivoIoT.actual_flow.toString()
          });
        }
      } else {
        console.log('No se encontró ningún dispositivo con device_type = "03"');
        setErrorMessage('No se encontró el dispositivo de bocatoma');
        setError(true);
      }
    } catch (error) {
      console.error('Error al obtener los dispositivos:', error);
      setErrorMessage('Error al cargar los datos del dispositivo');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDispositivos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validar que sea un número si el campo es caudal
    if (name === 'caudal') {
      // Validar que solo contenga números y que no exceda el máximo de caracteres
      if (value === '' || (!isNaN(value) && value.length <= MAX_CARACTERES)) {
        setFormData({
          ...formData,
          [name]: value
        });
        
        // Limpiar errores del campo
        if (fieldErrors[name]) {
          const newFieldErrors = { ...fieldErrors };
          delete newFieldErrors[name];
          setFieldErrors(newFieldErrors);
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.caudal) {
      errors.caudal = 'El caudal es obligatorio';
    } else if (isNaN(formData.caudal) || parseFloat(formData.caudal) < CAUDAL_MINIMO) {
      errors.caudal = `El caudal debe ser un número mayor o igual a ${CAUDAL_MINIMO}`;
    } else if (parseFloat(formData.caudal) > CAUDAL_MAXIMO) {
      errors.caudal = `El caudal no puede ser mayor a ${CAUDAL_MAXIMO}`;
    } else if (dispositivo && parseFloat(formData.caudal) === dispositivo.actual_flow) {
      // Verificar si el valor ingresado es igual al caudal actual
      errors.caudal = 'El caudal ingresado debe ser diferente al caudal actual';
    }  
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderFieldError = (message) => (
    <p className="text-red-500 text-xs mt-1">{message}</p>
  );

  const actualizarCaudal = async (nuevoCaudal) => {
    if (!dispositivo) return false;
    
    try {
      // Usar el endpoint específico para actualizar el caudal
      await axios.put(`${API_URL}/iot/update-flow/${dispositivo.iot_id}`, {
        actual_flow: nuevoCaudal
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // Actualizar la UI con los nuevos valores
      setCaudalActual(`${nuevoCaudal} L/min`);
      setFormData({
        caudal: nuevoCaudal.toString()
      });
      console.log(`Caudal actualizado exitosamente a ${nuevoCaudal} L/min`);
      
      return true;
    } catch (error) {
      console.error('Error al actualizar el caudal:', error);
      setErrorMessage('Error al actualizar el caudal');
      setError(true);
      return false;
    }
  };

  const handleGuardar = async () => {
    if (!validateForm() || !dispositivo) {
      setError(true);
      return;
    }
    
    const nuevoCaudal = parseFloat(formData.caudal);
    const exito = await actualizarCaudal(nuevoCaudal);
    
    if (exito) {
      setError(false);
      setSuccessMessage('El caudal ha sido actualizado con éxito.');
      setShowSuccessModal(true);
      
      // Refrescar datos
      obtenerDispositivos();
    }
  };

  const handleAperturaTotal = async () => {
    if (!dispositivo) return;
    
    const exito = await actualizarCaudal(CAUDAL_MAXIMO);
    
    if (exito) {
      setError(false);
      setSuccessMessage('Apertura total realizada con éxito.');
      setShowSuccessModal(true);
      
      // Refrescar datos
      obtenerDispositivos();
    }
  };

  const handleCierreTotal = async () => {
    if (!dispositivo) return;
    
    const exito = await actualizarCaudal(CAUDAL_MINIMO);
    
    if (exito) {
      setError(false);
      setSuccessMessage('Cierre total realizado con éxito.');
      setShowSuccessModal(true);
      
      // Refrescar datos
      obtenerDispositivos();
    }
  };

  // Determinar si los botones deben estar deshabilitados
  const botonesDeshabilitados = estado === 'inactiva';
  const botonGuardarDeshabilitado = !formData.caudal || isNaN(formData.caudal);

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-4 md:p-8 lg:p-12 my-10">
        <h1 className="text-center my-6 md:my-10 text-lg md:text-xl font-semibold">
          Control de la bocatoma del distrito
        </h1>

        {loading ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 text-center">
            <p>Cargando datos del dispositivo...</p>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-4 md:p-6">
            {dispositivo && (
              <div className="mb-6">
                <h2 className="font-medium text-gray-700 mb-2">Información del dispositivo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                  <div>
                    <p className="text-xs text-gray-500">Nombre:</p>
                    <p className="text-sm font-medium">{dispositivo.name || "Sin nombre"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ID:</p>
                    <p className="text-sm font-medium">{dispositivo.iot_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tipo:</p>
                    <p className="text-sm font-medium">{dispositivo.device_type_name || "Bocatoma"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Propietario:</p>
                    <p className="text-sm font-medium">{dispositivo.owner_name || "Sin asignar"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
              <div className="mb-4 md:mb-0">
                <p className="block text-sm font-medium mb-1">Estado</p>
                <div className="inline-block px-3 py-1 rounded-md text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {estado === 'activa' ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              <div>
                <p className="block text-sm font-medium mb-1">Caudal actual</p>
                <div className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50">
                  {caudalActual}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-col w-full">
                <label htmlFor="caudal" className="block text-sm font-medium mb-1">
                  Caudal (0-180) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="caudal"
                  name="caudal"
                  placeholder="Ej: 90"
                  value={formData.caudal}
                  onChange={handleChange}
                  maxLength={MAX_CARACTERES}
                  className={`w-full border ${fieldErrors.caudal ? "border-red-300" : "border-gray-300"} rounded px-3 py-2 focus:outline-none ${
                    botonesDeshabilitados ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={botonesDeshabilitados}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.caudal.length}/{MAX_CARACTERES} caracteres
                </div>
                {fieldErrors.caudal && <div className="h-0.5 bg-red-200 mt-0.5 rounded-full opacity-70"></div>}
                {fieldErrors.caudal && renderFieldError(fieldErrors.caudal)}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-6 space-y-3 md:space-y-0 md:space-x-4">
              <button
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  botonesDeshabilitados
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-800 text-white hover:bg-blue-900'
                }`}
                onClick={handleAperturaTotal}
                disabled={botonesDeshabilitados}
              >
                Apertura Total
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  botonesDeshabilitados
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-800 text-white hover:bg-blue-900'
                }`}
                onClick={handleCierreTotal}
                disabled={botonesDeshabilitados}
              >
                Cierre Total
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-center mb-4 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-center">
              <button
                className={`px-6 py-2 rounded-md text-sm transition-colors ${
                  botonGuardarDeshabilitado || botonesDeshabilitados
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-800 text-white hover:bg-blue-900'
                }`}
                onClick={handleGuardar}
                disabled={botonGuardarDeshabilitado || botonesDeshabilitados}
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de éxito */}
      <Modal
        showModal={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/perfil")
        }}
        title="Actualización Exitosa"
        btnMessage="Aceptar"
      >
        <p>{successMessage}</p>
      </Modal>
    </div>
  );
};

export default ControlBocatoma;