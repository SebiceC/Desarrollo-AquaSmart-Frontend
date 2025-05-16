import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../../../components/NavBar';
import Modal from '../../../components/Modal';
import BackButton from '../../../components/BackButton';
import axios from 'axios';

const ReportesSolicitudesDetails = () => {
  const [loading, setLoading] = useState(true);
  const [reporteSolicitud, setReporteSolicitud] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [errorModalTitle, setErrorModalTitle] = useState('ERROR');

  const { id_reportes_solicitudes } = useParams();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_APP_API_URL;

  const showError = (message, title = 'ERROR') => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setShowErrorModal(true);
  };

  const fetchReporteData = useCallback(async () => {
    try {
      if (!id_reportes_solicitudes || id_reportes_solicitudes === 'undefined') {
        showError(`ID de reporte/solicitud no válido o no especificado.`);
        return;
      }

      const reporteIdNumerico = parseInt(id_reportes_solicitudes, 10);
      if (isNaN(reporteIdNumerico)) {
        showError(`ID de reporte/solicitud inválido: ${id_reportes_solicitudes}`);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showError('No hay una sesión activa. Por favor, inicie sesión.', 'Error de autenticación');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/communication/my/requests-and-reports/${reporteIdNumerico}`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.data) {
        showError(`No se encontró el reporte/solicitud con ID ${id_reportes_solicitudes}.`);
        setReporteSolicitud(null);
        return;
      }

      setReporteSolicitud(response.data);
    } catch (err) {
      // console.error("Error al obtener los datos del reporte/solicitud:", err);
      if (err.response?.status === 401) {
        showError('Las credenciales de autenticación no se proveyeron. Por favor, inicie sesión.', 'Error de autenticación');
        navigate('/login');
      } else {
        showError("Fallo en la conexión, intente de nuevo más tarde o contacte con soporte técnico");
      }
      setReporteSolicitud(null);
    }
  }, [API_URL, id_reportes_solicitudes, navigate]);

  useEffect(() => {
    setLoading(true);
    fetchReporteData().finally(() => setLoading(false));
  }, [fetchReporteData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderWaterSupplyFailureDetails = (reporteSolicitud) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Detalles del Fallo en el Suministro del Agua</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">ID</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.id}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Predio</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.plot || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Lote</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.lot || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Estado</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.status}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Observaciones</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.observations || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Fecha de Creación</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{formatDate(reporteSolicitud.created_at)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Fecha de Finalización</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.finalized_at ? formatDate(reporteSolicitud.finalized_at) : 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderReportDetails = (reporteSolicitud) => {
    if (reporteSolicitud.failure_type === 'Fallo en el Suministro del Agua') {
      return renderWaterSupplyFailureDetails(reporteSolicitud);
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Detalles del Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">ID</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.id}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Tipo</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.type}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Creado por</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.created_by}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Tipo de Fallo</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.failure_type}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Estado</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.status}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Observaciones</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.observations}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Fecha de Creación</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{formatDate(reporteSolicitud.created_at)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Fecha de Finalización</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.finalized_at ? formatDate(reporteSolicitud.finalized_at) : 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderRequestDetails = (reporteSolicitud) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Detalles de la Solicitud</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Creado por</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.created_by}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Predio</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">
              {reporteSolicitud.lot ? 'PR-' + reporteSolicitud.lot.slice(0, 7) : 'N/A'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Lote</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.lot}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Tipo de Solicitud</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.flow_request_type}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Flujo Solicitado</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.requested_flow || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">¿Aprobado?</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.is_approved ? 'Sí' : 'No'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">¿Requiere Delegación?</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.requires_delegation ? 'Sí' : 'No'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Estado</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.status}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Observaciones</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{reporteSolicitud.observations}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Fecha de Finalización</h4>
            <p className="text-sm sm:text-base text-gray-800 mt-1">{formatDate(reporteSolicitud.finalized_at)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16 md:py-20">
      <NavBar />
      <div className="w-full px-4 mx-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-center my-6 sm:my-8 md:my-10 text-base sm:text-lg md:text-xl font-semibold">
            {reporteSolicitud ? (
              <>
                {reporteSolicitud.type || reporteSolicitud.tipo} - {reporteSolicitud.code || `ID: ${reporteSolicitud.id}`}
              </>
            ) : (
              `Reporte/Solicitud ${id_reportes_solicitudes}`
            )}
          </h1>

          <Modal
            showModal={showErrorModal}
            onClose={() => {
              setShowErrorModal(false);
              if (errorModalTitle === 'Acceso denegado') {
                navigate('/reportes-y-novedades/mis-reportes-solicitudes');
              }
            }}
            title={errorModalTitle}
            btnMessage="Entendido"
          >
            <p>{errorModalMessage}</p>
          </Modal>

          {loading && (
            <div className="flex justify-center items-center py-8 sm:py-10 md:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-sm sm:text-base text-gray-600">Cargando datos del reporte/solicitud...</span>
            </div>
          )}

          {!loading && reporteSolicitud && (
            <div className="flex flex-col space-y-4">
              {reporteSolicitud.type === 'Reporte' ? (
                renderReportDetails(reporteSolicitud)
              ) : (
                renderRequestDetails(reporteSolicitud)
              )}

              {reporteSolicitud.is_approved ? (
                <div className="bg-green-50 rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-green-700 mb-3">Estado de Aprobación</h3>
                  <p className="text-sm sm:text-base text-green-700 whitespace-pre-wrap">
                    Su petición fue aceptada con éxito.
                  </p>
                </div>
              ) : (
                reporteSolicitud.is_approved === false && reporteSolicitud.status !== 'Pendiente' && (
                  <div className="bg-red-50 rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-red-700 mb-3">Estado de Rechazo</h3>
                    <p className="text-sm sm:text-base text-red-700 whitespace-pre-wrap">
                      {reporteSolicitud.observations || 'No se proporcionaron observaciones al momento de rechazar la petición.'}
                    </p>
                  </div>
                )
              )}

              {reporteSolicitud.status !== 'Finalizado' && (
                <div className="bg-yellow-50 rounded-lg shadow-md overflow-hidden p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-yellow-700 mb-3">Estado Pendiente</h3>
                  <p className="text-sm sm:text-base text-yellow-700 whitespace-pre-wrap">
                    Esta solicitud aún no ha sido finalizada. Por favor, espere a que se complete el proceso.
                  </p>
                </div>
              )}

              <BackButton 
                to="/reportes-y-novedades/mis-reportes-solicitudes" 
                text="Volver a mis reportes y solicitudes" 
                className="bg-blue-500 text-white hover:bg-blue-600 w-auto px-4 py-2" 
              />
            </div>
          )}

          {!loading && !reporteSolicitud && (
            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">No se encontró el reporte/solicitud</h2>
              <p className="text-gray-500 text-center mb-6">No pudimos encontrar el reporte o solicitud con el ID especificado.</p>
              <BackButton 
                to="/reportes-y-novedades/mis-reportes-solicitudes" 
                text="Volver a mis reportes y solicitudes" 
                className="bg-blue-500 text-white hover:bg-blue-600" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportesSolicitudesDetails;