import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputItem from "../../../../components/InputItem";
import { validateField } from "../../../../components/ValidationRules";
import Modal from "../../../../components/Modal";
import NavBar from "../../../../components/NavBar";

const UserUpdateInformation = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL;

  const navigate = useNavigate();

  const [user, setUser] = useState(null); // Estado para almacenar los datos del usuario
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showErrorModal2, setShowErrorModal2] = useState(false);
  const [error, setError] = useState(null); // Estado para manejar errores

  // Obtener datos del usuario
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No hay sesión activa.");
          return;
        }

        // Primera petición: Obtener perfil del usuario
        const profileResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Token ${token}` },
        });

        const userData = profileResponse.data;

        const permissionsResponse = await axios.get(
          `${API_URL}/admin/users/${userData.document}/permissions`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        // Extraer el role desde los permisos (ajusta esto según la estructura de la respuesta)
        const role = permissionsResponse.data.role || "Sin rol asignado";

        // Actualizar el estado del usuario incluyendo el role obtenido
        setUser({ ...userData, role });

        // Actualizar el estado del formulario
        setFormData({
          email: userData.email || "",
          phone: userData.phone || "",
        });
      } catch (err) {
        setShowErrorModal2(true);
      }
    };

    if (API_URL) {
      fetchProfile();
    }
  }, [API_URL]);

  // Manejar cambios en los campos editables
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validar solo los campos editables
    if (["email", "phone"].includes(name)) {
      const fieldErrors = validateField(name, value, formData);
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || "" }));
    }
  };

  // Manejar la actualización del perfil
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa.");
        return;
      }

      await axios.patch(
        `${API_URL}/users/profile/update`,
        { email: formData.email, phone: formData.phone },
        { headers: { Authorization: `Token ${token}` } }
      );

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

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-xl font-medium mb-8 my-10 text-center">
          Mis Datos Personales
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {user ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Columna izquierda - Datos bloqueados */}
              <div className="space-y-4">
                <InputItem
                  label="Rol"
                  name="role"
                  placeholder={user?.role}
                  disabled
                />
                <InputItem
                  label="Nombre"
                  name="first_name"
                  placeholder={user.first_name}
                  disabled
                />
                <InputItem
                  label="Cédula"
                  name="document"
                  placeholder={user.document}
                  disabled
                />

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
                  <p className="text-sm font-medium mb-2">
                    Documentos actuales:
                  </p>
                  <ul className="space-y-1">
                    {user.attachments?.map((doc, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        <a
                          href={`https://drive.google.com/drive/u/1/folders/${user.folder_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {doc}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Columna derecha - Campos editables */}
              <div className="space-y-4">
                <InputItem
                  label="Tipo de Persona"
                  name="person_type"
                  placeholder={user.person_type_name}
                  disabled
                />

                <InputItem
                  label="Apellidos"
                  name="last_name"
                  placeholder={user.last_name}
                  disabled
                />

                <InputItem
                  label="Teléfono"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  placeholder="Ej: 3201234567"
                  maxLength={13}
                  required
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4 justify-end mt-8">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
              >
                Salir
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
        onClose={() => setShowErrorModal2(false)}
        title="Error"
        btnMessage="Aceptar"
      >
        <p>Error al cargar los datos</p>
      </Modal>
    </div>
  );
};

export default UserUpdateInformation;
