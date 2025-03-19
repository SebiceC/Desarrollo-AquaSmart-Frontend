import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import InputItem from "../../../components/InputItem";
import { validateField } from "../../../components/ValidationRules";
import Modal from "../../../components/Modal";
import NavBar from "../../../components/NavBar";
import { ChevronDown, Upload } from "lucide-react";

const UpdateInformation = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const navigate = useNavigate();
  const { document: userId } = useParams();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    document: "",
    role: "",
    email: "",
    phone: "",
    person_type_name: "",
    is_active: true,
    attachments: [],
  });
  const [personTypes, setPersonTypes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userStates] = useState([
    { value: true, label: "Activo" },
    { value: false, label: "Inactivo" }
  ]);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showErrorModal2, setShowErrorModal2] = useState(false);
  const [showNoChangesModal, setShowNoChangesModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const personTypesResponse = await axios.get(`${API_URL}/users/list-person-type`);
        console.log("Tipos de persona disponibles:", personTypesResponse.data); // Debug
        setPersonTypes(personTypesResponse.data);

        const token = localStorage.getItem("token");
        const rolesResponse = await axios.get(`${API_URL}/admin/roles`, {
          headers: { Authorization: `Token ${token}` },
        });
        console.log("Roles disponibles:", rolesResponse.data); // Debug
        setRoles(rolesResponse.data);
      } catch (error) {
        console.error("Error al obtener las opciones:", error);
      }
    };

    fetchOptions();
  }, [API_URL]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No hay sesión activa.");
          return;
        }

        const usersResponse = await axios.get(`${API_URL}/users/admin/listed`, {
          headers: { Authorization: `Token ${token}` },
        });

        const userData = usersResponse.data.find((user) => user.document === userId);
        console.log("Datos del usuario:", userData); // Debug

        if (!userData) {
          throw new Error("Usuario no encontrado");
        }

        const permissionsResponse = await axios.get(`${API_URL}/admin/users/${userId}/permissions`, {
          headers: { Authorization: `Token ${token}` },
        });
        console.log("Permisos del usuario:", permissionsResponse.data); // Debug

        const role = permissionsResponse.data.role || "Sin rol asignado";
        
        // Asegurarse de que is_active sea booleano
        const userWithCorrectTypes = {
          ...userData,
          role,
          is_active: userData.is_active === true || userData.is_active === "true" ? true : false
        };
        
        setUser(userWithCorrectTypes);

        // Recuperar el tipo de persona usando el ID
        let personTypeName = "";
        if (userData.person_type) {
          if (typeof userData.person_type === 'number') {
            const personType = personTypes.find(type => type.personTypeId === userData.person_type);
            personTypeName = personType ? personType.typeName : "";
          } else if (userData.person_type.typeName) {
            personTypeName = userData.person_type.typeName;
          }
        }
        console.log("Tipo de persona cargado:", personTypeName); // Debug

        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          document: userData.document || "",
          role: role,
          email: userData.email || "",
          phone: userData.phone || "",
          person_type_name: personTypeName,
          is_active: userData.is_active === true || userData.is_active === "true", // Asegurar que is_active sea siempre booleano
          attachments: userData.attachments || [],
        });
        
        console.log("Estado del usuario cargado (is_active):", userData.is_active, "convertido a:", userData.is_active === true || userData.is_active === "true");
      } catch (err) {
        console.error("Error al cargar los datos:", err);
        setShowErrorModal2(true);
      }
    };

    if (API_URL && userId && personTypes.length > 0) {
      fetchUserData();
    }
  }, [API_URL, userId, personTypes]); // Añadir personTypes como dependencia

  // Función para obtener los campos que han sido modificados 
  const getChangedFields = (formData, originalData) => {
    const changedFields = {};

    // Skip document field as it shouldn't be modified
    const fieldsToCheck = Object.keys(formData).filter(key => key !== 'document');
    
    fieldsToCheck.forEach(key => {
      // Special handling for attachments
      if (key === 'attachments') {
        // Only include attachments if there are new files
        const hasNewFiles = formData[key].some(file => file instanceof File);
        if (hasNewFiles) {
          changedFields[key] = formData[key];
        }
      } 
      // Special handling for person_type_name
      else if (key === 'person_type_name') {
        // Obtener el nombre del tipo de persona del dato original
        let originalPersonTypeName = "";
        
        if (originalData.person_type) {
          if (typeof originalData.person_type === 'number') {
            const personType = personTypes.find(type => type.personTypeId === originalData.person_type);
            originalPersonTypeName = personType ? personType.typeName : "";
          } else if (originalData.person_type.typeName) {
            originalPersonTypeName = originalData.person_type.typeName;
          }
        }
        
        // Comparar con los datos del formulario
        if (formData[key] !== originalPersonTypeName) {
          changedFields[key] = formData[key];
        }
      }
      // Manejo especial para is_active (comparar como booleanos)
      else if (key === 'is_active') {
        // Asegurar que ambos valores sean booleanos para comparación
        const originalValue = originalData[key] === true || originalData[key] === "true";
        const currentValue = formData[key] === true || formData[key] === "true";
        
        if (originalValue !== currentValue) {
          changedFields[key] = currentValue;
          console.log("Detectado cambio en is_active:", originalValue, "->", currentValue);
        }
      }
      // For all other fields, check if values have changed
      else if (formData[key] !== originalData[key]) {
        changedFields[key] = formData[key];
      }
    });

    return changedFields;
  };

  // Enhanced validateForm function
  const validateForm = () => {
    const newErrors = {};
    const changedFields = getChangedFields(formData, user);
    
    // Only validate fields that have changed
    Object.keys(changedFields).forEach(key => {
      // Skip document validation as it shouldn't be modified
      if (key !== 'document') {
        const fieldErrors = validateField(key, formData[key], formData);
        if (fieldErrors[key]) {
          newErrors[key] = fieldErrors[key];
        }
      }
    });

    // Special validation for attachments
    if (changedFields.attachments) {
      const fieldErrors = validateField("attachments", formData.attachments, formData);
      if (fieldErrors.attachments) {
        newErrors.attachments = fieldErrors.attachments;
      }
    }

    // Validación específica para el campo is_active
    if (changedFields.is_active !== undefined && formData.is_active === undefined) {
      newErrors.is_active = "El estado del usuario es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // No permitir cambios en el campo documento
    if (name === "document") return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validar el campo en tiempo real usando ValidationRules
    const fieldErrors = validateField(name, value, formData);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldErrors[name] || "",
    }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const currentFiles = formData.attachments || [];
    const allFiles = [...currentFiles, ...newFiles];

    // Validar archivos usando ValidationRules
    const fieldErrors = validateField("attachments", allFiles, formData);
    if (fieldErrors.attachments) {
      setErrors((prev) => ({
        ...prev,
        attachments: fieldErrors.attachments,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      attachments: allFiles,
    }));
    setErrors((prev) => ({ ...prev, attachments: "" }));
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = formData.attachments.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, attachments: updatedFiles }));

    if (updatedFiles.length > 0) {
      const fieldErrors = validateField("attachments", updatedFiles, formData);
      setErrors((prev) => ({
        ...prev,
        attachments: fieldErrors.attachments || "",
      }));
    } else {
      setErrors((prev) => ({ ...prev, attachments: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all form fields before submitting
    if (!validateForm()) return;

    // Get only the fields that have changed
    const changedFields = getChangedFields(formData, user);
    
    // If no fields have changed, show modal and return
    if (Object.keys(changedFields).length === 0) {
      setShowNoChangesModal(true);
      return;
    }

    // Create FormData object with only the changed fields
    const formDataToSend = new FormData();
    
    Object.keys(changedFields).forEach(key => {
      if (key !== 'attachments') {
        // Convertir person_type_name a person_type (ID) para la API
        if (key === 'person_type_name') {
          const selectedPersonType = personTypes.find(type => type.typeName === changedFields[key]);
          if (selectedPersonType) {
            formDataToSend.append('person_type', selectedPersonType.personTypeId);
          }
        } 
        // Manejo especial para el campo is_active (booleano)
        else if (key === 'is_active') {
          // Probar con múltiples formatos
          const boolValue = changedFields[key] === true || changedFields[key] === "true";
          
          // Enviar como cadena de texto "true" o "false"
          formDataToSend.append('is_active', boolValue ? "true" : "false");
          
          // También enviar como valor numérico 1 o 0 (usado en algunos backends)
          formDataToSend.append('is_active_numeric', boolValue ? 1 : 0);
          
          console.log("Enviando is_active como:", boolValue ? "true" : "false");
          console.log("Enviando is_active_numeric como:", boolValue ? 1 : 0);
        } 
        else {
          formDataToSend.append(key, changedFields[key]);
        }
      }
    });

    // Add any attachments if they exist in changedFields
    if (changedFields.attachments) {
      changedFields.attachments.forEach(file => {
        // Only append actual File objects, not strings or existing files
        if (file instanceof File) {
          formDataToSend.append('attachments', file);
        }
      });
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrors(prev => ({
          ...prev,
          submit: "No hay sesión activa. Por favor, inicie sesión nuevamente.",
        }));
        setShowErrorModal(true);
        return;
      }

      console.log("Campos modificados detectados:", changedFields);
      console.log("Valor original is_active:", user.is_active);
      console.log("Valor actual is_active:", formData.is_active);
      
      // Para depuración, mostrar lo que se está enviando al servidor
      console.log("Datos enviados al servidor:");
      for (let pair of formDataToSend.entries()) {
        console.log("→ " + pair[0] + ': ' + pair[1] + " (tipo: " + typeof pair[1] + ")");
      }

      // Send the request with only changed fields
      const response = await axios.patch(
        `${API_URL}/users/admin/update/${userId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status === "success") {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      let errorMessage = "Error en envío de formulario. Por favor, intente de nuevo o más tarde.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Handle specific backend errors
        if (error.response.data.message.includes("documento")) {
          setErrors(prev => ({
            ...prev,
            document: "El documento de identidad no puede ser modificado",
          }));
        }
      }

      setErrors(prev => ({
        ...prev,
        submit: errorMessage,
      }));
      setShowErrorModal(true);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-white">
      <div className="bg-[#DCF2F1] py-4">
        <NavBar />
      </div>
      {/* Ajuste principal: contenedor principal más responsivo con padding adaptativo */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-8 my-4 sm:my-10 text-center">Actualizar Usuario</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {user ? (
          <form onSubmit={handleSubmit} className="w-full">
            {/* Grid más adaptable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <div className="relative">
                <select
                  className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${
                    errors.role ? "bg-red-100" : "bg-white"
                  }`}
                  name="role"
                  value={formData.role || ""}
                  onChange={handleChange}
                >
                  <option value="">SELECCIÓN DE ROL</option>
                  {roles.map((role, index) => (
                    <option key={index} value={role.name || role}>
                      {role.name || role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative">
                <select
                  className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${
                    errors.person_type_name ? "bg-red-100" : "bg-white"
                  }`}
                  name="person_type_name"
                  value={formData.person_type_name || ""}
                  onChange={handleChange}
                >
                  <option value="">SELECCIÓN DE TIPO DE PERSONA</option>
                  {personTypes.map((type, index) => (
                    <option key={index} value={type.typeName}>
                      {type.typeName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {errors.person_type_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.person_type_name}</p>
                )}
              </div>
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
                  aria-label="Documento de identidad (no editable)"
                />
                {errors.document && (
                  <p className="text-[#F90000] text-sm mt-1">{errors.document}</p>
                )}
              </div>
              <InputItem label="Nombre" name="first_name" value={formData.first_name} onChange={handleChange} error={errors.first_name} required maxLength={20} />
              <InputItem label="Apellidos" name="last_name" value={formData.last_name} onChange={handleChange} error={errors.last_name} required maxLength={20} />
              <InputItem label="Teléfono" type="tel" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} required maxLength={13} />
              <InputItem label="Correo electrónico" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} required maxLength={50} />
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del usuario
                </label>
                <div className="relative">
                  <select
                    className={`w-full border border-gray-300 rounded px-3 py-2 appearance-none ${
                      errors.is_active ? "bg-red-100" : "bg-white"
                    }`}
                    name="is_active"
                    value={formData.is_active === undefined ? "" : formData.is_active.toString()}
                    onChange={(e) => {
                      // Convertir explícitamente a booleano
                      const value = e.target.value === "true";
                      console.log("Cambiando is_active a:", value, "tipo:", typeof value);
                      setFormData((prev) => ({
                        ...prev,
                        is_active: value,
                      }));
                      
                      // Limpiar errores relacionados
                      setErrors(prev => ({ ...prev, is_active: "" }));
                    }}
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
                {errors.is_active && (
                  <p className="text-red-500 text-sm mt-1">{errors.is_active}</p>
                )}
              </div>
              
              {/* Sección de carga de archivos - mejorada para móvil */}
              <div className="col-span-1 sm:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <label className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm cursor-pointer flex items-center self-start mb-2 sm:mb-0">
                    <span>Seleccionar archivos</span>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf"
                    />
                    <Upload className="ml-2 w-4 h-4" />
                  </label>
                  <span className="sm:ml-2 text-sm text-gray-500">
                    {formData.attachments.length}/5 archivos seleccionados
                  </span>
                </div>

                {errors.attachments && (
                  <p className="text-[#F90000] mt-2">{errors.attachments}</p>
                )}

                {formData.attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Archivos seleccionados:</p>
                    <ul className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {formData.attachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between text-sm border-b border-gray-100 pb-1">
                          <span className="truncate max-w-xs sm:max-w-md">
                            {file.name || file} {file.size ? `- ${(file.size / 1024).toFixed(2)}KB` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Botones más responsivos */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => navigate("/gestionDatos/users")}
                className="bg-gray-200 px-4 sm:px-6 py-2 rounded hover:bg-gray-300 w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#67f0dd] border border-gray-300 rounded px-4 sm:px-8 py-2 text-sm cursor-pointer hover:bg-[#5acbbb] transition-colors w-full sm:w-auto order-1 sm:order-2"
              >
                Actualizar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-center items-center py-10">
            <p className="text-center text-gray-500">Cargando datos del usuario...</p>
          </div>
        )}
      </div>

      <Modal
        showModal={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        btnMessage="Volver"
      >
        <p>{errors.submit || "Ha ocurrido un error al actualizar el usuario"}</p>
      </Modal>

      <Modal
        showModal={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          window.location.reload();
        }}
        title="Éxito"
        btnMessage="Aceptar"
      >
        <p>Los datos del usuario han sido actualizados correctamente.</p>
      </Modal>

      <Modal
        showModal={showNoChangesModal}
        onClose={() => setShowNoChangesModal(false)}
        title="Aviso"
        btnMessage="Aceptar"
      >
        <p>No se han detectado cambios en los datos del usuario.</p>
      </Modal>

      <Modal
        showModal={showErrorModal2}
        onClose={() => {
          setShowErrorModal2(false);
          navigate("/gestionDatos/users");
        }}
        title="Error"
        btnMessage="Volver"
      >
        <p>Error al cargar los datos del usuario. Por favor, intente nuevamente.</p>
      </Modal>
    </div>
  );
};

export default UpdateInformation;