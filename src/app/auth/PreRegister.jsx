import React, { useState, useEffect, useRef } from "react";
import { Asterisk, ChevronDown, EyeIcon, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputItem from "../../components/InputItem"; // Componente reutilizable
import { validateField } from "../../components/ValidationRules"; // Validación modular
import Modal from "../../components/Modal"; // Importar el componente Modal
import { EyeSlashIcon } from "@heroicons/react/24/solid";

const PreRegister = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL;
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

  const [documentTypes, setDocumentTypes] = useState([]);
  const [personTypes, setPersonTypes] = useState([]);
  const [filteredDocumentTypes, setFilteredDocumentTypes] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateIdModal, setShowDuplicateIdModal] = useState(false);
  const [showEmailErrorModal, setShowEmailErrorModal] = useState(false);
  const [showPreRegistroActivoModal, setShowPreRegistroActivoModal] = useState(false);
  const [showPreRegistroCompletadoModal, setShowPreRegistroCompletadoModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);


  // Obtener los tipos de documento y persona desde el backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const documentTypesResponse = await axios.get(
          `${API_URL}/users/list-document-type`
        );
        const personTypesResponse = await axios.get(
          `${API_URL}/users/list-person-type`
        );

        setDocumentTypes(documentTypesResponse.data);
        setPersonTypes(personTypesResponse.data);
      } catch (error) {
        console.error("Error al obtener las opciones:", error);
      }
    };

    fetchOptions();
  }, []);

  // Filtrar los tipos de documento según el tipo de persona seleccionado

  useEffect(() => {
    if (formData.person_type === "1") {
      // Si es "Natural", excluir el tipo de documento 4 (NIT)
      setFilteredDocumentTypes(
        documentTypes.filter((type) => type.documentTypeId !== 2)
      );
    } else if (formData.person_type === "2") {
      // Si es "Jurídica", solo permitir el tipo de documento 4 (NIT)
      setFilteredDocumentTypes(
        documentTypes.filter((type) => type.documentTypeId === 2)
      );
    } else {
      // Si no se ha seleccionado un tipo de persona, mostrar todos los tipos de documento
      setFilteredDocumentTypes(documentTypes);
    }
  }, [formData.person_type, documentTypes]);




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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Validar el campo en tiempo real
    const fieldErrors = validateField(name, value, formData);
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: fieldErrors[name] || "",
    }));
  };

  // Validar el formulario completo
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      if (key !== "attachments") {
        const fieldErrors = validateField(key, formData[key], formData);
        if (fieldErrors[key]) {
          newErrors[key] = fieldErrors[key];
        }
      }
    });

    // Validación de archivos
    if (formData.attachments.length === 0) {
      newErrors.attachments = "Debe adjuntar al menos un archivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  // Manejar el envío del formulario con Axios
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    const formDataToSend = new FormData();
    // Excluir confirmPassword ya que no existe en el backend
    Object.keys(formData).forEach((key) => {
      if (key !== "attachments" && key !== "confirmPassword") {
        formDataToSend.append(key, formData[key]);
      }
    });

    formData.attachments.forEach((file) => {
      formDataToSend.append("attachments", file);
    });

    try {
      const response = await axios.post(
        `${API_URL}/users/pre-register`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setIsLoading(false);
      if (response.status === 201) {
        // Limpiamos el formulario
        setShowSuccessModal(true);
      } else {
        throw new Error("Error al enviar el formulario");
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      setIsLoading(false);
      
      // Extraer los datos de error
      let errorData = null;
      
      // Obtener el objeto de error del response
      if (error.response && error.response.data) {
        errorData = error.response.data;
      }
      
      // Si errorData es una cadena, intentar parsearla como JSON
      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData);
        } catch (e) {
          // Si no se puede parsear, usar un objeto de error predeterminado
          errorData = null;
        }
      }
      
      // Verificar si tenemos el formato esperado
      if (errorData && errorData.status === "error" && errorData.errors) {
        const errors = errorData.errors;
        
        // Priorizar los mensajes de error (en caso de que haya múltiples)
        if (errors.document && errors.document.includes("El usuario ya pasó el pre-registro.")) {
          setShowPreRegistroCompletadoModal(true);
        } else if (errors.document && errors.document.includes("Ya tienes un pre-registro activo.")) {
          setShowPreRegistroActivoModal(true);
        } else if (errors.email && errors.email.includes("Este correo ya está registrado.")) {
          setShowEmailErrorModal(true);
        } else {
          // Si hay errores pero no coinciden con nuestros casos conocidos
          setShowErrorModal(true);
        }
      } else {
        // Para cualquier otro formato de error
        setShowErrorModal(true);
      }
    }
    
  };


  return (
    <div className="w-full h-full min-h-screen bg-white">
      {/* Barra superior (logo) */}
      <div className="h-full bg-[#DCF2F1] flex mx-auto justify-center py-4">
        <img src="/img/logo.png" alt="Logo" className="w-[80%] max-w-[400px]" />
      </div>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8  my-8">
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
                <InputItem
                  label="Nombre: "
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Nombre"
                  maxLength={20}
                  error={errors.first_name}
                />

                <InputItem
                  label="Apellido: "
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Apellido"
                  maxLength={20}
                  error={errors.last_name}
                />

                <InputItem
                  label="Correo: "
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="xxxxxxx@example.com"
                  maxLength={50}
                  error={errors.email}
                />

                <InputItem
                  label="Telefono: "
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Telefono"
                  maxLength={10}
                  error={errors.phone}
                />

                <InputItem
                  label="Direccion de residencia"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Callexx#xx-xx"
                  maxLength={35}
                  error={errors.address}
                />
              </div>

              {/* Segunda columna */}
              <div className="space-y-4">
                <div className="relative">
                  <label>Tipo de persona: </label>
                  <span className="absolute left-0 top-0 text-red-500 -ml-3">*</span>
                  <div className="relative">
                    <select
                      className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${errors.person_type ? "bg-red-100" : "bg-white"
                        }`}
                      name="person_type"
                      value={formData.person_type}
                      onChange={handleChange}
                    >
                      <option value="">SELECCIÓN DE TIPO DE PERSONA</option>
                      {personTypes.map((type, index) => (
                        <option key={index} value={type.personTypeId}>
                          {type.typeName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  </div>
                  {errors.person_type && (
                    <p className="text-[#F90000]">{errors.person_type}</p>
                  )}
                </div>

                <div className="relative">
                  <label>Tipo de documento: </label>
                  <span className="absolute left-0 top-0 text-red-500 -ml-3">*</span>
                  <div className="relative">
                    <select
                      className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${errors.document_type
                        ? "bg-red-100"
                        : formData.person_type
                          ? "bg-white"
                          : "bg-gray-100 text-gray-400"
                        }`}
                      name="document_type"
                      value={formData.document_type}
                      onChange={handleChange}
                      disabled={!formData.person_type}
                    >
                      <option value="">TIPO DE DOCUMENTO</option>
                      {filteredDocumentTypes.map((type, index) => (
                        <option key={index} value={type.documentTypeId}>
                          {type.typeName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${!formData.person_type ? "text-gray-400" : "text-gray-500"
                      }`} />
                  </div>
                  {errors.document_type && (
                    <p className="text-[#F90000]">{errors.document_type}</p>
                  )}
                </div>

                <InputItem
                  label="No. de identificacion: "
                  type="text"
                  name="document"
                  value={formData.document}
                  onChange={handleChange}
                  placeholder="Identificación"
                  maxLength={12}
                  error={errors.document}
                />
                <div className="relative w-full flex">
                  <InputItem
                    label="Contraseña: "
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Contraseña"
                    maxLength={20}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-18 sm:right-20 top-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="relative w-full flex">
                  <InputItem
                    label="Confirmar contraseña: "
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmar Contraseña"
                    maxLength={20}
                    error={errors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="absolute right-18 sm:right-20 top-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-6 w-6 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-[94%]">
            <label className="text-sm font-semibold flex items-center gap-1">
              Documentos Requeridos <Asterisk size={12} className="text-red-500" />
            </label>

            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white">
              {/* Sección de carga de archivos */}
              <div className="w-full md:w-[55%] border border-dashed border-gray-300 rounded-md p-4">
                <label className="flex items-center justify-center w-full h-12 bg-[#3b5998] text-white rounded cursor-pointer hover:bg-[#334b85] text-sm font-medium">
                  Seleccionar archivos
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="application/pdf"
                  />
                </label>

                <div className="mt-3 text-sm text-gray-600">
                  {formData.attachments.length}/5 archivos
                </div>

                {formData.attachments.length > 0 && (
                  <div className="mt-4">
                    <ul className="space-y-2 text-sm text-gray-800">
                      {formData.attachments.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 text-lg font-bold hover:text-red-700"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {errors.attachments && (
                  <p className="text-[#F90000] mt-2 text-sm">{errors.attachments}</p>
                )}
              </div>

              {/* Documentos requeridos y botones */}
              <div className="w-full md:w-[55%] bg-gray-100 p-4 rounded-md flex flex-col justify-between">
                <div>
                  <p className="font-semibold text-sm mb-2">Documentos requeridos:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>Cédula</li>
                    <li>NIT (en caso de persona jurídica)</li>
                    <li>Escrituras</li>
                    <li>RUT</li>
                    <li>Certificado de libertad y tradición (CTL)</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    Todos los archivos deben estar en formato PDF y no exceder los 500KB cada uno.
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  <button
                    type="submit"
                    className="bg-[#3b5998] text-white py-2 rounded hover:bg-[#334b85] transition-colors"
                  >
                    Registrarse
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/Login")}
                    className="border border-gray-400 py-2 rounded text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>


        </form>
      </div>

      {/* Modales */}
      <Modal
        showModal={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);

        }}
        title="ERROR"
        btnMessage="Aceptar"
      >
        <p>Error en envío de formulario, por favor intente más tarde.</p>
      </Modal>

      <Modal
        showModal={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);

        }}
        title="ÉXITO"
        btnMessage="Aceptar"
      >
        <p>ENVÍO DEL FORMULARIO REALIZADO CON ÉXITO</p>
      </Modal>

      <Modal
        showModal={showDuplicateIdModal}
        onClose={() => {
          setShowDuplicateIdModal(false);

        }}
        title="Error de Pre Registro"
        btnMessage="Aceptar"
      >
        <p>Error en el envío del formulario, ya que el número de identificación ya esta registrado o cuenta con un pre-registro.</p>
      </Modal>

      <Modal
        showModal={showEmailErrorModal}
        onClose={() => setShowEmailErrorModal(false)}
        title="Error de Pre Registro"
        btnMessage="Aceptar"
      >
        <p>El correo electrónico ya está registrado en el sistema.</p>
      </Modal>

      <Modal
        showModal={showPreRegistroCompletadoModal}
        onClose={() => setShowPreRegistroCompletadoModal(false)}
        title="Error de Pre Registro"
        btnMessage="Aceptar"
      >
        <p>EL usuario ya completó el proceso de pre-registro. Por favor inicie sesión.</p>
      </Modal>
      <Modal
        showModal={showPreRegistroActivoModal}
        onClose={() => setShowPreRegistroActivoModal(false)}
        title="Error de Pre Registro"
        btnMessage="Aceptar"
      >
        <p>Ya tienes un pre-registro activo.Espera ser validado por el administrador.</p>
      </Modal>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#67f0dd] mb-3"></div>
            <p className="text-gray-700">Procesando solicitud...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreRegister;
