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
    attachments: [],
  });
  const [personTypes, setPersonTypes] = useState([]);
  const [roles, setRoles] = useState([]);
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
        setUser({ ...userData, role });

        // Asegurarnos de que person_type_name esté disponible
        const personTypeName = userData.person_type ? userData.person_type.typeName : "";
        console.log("Tipo de persona cargado:", personTypeName); // Debug

        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          document: userData.document || "",
          role: role,
          email: userData.email || "",
          phone: userData.phone || "",
          person_type_name: personTypeName,
          attachments: userData.attachments || [],
        });
      } catch (err) {
        console.error("Error al cargar los datos:", err);
        setShowErrorModal2(true);
      }
    };

    if (API_URL && userId) {
      fetchUserData();
    }
  }, [API_URL, userId]);

  const validateForm = () => {
    const newErrors = {};

    // Validar todos los campos excepto attachments y document
    Object.keys(formData).forEach((key) => {
      if (key !== "attachments" && key !== "document") {
        const fieldErrors = validateField(key, formData[key], formData);
        if (fieldErrors[key]) {
          newErrors[key] = fieldErrors[key];
        }
      }
    });

    // Validación específica para archivos adjuntos
    if (formData.attachments?.length > 0) {
      const fieldErrors = validateField("attachments", formData.attachments, formData);
      if (fieldErrors.attachments) {
        newErrors.attachments = fieldErrors.attachments;
      }
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

    // Validar todo el formulario antes de enviar
    if (!validateForm()) return;

    // Verificar si hay cambios en los datos
    const hasChanges = Object.keys(formData).some((key) => {
      // Ignorar el documento en la comparación de cambios
      if (key === "document") return false;
      if (key === "attachments") {
        return formData[key].length > 0;
      }
      return formData[key] !== user[key];
    });

    if (!hasChanges) {
      setShowNoChangesModal(true);
      return;
    }

    const formDataToSend = new FormData();
    // Excluir el documento de la actualización ya que no debe modificarse
    const { document: _, ...updateData } = formData;

    Object.keys(updateData).forEach((key) => {
      if (key !== "attachments") {
        formDataToSend.append(key, updateData[key]);
      }
    });

    updateData.attachments.forEach((file) => {
      formDataToSend.append("attachments", file);
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrors((prev) => ({
          ...prev,
          submit: "No hay sesión activa. Por favor, inicie sesión nuevamente.",
        }));
        setShowErrorModal(true);
        return;
      }

      const response = await axios.patch(
        `${API_URL}/users/admin/update/${userId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Token ${token}`,
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
        // Manejar errores específicos del backend
        if (error.response.data.message.includes("documento")) {
          setErrors((prev) => ({
            ...prev,
            document: "El documento de identidad no puede ser modificado",
          }));
        }
      }

      setErrors((prev) => ({
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
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-xl font-medium mb-8 my-10 text-center">Actualizar Usuario</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {user ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              {/* Sección de carga de archivos */}
              <div className="col-span-2">
                <div className="flex items-center">
                  <label className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm cursor-pointer flex items-center">
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
                  <span className="ml-2 text-sm text-gray-500">
                    {formData.attachments.length}/5 archivos seleccionados
                  </span>
                </div>

                {errors.attachments && (
                  <p className="text-[#F90000] mt-2">{errors.attachments}</p>
                )}

                {formData.attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Archivos seleccionados:</p>
                    <ul className="mt-2 space-y-2">
                      {formData.attachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                          <span>
                            {file.name || file} - {file.size ? `${(file.size / 1024).toFixed(2)}KB` : ""}
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

              </div>
            </div>

            <div className="flex gap-4 justify-end mt-8">
              <button
                type="button"
                onClick={() => navigate("/gestionDatos/users")}
                className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#67f0dd] border border-gray-300 rounded px-8 py-2 text-sm cursor-pointer hover:bg-[#5acbbb] transition-colors"
              >
                Actualizar
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center text-gray-500">Cargando datos del usuario...</p>
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
    </div>
  );
};

export default UpdateInformation;