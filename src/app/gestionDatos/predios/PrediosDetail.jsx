"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../../../components/NavBar";
import BackButton from "../../../components/BackButton";
import Modal from "../../../components/Modal";
import ErrorDisplay from "../../../components/error-display";
import DataTable from "../../../components/DataTable";
import axios from "axios";

const PrediosDetail = () => {
  const { id_plot } = useParams();
  const navigate = useNavigate();
  const [predio, setPredio] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("Información");

  useEffect(() => {
    const fetchPredioData = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_APP_API_URL;

        const predioResponse = await axios.get(
          `${API_URL}/plot-lot/plots/${id_plot}`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        
        setPredio(predioResponse.data);
        
        if (predioResponse.data.lotes && Array.isArray(predioResponse.data.lotes)) {
          setLotes(predioResponse.data.lotes);
        } else {
          setLotes([]);
          if (predioResponse.data.lotes === undefined || predioResponse.data.lotes.length === 0) {
            setModalTitle("Información");
            setModalMessage("Este predio no tiene lotes registrados actualmente.");
            setShowModal(true);
          }
        }
      } catch (err) {
        console.error("Error al obtener los datos del predio:", err);
        
        let errorMessage = "Error al obtener los datos del predio o lotes.";

        if (err.response) {
          if (err.response.status === 403) {
            errorMessage = "No tiene permisos para acceder a este predio.";
            if (err.response.data?.detail) {
              errorMessage = err.response.data.detail;
            }
          } else if (err.response.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data?.message) {
            errorMessage = err.response.data.message;
          }
          
          console.log("Código de estado:", err.response.status);
          console.log("Mensaje de error:", errorMessage);
        } else if (err.request) {
          errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet.";
        } else {
          errorMessage = `Error de configuración: ${err.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPredioData();
  }, [id_plot]);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha no disponible";
    }
  };

  // Definición de columnas para la tabla de lotes
  const lotesColumns = [
    {
      key: "id_lot",
      label: "ID Lote",
    },
    {
      key: "crop_type",
      label: "Tipo de cultivo",
      render: (item) => item.crop_type || "No disponible"
    },
    {
      key: "crop_variety",
      label: "Variedad de cultivo",
      render: (item) => item.crop_variety || "No disponible"
    },
    {
      key: "soil_type",
      label: "Tipo de suelo",
      render: (item) => item.soil_type || "No disponible"
    },
    {
      key: "registration_date",
      label: "Fecha de creación",
      render: (item) => formatDate(item.registration_date)
    }
  ];

  // Manejadores para las acciones de la tabla
  const handleViewLote = (lote) => {
    navigate(`/gestionDatos/lotes/${lote.id_lot}`);
  };

  const handleEditLote = (lote) => {
    navigate(`/gestionDatos/lotes/${lote.id_lot}/update`);
  };

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="max-w-7xl mx-auto p-6 mt-24 bg-white rounded-lg shadow animate-pulse">
          <h1 className="text-xl font-medium text-center mb-2 bg-gray-300 h-6 w-1/3 mx-auto rounded"></h1>
          <p className="text-sm text-gray-400 text-center mb-6 bg-gray-200 h-4 w-1/2 mx-auto rounded"></p>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="bg-gray-100 rounded-lg p-6 md:w-1/3 shadow-md">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="space-y-2 mb-4">
                  <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
                  <div className="bg-gray-200 h-6 w-full rounded"></div>
                </div>
              ))}
            </div>

            <div className="md:w-2/3">
              <div className="overflow-y-auto max-h-[350px] border-r border-gray-200 shadow-md rounded-lg">
                <div className="bg-gray-300 h-10 w-full rounded-t-lg"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-12 w-full border-t border-gray-300"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <NavBar />
        <ErrorDisplay 
          message={error} 
          backTo="/gestionDatos/predios" 
          backText="Regresar a la lista de predios" 
        />
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="flex-1 container mx-auto px-6 pb-6 max-w-7xl bg-white mt-30">
        <div className="pt-4">
          <div className="mb-5 text-center">
            <h1 className="text-2xl font-semibold text-[#365486] mb-1">Información del Predio</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            {/* Tarjeta de información del predio */}
            <div className="bg-gray-100 rounded-4xl p-10 md:w-1/3">
              <div className="space-y-3">
                <div>
                  <p className="text-md">
                    <span className="font-medium text-black">ID: </span>
                    <span className="text-gray-600 font-medium">{predio.id_plot}</span>
                  </p>
                </div>
                <div>
                  <p className="text-md">
                    <span className="font-medium text-black">Nombre: </span>
                    <span className="text-gray-600 font-medium">{predio.plot_name || "No disponible"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-md">
                    <span className="font-medium text-black">Dueño del predio: </span>
                    <span className="text-gray-600 font-medium">{predio.owner || "No disponible"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-md">
                    <span className="font-medium text-black">Extensión de tierra (m²): </span>
                    <span className="text-gray-600 font-medium">{predio.plot_extension || "No disponible"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-md">
                    <span className="font-medium text-black">Latitud: </span>
                    <span className="text-gray-600 font-medium">{predio.latitud || "No disponible"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-md">
                    <span className="font-medium text-black">Longitud: </span>
                    <span className="text-gray-600 font-medium">{predio.longitud || "No disponible"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-md">
                    <span className="font-medium text-black">Fecha de creación: </span>
                    <span className="text-gray-600 font-medium">{formatDate(predio.registration_date)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla de lotes (cultivos) usando el componente DataTable */}
            <div className="md:w-2/3">
              <div className="mt-0">
                <DataTable
                  columns={lotesColumns}
                  data={lotes}
                  emptyMessage="No hay lotes registrados para este predio."
                  onView={handleViewLote}
                  onEdit={handleEditLote}
                  actions={true}
                  showStatus={false}
                />
              </div>
              {lotes.length === 0 && (
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Puede agregar lotes desde la sección de gestión de lotes.
                </p>
              )}
            </div>
          </div>

          {/* Botón de regreso */}
          <div className="flex justify-start mt-5">
            <BackButton to="/gestionDatos/predios" text="Regresar a la lista de predios" className="hover:bg-blue-50" />
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          showModal={showModal}
          onClose={() => setShowModal(false)}
          title={modalTitle}
          btnMessage="Cerrar"
        >
          <p>{modalMessage}</p>
        </Modal>
      )}
    </div>
  );
};

export default PrediosDetail;