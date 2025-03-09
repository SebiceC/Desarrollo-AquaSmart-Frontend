import React, { useState, useEffect } from "react";
import { ChevronDown, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PreRegister = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    document_type: "",
    last_name: "",
    address: "",
    person_type: "",
    phone: "",
    email: "",
    document: "",
    password: "",
    confirmPassword: "",
    attachments: [],
  });

  const [documentTypes, setDocumentTypes] = useState([]); // Estado para los tipos de documento
  const [personTypes, setPersonTypes] = useState([]); // Estado para los tipos de persona

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Obtener los tipos de documento y persona desde el backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const documentTypesResponse = await axios.get(
          "https://desarrollo-aquasmart-backend.onrender.com/api/document-types"
        );
        const personTypesResponse = await axios.get(
          "https://desarrollo-aquasmart-backend.onrender.com/api/person-types"
        );

        setDocumentTypes(documentTypesResponse.data);
        setPersonTypes(personTypesResponse.data);
      } catch (error) {
        console.error("Error al obtener las opciones:", error);
      }
    };

    fetchOptions();
  }, []);

  // Manejar cambios en los archivos seleccionados
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    // Validar cantidad máxima de archivos
    if (formData.attachments.length + newFiles.length > 5) {
      setErrors((prev) => ({
        ...prev,
        attachments: "Máximo 5 archivos permitidos",
      }));
      return;
    }

    // Validar tipo de archivo (solo PDF)
    const invalidFileType = newFiles.find((file) => file.type !== "application/pdf");
    if (invalidFileType) {
      setErrors((prev) => ({
        ...prev,
        attachments: `El archivo ${invalidFileType.name} no es un PDF`,
      }));
      return;
    }

    // Validar tamaño de cada archivo
    const invalidFileSize = newFiles.find((file) => file.size > 500000); // 500KB en bytes
    if (invalidFileSize) {
      setErrors((prev) => ({
        ...prev,
        attachments: `El archivo ${invalidFileSize.name} excede los 500KB`,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles],
    }));
    setErrors((prev) => ({ ...prev, attachments: "" })); // Limpiar errores
  };

  // Eliminar un archivo seleccionado
  const handleRemoveFile = (index) => {
    const updatedFiles = formData.attachments.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, attachments: updatedFiles }));
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validar la longitud máxima de los campos
    let maxLength;
    switch (name) {
      case "first_name":
      case "last_name":
        maxLength = 20;
        break;
      case "person_type":
        maxLength = 10;
        break;
      case "phone":
        maxLength = 13;
        break;
      case "email":
        maxLength = 50;
        break;
      case "document":
        maxLength = 15;
        break;
      case "password":
      case "confirmPassword":
        maxLength = 20;
        break;
      default:
        maxLength = null;
    }

    if (maxLength && value.length > maxLength) {
      return; // No actualizar el estado si se excede la longitud máxima
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  // Validar el formulario
  const validateForm = () => {
    const newErrors = {};
    const { first_name, last_name, document_type, person_type, phone, email, address, document, password, confirmPassword, attachments } = formData;

    // Validación para nombres (solo letras y espacios)
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/;
    if (!first_name) {
      newErrors.first_name = "ERROR, campo vacío";
    } else if (!nameRegex.test(first_name)) {
      newErrors.first_name = "Solo se permiten letras y espacios";
    } else if (first_name.length > 20) {
      newErrors.first_name = "Máximo 20 caracteres";
    }

    // Validación para apellidos (misma que nombres)
    if (!last_name) {
      newErrors.last_name = "ERROR, campo vacío";
    } else if (!nameRegex.test(last_name)) {
      newErrors.last_name = "Solo se permiten letras y espacios";
    } else if (last_name.length > 20) {
      newErrors.last_name = "Máximo 20 caracteres";
    }

    if (!address) {
      newErrors.address = "ERROR, campo vacío";
    }

    // Validación para teléfono (solo números)
    const numberRegex = /^\d+$/;
    if (!phone) {
      newErrors.phone = "ERROR, campo vacío";
    } else if (!numberRegex.test(phone)) {
      newErrors.phone = "Solo se permiten números";
    } else if (phone.length > 13) {
      newErrors.phone = "Máximo 13 caracteres";
    }

    // Validación para identificación (solo números)
    if (!document) {
      newErrors.document = "ERROR, campo vacío";
    } else if (!numberRegex.test(document)) {
      newErrors.document = "Solo se permiten números";
    } else if (document.length > 15) {
      newErrors.document = "Máximo 15 caracteres";
    }

    // Validación para correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "ERROR, campo vacío";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Formato de correo electrónico inválido";
    } else if (email.length > 50) {
      newErrors.email = "Máximo 50 caracteres";
    }

    // Validación para la contraseña
    const passwordRegex = /^(?=.*[A-Z])(?=.*[._!@#$%^&*])(?=.{8,})/;
    if (!password) {
      newErrors.password = "ERROR, campo vacío";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial";
    } else if (password.length > 20) {
      newErrors.password = "Máximo 20 caracteres";
    }

    if (!person_type) newErrors.person_type = "ERROR, campo vacío";
    if (!document_type) newErrors.document_type = "ERROR, campo vacío";

    // Validación para confirmar contraseña
    if (!confirmPassword) {
      newErrors.confirmPassword = "ERROR, campo vacío";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
    } else if (confirmPassword.length > 20) {
      newErrors.confirmPassword = "Máximo 20 caracteres";
    }

    // Validación de archivos
    if (attachments.length === 0) {
      newErrors.attachments = "Debe adjuntar al menos un archivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar el envío del formulario con Axios
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Crear un objeto FormData para enviar los archivos
    const formDataToSend = new FormData();

    // Agregar los campos del formulario al FormData
    Object.keys(formData).forEach((key) => {
      if (key !== "attachments") {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Agregar los archivos al FormData
    formData.attachments.forEach((file, index) => {
      formDataToSend.append("attachments", file); // Django espera el nombre "attachments"
    });

    try {
      const response = await axios.post(
        "https://desarrollo-aquasmart-backend.onrender.com/api/users/pre-register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Importante para enviar archivos
          },
        }
      );

      if (response.status === 200) {
        // Mostrar el modal de éxito
        setShowSuccessModal(true);
      } else {
        throw new Error("Error al enviar el formulario");
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      setShowErrorModal(true); // Mostrar el modal de error
    }
  };

  // Manejar la confirmación del modal
  const handleConfirm = () => {
    setShowModal(false); // Cerrar el modal
    navigate("/Login"); // Redirigir al usuario a la página de inicio de sesión
  };

  return (
    <div className="w-full h-full min-h-screen bg-white">
      {/* Barra superior (logo) */}
      <div className="h-full bg-[#DCF2F1] flex mx-auto justify-center">
        <img src="/img/logo.png" alt="Logo" className="w-[15%] lg:w-[30%]" />
      </div>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-center text-xl font-medium mb-8">
          Formulario de Pre registro de usuario
        </h2>

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
                  <label>Nombre: </label>
                  <input
                    type="text"
                    placeholder="Nombre"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.first_name ? "bg-red-100" : "bg-white"
                    }`}
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    maxLength={20} // Limitar a 20 caracteres
                  />
                  {errors.first_name && (
                    <p className="text-[#F90000]">{errors.first_name}</p>
                  )}
                </div>

                <div className="relative">
                  <label>Tipo de persona: </label>
                  <span className="absolute left-0 top-0 text-red-500 -ml-3">*</span>
                  <div className="relative">
                    <select
                      className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${
                        errors.person_type ? "bg-red-100" : "bg-white"
                      }`}
                      name="person_type"
                      value={formData.person_type}
                      onChange={handleChange}
                    >
                      <option value="">SELECCIÓN DE TIPO DE PERSONA</option>
                      {personTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  </div>
                  {errors.person_type && (
                    <p className="text-[#F90000]">{errors.person_type}</p>
                  )}
                </div>

                <div>
                  <label>Correo: </label>
                  <input
                    type="email"
                    placeholder="xxxxxxx@example.com"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.email ? "bg-red-100" : "bg-white"
                    }`}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={50} // Limitar a 50 caracteres
                  />
                  {errors.email && <p className="text-[#F90000]">{errors.email}</p>}
                </div>

                <div>
                  <label>Direccion de residencia</label>
                  <input
                    type="text"
                    placeholder="Callexx#xx-xx"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.address ? "bg-red-100" : "bg-white"
                    }`}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    maxLength={70}
                  />
                  {errors.address && (
                    <p className="text-[#F90000]">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label>Contraseña: </label>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.password ? "bg-red-100" : "bg-white"
                    }`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    maxLength={20} // Limitar a 20 caracteres
                  />
                  {errors.password && (
                    <p className="text-[#F90000]">{errors.password}</p>
                  )}
                </div>
              </div>

              {/* Segunda columna */}
              <div className="space-y-4">
                <div>
                  <label>Apellido: </label>
                  <input
                    type="text"
                    placeholder="Apellido"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.last_name ? "bg-red-100" : "bg-white"
                    }`}
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    maxLength={20} // Limitar a 20 caracteres
                  />
                  {errors.last_name && (
                    <p className="text-[#F90000]">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label>Telefono: </label>
                  <input
                    type="tel"
                    placeholder="Telefono"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.phone ? "bg-red-100" : "bg-white"
                    }`}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={13} // Limitar a 13 caracteres
                  />
                  {errors.phone && <p className="text-[#F90000]">{errors.phone}</p>}
                </div>

                <div className="relative">
                  <label>Tipo de documento: </label>
                  <span className="absolute left-0 top-0 text-red-500 -ml-3">*</span>
                  <div className="relative">                
                    <select
                      className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${
                        errors.document_type ? "bg-red-100" : "bg-white"
                      }`}
                      name="document_type"
                      value={formData.document_type}
                      onChange={handleChange}
                    >
                      <option value="">TIPO DE DOCUMENTO</option>
                      {documentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  </div>
                  {errors.document_type && (
                    <p className="text-[#F90000]">{errors.document_type}</p>
                  )}
                </div>

                <div>
                  <label>No. de identificacion: </label>
                  <input
                    type="text"
                    placeholder="Identificación"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.document ? "bg-red-100" : "bg-white"
                    }`}
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    maxLength={15} // Limitar a 15 caracteres
                  />
                  {errors.document && (
                    <p className="text-[#F90000]">{errors.document}</p>
                  )}
                </div>

                <div>
                  <label>Confirmar Contraseña: </label>
                  <input
                    type="password"
                    placeholder="Confirmar Contraseña"
                    className={`w-full border border-gray-300 rounded px-3 py-2 ${
                      errors.confirmPassword ? "bg-red-100" : "bg-white"
                    }`}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    maxLength={20} // Limitar a 20 caracteres
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
                    accept="application/pdf" // Aceptar solo archivos PDF
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
          </div>
        </form>
      </div>
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-90 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg text-left w-[90%] sm:w-[400px]">
            <h2 className="text-2xl mb-4">ERROR</h2>{" "}
            <p className="text-md mb-4">
              Error en envío de formulario, por favor intente más tarde.
            </p>
            <div className="flex justify-end">
              {" "}
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-400"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-90 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg text-left w-[90%] sm:w-[400px]">
            <h2 className="text-2xl mb-4">ÉXITO</h2>{" "}
            <p className="text-md mb-4">
              ENVÍO DEL FORMULARIO REALIZADO CON ÉXITO
            </p>
            <div className="flex justify-end">
              {" "}
              <button
                onClick={() => setShowSuccessModal(false)} // Cerrar el modal
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-400"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreRegister;