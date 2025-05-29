import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputItem from "../../../../components/InputItem";
import { validateField } from "../../../../components/ValidationRules";
import Modal from "../../../../components/Modal";
import NavBar from "../../../../components/NavBar";
import BackButton from "../../../../components/BackButton";
import { KeyRound } from "lucide-react";
import Footer from "../../../../components/Footer";

const UserUpdateInformation = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showErrorModal2, setShowErrorModal2] = useState(false);
  const [showNoChangesModal, setShowNoChangesModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No hay sesión activa.");
          return;
        }

        // Paso 1: Obtener perfil del usuario
        const profileResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Token ${token}` },
        }).catch(profileError => {
          console.error("Error al obtener perfil:", profileError);
          setError("Error al obtener perfil.");
          throw profileError;
        });

        const userData = profileResponse.data;

        // Paso 2: Obtener permisos del usuario
        let role = "Sin rol asignado";
        try {

          const permissionsResponse = await axios.get(`${API_URL}/admin/users/${userData.document}/permissions`, {
            headers: { Authorization: `Token ${token}` },
          });

          if (permissionsResponse.data?.Permisos_Rol) {
            const roles = Object.keys(permissionsResponse.data.Permisos_Rol);
            if (roles.length > 0) {
              role = roles.join(', ');
            }
          } else {
            console.warn("No se encontraron roles en la respuesta de permisos.");
          }
        } catch (permissionsError) {
          console.warn("No se pudieron obtener los permisos:", permissionsError);
        }

        const userWithRole = { ...userData, role };
        setUser(userWithRole);

        setFormData({
          email: userData.email || "",
          phone: userData.phone || "",
        });

      } catch (err) {
        console.error("Error al cargar datos:", err);
        setShowErrorModal2(true);
      }
    };

    if (API_URL) {
      fetchProfile();
    }
  }, [API_URL]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (["email", "phone"].includes(name)) {
      const fieldErrors = validateField(name, value, formData);
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Crear un objeto con solo los campos modificados
    const changedFields = {};

    if (formData.email !== user.email) {
      changedFields.email = formData.email;
    }

    if (formData.phone !== user.phone) {
      changedFields.phone = formData.phone;
    }

    // Validar si no hay cambios
    if (Object.keys(changedFields).length === 0) {
      setShowNoChangesModal(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa.");
        return;
      }

      // Enviar solo los campos que cambiaron
      const response = await axios.patch(
        `${API_URL}/users/profile/update`,
        changedFields,
        { headers: { Authorization: `Token ${token}` } }
      );

      // Actualizar el objeto de usuario con los nuevos valores
      setUser(prev => ({
        ...prev,
        ...changedFields
      }));

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error en la actualización:", error);
      setShowErrorModal(true);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="bg-[#DCF2F1] py-4">
        <NavBar />
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-xl font-medium mb-8 my-10 text-center">
          Mis Datos Personales
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {user ? (
          <form className="flex flex-col items-center justify-center" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <InputItem label="Rol" name="role" placeholder={user?.role} disabled />
                <InputItem label="Nombre" name="first_name" placeholder={user.first_name} disabled />
                <InputItem label="Cédula" name="document" placeholder={user.document} disabled />

                <InputItem
                  label="Correo electrónico"
                  type="email"
                  name="email"
                  placeholder="xxxxxx@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  maxLength={50}
                />

                

                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Documentos actuales:</p>
                  <div className="space-y-1">
                    <div className="mt-2 space-y-2">
                      {user.drive_folder_id ? (
                        <a
                          href={`https://drive.google.com/drive/u/1/folders/${user.drive_folder_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border-blue-800 text-blue-800 hover:bg-blue-100 rounded-lg transition-colors border"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Ver documentos en Google Drive
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No hay documentos disponibles.</p>
                      )}

                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <InputItem
                  label="Tipo de Persona"
                  name="person_type"
                  placeholder={user.person_type_name}
                  disabled
                />

                <InputItem label="Apellidos" name="last_name" placeholder={user.last_name} disabled />

                <InputItem
                  label="Teléfono"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  placeholder="Ej: 3201234567"
                  maxLength={10}
                  required
                />

                <button
                  className=" flex items-center justify-center gap-5 border-2 border-[#365486] text-[#365486] hover:bg-[#d2e2ff] font-medium py-3 px-6 rounded-lg transition-all duration-200"
                      onClick={() => {navigate('/seguridad/actualizar-contrasena')}}
                >
                  <KeyRound className="mr-2" />
                  Actualizar Contraseña
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-10 mt-8 w-full justify-center ">
              <BackButton to="/perfil" text="Regresar" />

              <button
                type="submit"
                className="bg-[#365486] border border-gray-300 rounded-lg px-8 py-2 text-md text-white  cursor-pointer hover:bg-[#364660] transition-colors"
              >
                Actualizar
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center text-gray-500">Cargando datos...</p>
        )}
      </div>

      {/* Modales */}
      <Modal
        showModal={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Actualización Exitosa"
        btnMessage="Aceptar"
      >
        <p>Tus datos se han actualizado correctamente.</p>
      </Modal>

      <Modal
        showModal={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        btnMessage="Aceptar"
      >
        <p>Error al guardar los cambios</p>
      </Modal>

      <Modal
        showModal={showErrorModal2}
        onClose={() => {
          setShowErrorModal2(false);
          navigate("/home");
        }}
        title="Error"
        btnMessage="Aceptar"
      >
        <p>Error al cargar los datos</p>
      </Modal>

      {/* Nuevo Modal para formulario sin cambios */}
      <Modal
        showModal={showNoChangesModal}
        onClose={() => setShowNoChangesModal(false)}
        title="Formulario sin cambios"
        btnMessage="Aceptar"
      >
        <p>No se realizó ningún cambio en su información personal.</p>
      </Modal>
      <Footer />
    </div>
  );
};

export default UserUpdateInformation;