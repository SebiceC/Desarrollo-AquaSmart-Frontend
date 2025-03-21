import { useState, useEffect } from "react";
import NavBar from "../../../components/NavBar";
import Modal from "../../../components/Modal";
import InputItem from "../../../components/InputItem";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, AlertCircle } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_APP_API_URL;

const DispositivoEdit = () => {
  const { iot_id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    id_plot: "",
    device_type_name: "",  
    iot_id: "",
    is_active: true, // true por defecto
    characteristics: "",
  });

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({
    id_plot: "",
    characteristics: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage("No se encontró un token de autenticación.");
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/iot/device-types`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
        setDeviceTypes(response.data);  
      } catch (error) {
        console.error("Error al obtener los tipos de dispositivos:", error);
      } finally {
        setLoading(false); 
      }
    };

    const fetchDevice = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/iot/iot-devices/${iot_id}`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
        setFormData({
          name: response.data.name || "",
          id_plot: response.data.id_plot || "",
          device_type_name: response.data.device_type_name || "", 
          iot_id: response.data.iot_id || "",
          is_active: response.data.is_active === true || response.data.is_active === "true", 
          characteristics: response.data.characteristics || "",
        });
      } catch (error) {
        setErrorMessage("No se pudo cargar la información del dispositivo.");
        setShowSuccessModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
    fetchDevice(); 
  }, [iot_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));

    setErrorMessage("");

    if (name === "id_plot" && value && !value.startsWith("PR-")) {
      setFieldErrors((prev) => ({
        ...prev,
        id_plot: "ERROR: El ID del predio debe comenzar con 'PR-'",
      }));
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        id_plot: "",
      }));
    }

    if (name === "characteristics" && value.length > 300) {
      setFieldErrors((prev) => ({
        ...prev,
        characteristics: "ERROR: El campo excede la cantidad de caracteres permitida.",
      }));
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        characteristics: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
  
    // Validar campos obligatorios
    const requiredFields = ["name", "id_plot", "device_type_name", "is_active", "characteristics"];
    requiredFields.forEach((field) => {
      // Verificar si el campo es una cadena antes de aplicar trim()
      if (typeof formData[field] === 'string' && !formData[field].trim()) {
        newErrors[field] = "Este campo es obligatorio";
        isValid = false;
      }
      // Otras validaciones para campos no string
      if (field === "device_type_name" && !formData[field]) {
        newErrors[field] = "Este campo es obligatorio";
        isValid = false;
      }
    });
  
    // Validación de ID del predio
    if (formData.id_plot && !formData.id_plot.startsWith("PR-")) {
      newErrors.id_plot = "El ID del predio debe comenzar con 'PR-'";
      isValid = false;
    }
  
    // Validación de características
    if (formData.characteristics && formData.characteristics.length > 300) {
      newErrors.characteristics = "Las características no deben exceder 300 caracteres";
      isValid = false;
    }
  
    setErrors(newErrors);
    return isValid;
  };  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const isActive = formData.is_active; // Mantenerlo como booleano

      const response = await axios.patch(
        `${API_URL}/iot/iot-devices/${iot_id}/update`,
        {
          name: formData.name,
          id_plot: formData.id_plot,
          device_type_name: formData.device_type_name,
          iot_id: formData.iot_id || null,
          is_active: isActive,
          characteristics: formData.characteristics,
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const newErrors = {};
        if (error.response.data.id_plot) {
          newErrors.id_plot = " ";
          setErrorMessage(`ERROR: ${error.response.data.id_plot[0]}`);
        }
        if (error.response.data.iot_id) {
          newErrors.iot_id = " ";
          setErrorMessage(`ERROR: ${error.response.data.iot_id[0]}`);
        }
        if (error.response.data.name) {
          newErrors.name = " ";
          setErrorMessage(`ERROR: ${error.response.data.name[0]}`);
        }
        if (error.response.data.device_type_name) {
          newErrors.device_type_name = " ";
          setErrorMessage(`ERROR: ${error.response.data.device_type_name[0]}`);
        }
        if (error.response.data.characteristics) {
          newErrors.characteristics = " ";
          setErrorMessage(`ERROR: ${error.response.data.characteristics[0]}`);
        }
        if (error.response.data.non_field_errors) {
          setErrorMessage(error.response.data.non_field_errors[0]);
        }

        setErrors(newErrors);
      } else {
        setErrorMessage("Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <h2 className="text-center text-2xl font-bold mb-6 mt-20">Actualización de Dispositivo IoT</h2>
        <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-md">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputItem
              label="Nombre del Dispositivo"
              type="text"
              name="name"
              placeholder="Ej: Válvula principal"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />

            <div className="flex flex-col">
              <label htmlFor="id_plot" className="block text-sm mb-2">
                Predio a asignar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="id_plot"
                name="id_plot"
                placeholder="Ej: PR-001"
                value={formData.id_plot}
                onChange={handleChange}
                className={`w-full border ${errors.id_plot || fieldErrors.id_plot ? "border-red-500" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                required
              />
              {errors.id_plot && <div className="h-1 bg-red-500 mt-1 rounded-full"></div>}
              {fieldErrors.id_plot && renderFieldError(fieldErrors.id_plot)}
            </div>

            <div className="flex flex-col">
              <label htmlFor="device_type_name" className="block text-sm mb-2">
                Tipo de Dispositivo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="device_type_name"
                  name="device_type_name"
                  value={formData.device_type_name}
                  onChange={handleChange}
                  className={`w-full border appearance-none ${errors.device_type_name ? "border-red-500" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                  required
                >
                  <option value="">SELECCIÓN DE TIPO DE DISPOSITIVO</option>
                  {loading ? (
                    <option>Loading...</option>
                  ) : (
                    deviceTypes.map((device, index) => (
                      <option key={index} value={device.device_id}>
                        {device.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              {errors.device_type_name && <div className="h-1 bg-red-500 mt-1 rounded-full"></div>}
            </div>

            <InputItem
              label="Lote a asignar (Opcional)"
              type="text"
              name="iot_id"
              placeholder="Ej: Lote1"
              value={formData.iot_id}
              onChange={handleChange}
              error={errors.iot_id}
            />

            <div className="flex flex-col">
              <label htmlFor="is_active" className="block text-sm mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="is_active"
                  name="is_active"
                  value={formData.is_active}  // Asegurarse que se pase como booleano
                  onChange={handleChange}
                  className={`w-full border appearance-none ${errors.is_active ? "border-red-500" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                  required
                >
                  <option value={true}>Activo</option>
                  <option value={false}>Inactivo</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              {errors.is_active && <div className="h-1 bg-red-500 mt-1 rounded-full"></div>}
            </div>

            <div className="flex flex-col col-span-1 md:col-span-2">
              <label htmlFor="characteristics" className="block text-sm mb-2">
                Características <span className="text-red-500">*</span>
              </label>
              <textarea
                id="characteristics"
                name="characteristics"
                value={formData.characteristics}
                onChange={handleChange}
                placeholder="Escribe la descripción aquí!"
                className={`w-full border resize-none h-24 ${errors.characteristics || fieldErrors.characteristics ? "border-red-500" : "border-gray-300"} rounded px-3 py-2 focus:outline-none`}
                maxLength={300}
                required
              />
              <div
                className={`text-xs ${formData.characteristics.length > 280 ? "text-amber-500" : "text-gray-400"} ${formData.characteristics.length >= 300 ? "text-red-600" : ""} text-right mt-1`}
              >
                {formData.characteristics.length}/300 caracteres
              </div>
              {errors.characteristics && <div className="h-1 bg-red-500 mt-1 rounded-full"></div>}
              {fieldErrors.characteristics && renderFieldError(fieldErrors.characteristics)}
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col items-start">
              {errorMessage && <p className="text-red-600 text-sm mb-3">{errorMessage}</p>}
              <button type="submit" className="bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
                Registrar
              </button>
            </div>
          </form>
        </div>

        {/* Modal de éxito */}
        <Modal
          showModal={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate("/home");
          }}
          title="Registro Exitoso"
          btnMessage="Aceptar"
        >
          <p>El dispositivo IoT ha sido registrado con éxito.</p>
        </Modal>
      </div>
    </div>
  );
};

export default DispositivoEdit;
