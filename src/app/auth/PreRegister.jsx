import React, { useState } from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PreRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    personType: '',
    phone: '',
    email: '',
    id: '',
    password: '',
    confirmPassword: '',
    attachments: [], 
  });
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    // Validar cantidad máxima de archivos
    if (formData.attachments.length + newFiles.length > 5) {
      setErrors((prev) => ({
        ...prev,
        attachments: 'Máximo 5 archivos permitidos',
      }));
      return;
    }

    // Validar tamaño de cada archivo
    const invalidFile = newFiles.find((file) => file.size > 500000); // 500KB en bytes
    if (invalidFile) {
      setErrors((prev) => ({
        ...prev,
        attachments: `El archivo ${invalidFile.name} excede los 500KB`,
      }));
      return;
    }

    
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles],
    }));
    setErrors((prev) => ({ ...prev, attachments: '' })); // Limpiar errores
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = formData.attachments.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, attachments: updatedFiles }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Limpiar el error cuando el usuario comienza a escribir
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, lastName, personType, phone, email, id, password, confirmPassword, attachments } = formData;

    // Validación para nombres (solo letras y espacios)
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/;
    if (!name) {
      newErrors.name = 'ERROR, campo vacío';
    } else if (!nameRegex.test(name)) {
      newErrors.name = 'Solo se permiten letras y espacios';
    }

    // Validación para apellidos (misma que nombres)
    if (!lastName) {
      newErrors.lastName = 'ERROR, campo vacío';
    } else if (!nameRegex.test(lastName)) {
      newErrors.lastName = 'Solo se permiten letras y espacios';
    }

    // Validación para teléfono (solo números)
    const numberRegex = /^\d+$/;
    if (!phone) {
      newErrors.phone = 'ERROR, campo vacío';
    } else if (!numberRegex.test(phone)) {
      newErrors.phone = 'Solo se permiten números';
    }

    // Validación para identificación (solo números)
    if (!id) {
      newErrors.id = 'ERROR, campo vacío';
    } else if (!numberRegex.test(id)) {
      newErrors.id = 'Solo se permiten números';
    }

    // Validación para correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'ERROR, campo vacío';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Formato de correo electrónico inválido';
    }

    // Resto de validaciones
    if (!personType) newErrors.personType = 'ERROR, campo vacío';
    if (!password) newErrors.password = 'ERROR, campo vacío';
    if (!confirmPassword) {
      newErrors.confirmPassword = 'ERROR, campo vacío';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    // Validación de archivos
    if (attachments.length === 0) {
      newErrors.attachments = 'Debe adjuntar al menos un archivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSuccessMessage('Formulario enviado con éxito.');
    
  };

  return (
    <div className="w-full h-full min-h-screen bg-white">
      {/* Barra superior (logo) */}
      <div className="h-full bg-[#DCF2F1] flex mx-auto justify-center">
        <img src="/img/logo.png" alt="Logo" className="w-[15%] lg:w-[30%]" />
      </div>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-center text-xl font-medium mb-8">Formulario de Pre registro de usuario</h2>

        <form onSubmit={handleSubmit}>
          {/* Datos Personales */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-4">
              Datos Personales<span className="text-red-500">*</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primera columna */}
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Nombre"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.name ? 'bg-red-100' : 'bg-white'
                    }`}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {errors.name && <p className="text-[#F90000]">{errors.name}</p>}
                </div>

                <div className="relative">
                  <span className="absolute left-0 top-0 text-red-500 -ml-3">*</span>
                  <div className="relative">
                    <select
                      className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${
                        errors.personType ? 'bg-red-100' : 'bg-white'
                      }`}
                      name="personType"
                      value={formData.personType}
                      onChange={handleChange}
                    >
                      <option value="">SELECCIÓN DE TIPO DE PERSONA</option>
                      <option value="natural">Persona Natural</option>
                      <option value="juridica">Persona Jurídica</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  </div>
                  {errors.personType && <p className="text-[#F90000]">{errors.personType}</p>}
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.email ? 'bg-red-100' : 'bg-white'
                    }`}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="text-[#F90000]">{errors.email}</p>}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.password ? 'bg-red-100' : 'bg-white'
                    }`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && <p className="text-[#F90000]">{errors.password}</p>}
                </div>
              </div>

              {/* Segunda columna */}
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Apellido"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.lastName ? 'bg-red-100' : 'bg-white'
                    }`}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && <p className="text-[#F90000]">{errors.lastName}</p>}
                </div>

                <div>
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.phone ? 'bg-red-100' : 'bg-white'
                    }`}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <p className="text-[#F90000]">{errors.phone}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Identificación"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.id ? 'bg-red-100' : 'bg-white'
                    }`}
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                  />
                  {errors.id && <p className="text-[#F90000]">{errors.id}</p>}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Confirmar Contraseña"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.confirmPassword ? 'bg-red-100' : 'bg-white'
                    }`}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && (
                    <p className="text-[#F90000]">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sección de carga de archivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center">
                <label className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm cursor-pointer flex items-center">
                  <span>Seleccionar archivos</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                  />
                  <Upload className="ml-2 w-4 h-4" />
                </label>
                <span className="ml-2 text-sm text-gray-500">
                  {formData.attachments.length}/5 archivos seleccionados
                </span>
              </div>

              {formData.attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Archivos seleccionados:</p>
                  <ul className="mt-2 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span>
                          {file.name} - {(file.size / 1024).toFixed(2)}KB
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {errors.attachments && (
                <p className="text-[#F90000] mt-2">{errors.attachments}</p>
              )}

              <div className="mt-4 text-sm">
                <p>Anexar los siguientes documentos:</p>
                <ul className="list-disc pl-5 text-sm">
                  <li>Cédula</li>
                  <li>NIT (en caso de persona jurídica)</li>
                  <li>Escrituras</li>
                  <li>RUT</li>
                  <li>Certificado de libertad y tradición (CTL)</li>
                </ul>
              </div>
            </div>

            {/* Botón de registro */}
            <div className="flex flex-col items-end space-y-2">
              <button
                type="submit"
                className="bg-[#e0f5f2] border border-gray-300 rounded px-8 py-2 text-sm cursor-pointer"
              >
                Registro
              </button>

              <button
                type="button"
                onClick={() => navigate("/Login")} 
                className="bg-[#e0f5f2] border border-gray-300 rounded px-8 py-2 text-sm cursor-pointer"
              >
                Iniciar Sesion
              </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] sm:w-[400px]">
                        <h2 className="text-xl font-bold mb-4">Pre registro exitoso</h2>
                        <p>Formulario enviado exitosamente</p>
                        <button onClick={handleConfirm} className="bg-[#365486] text-white px-4 py-2 rounded-lg hover:bg-[#344663]">
                            ACEPTAR
                        </button>
                    </div>
                </div>
            )}

            
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreRegister;