import React, { useState, useEffect } from "react";
import { ChevronDown, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../components/InputField"; // Componente reutilizable
import { validateField } from "../../components/ValidationRules"; // Validación modular
import Modal from "../../components/Modal"; // Importar el componente Modal

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

  const [documentTypes, setDocumentTypes] = useState([]);
  const [personTypes, setPersonTypes] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateIdModal, setShowDuplicateIdModal] = useState(false);

  // Obtener los tipos de documento y persona desde el backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const documentTypesResponse = await axios.get(
          "https://desarrollo-aquasmart-backend.onrender.com/api/users/list-document-type"
        );
        const personTypesResponse = await axios.get(
          "https://desarrollo-aquasmart-backend.onrender.com/api/users/list-person-type"
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

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key !== "attachments") {
        formDataToSend.append(key, formData[key]);
      }
    });

    formData.attachments.forEach((file) => {
      formDataToSend.append("attachments", file);
    });

    try {
      const response = await axios.post(
        "https://desarrollo-aquasmart-backend.onrender.com/api/users/pre-register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        setShowSuccessModal(true);
      } else {
        throw new Error("Error al enviar el formulario");
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      if (error.response && error.response.status === 409) {
        setShowDuplicateIdModal(true); // Mostrar modal específico para duplicados
      } else {
        setShowErrorModal(true); // Mostrar modal de error genérico
      }
    }
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
                <InputField
                  label="Nombre: "
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Nombre"
                  maxLength={20}
                  error={errors.first_name}
                />

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

                <InputField
                  label="Correo: "
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="xxxxxxx@example.com"
                  maxLength={50}
                  error={errors.email}
                />

                <InputField
                  label="Direccion de residencia"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Callexx#xx-xx"
                  maxLength={70}
                  error={errors.address}
                />

                <InputField
                  label="Contraseña: "
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Contraseña"
                  maxLength={20}
                  error={errors.password}
                />
              </div>

              {/* Segunda columna */}
              <div className="space-y-4">
                <InputField
                  label="Apellido: "
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Apellido"
                  maxLength={20}
                  error={errors.last_name}
                />

                <InputField
                  label="Telefono: "
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Telefono"
                  maxLength={13}
                  error={errors.phone}
                />

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
                      {documentTypes.map((type, index) => (
                        <option key={index} value={type.documentTypeId}>
                          {type.typeName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  </div>
                  {errors.document_type && (
                    <p className="text-[#F90000]">{errors.document_type}</p>
                  )}
                </div>

                <InputField
                  label="No. de identificacion: "
                  type="text"
                  name="document"
                  value={formData.document}
                  onChange={handleChange}
                  placeholder="Identificación"
                  maxLength={15}
                  error={errors.document}
                />

                <InputField
                  label="Confirmar Contraseña: "
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmar Contraseña"
                  maxLength={20}
                  error={errors.confirmPassword}
                />
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

      {/* Modales */}
      <Modal
        showModal={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="ERROR"
        btnMessage="Aceptar"
      >
        <p>Error en envío de formulario, por favor intente más tarde.</p>
      </Modal>

      <Modal
        showModal={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="ÉXITO"
        btnMessage="Aceptar"
      >
        <p>ENVÍO DEL FORMULARIO REALIZADO CON ÉXITO</p>
      </Modal>

      <Modal
        showModal={showDuplicateIdModal}
        onClose={() => setShowDuplicateIdModal(false)}
        title="Error de Pre Registro"
        btnMessage="Aceptar"
      >
        <p>Error en el envío del formulario, ya que el número de identificación ya cuenta con un pre-registro realizado.</p>
      </Modal>
    </div>
  );
};

export default PreRegister;