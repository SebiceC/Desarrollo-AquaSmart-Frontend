import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import Base64Decoder from '../../components/Base64Decoder';
import BackButton from '../../components/BackButton';
import axios from 'axios';
import Modal from '../../components/Modal';

const FacturaLoteDetails = () => {
  // Estados para la funcionalidad
  const [loading, setLoading] = useState(true);
  const [factura, setFactura] = useState(null);
  
  // Estados para modales de error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [errorModalTitle, setErrorModalTitle] = useState('ERROR');
  
  // Estado para controlar si el PDF se puede visualizar/descargar
  const [canRenderPdf, setCanRenderPdf] = useState(true);

  // Obtener el ID de la factura de la URL
  const { id_bill } = useParams();
  const location = useLocation();
  const { lote } = useParams();
  
  // Verificación de depuración
  console.log("ID de factura recibido (params):", id_bill);
  console.log("URL completa:", location.pathname);

  // URL de la API
  const API_URL = import.meta.env.VITE_APP_API_URL;

  // Función para mostrar modal de error
  const showError = (message, title = 'ERROR') => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setShowErrorModal(true);
  };

  // Función para cargar la factura específica
  const fetchFactura = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showError('No hay una sesión activa. Por favor, inicie sesión.', 'Error de autenticación');
        return;
      }

      // Verificar que id_bill no sea undefined
      if (!id_bill || id_bill === 'undefined') {
        showError(`ID de factura no válido o no especificado.`);
        setLoading(false);
        return;
      }

      // Asegurarnos de que id_bill sea un número entero
      const billIdNumerico = parseInt(id_bill, 10);
      
      if (isNaN(billIdNumerico)) {
        showError(`ID de factura inválido: ${id_bill}`);
        setLoading(false);
        return;
      }

      console.log("Realizando petición a:", `${API_URL}/billing/bills/${billIdNumerico}`);
      
      // Endpoint para obtener la factura específica por ID
      const response = await axios.get(`${API_URL}/billing/bills/${billIdNumerico}`, {
        headers: { Authorization: `Token ${token}` },
      });

      // Verificar si hay datos de factura
      if (!response.data) {
        showError(`No se encontró la factura con ID ${id_bill}.`);
        setFactura(null);
      } else {
        setFactura(response.data);
        
        // Verificar si hay datos del PDF (base64)
        if (!response.data.pdf_base64 || response.data.pdf_base64.trim() === '') {
          setCanRenderPdf(false);
          showError('Error al generar el pdf. Por favor, intente de nuevo o contacte al soporte técnico.', 'ERROR');
        }
      }
    } catch (error) {
      console.error('Error al obtener la factura:', error);
      
      // Personalizar mensaje de error
      const errorMessage = error.response?.status === 404 
        ? `No se encontró la factura con ID ${id_bill}.`
        : error.response?.data?.message || 'Error al cargar la factura. Por favor, intente de nuevo.';
      
      showError(errorMessage);
      setFactura(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL, id_bill]);

  // Cargar factura al montar el componente
  useEffect(() => {
    fetchFactura();
  }, [fetchFactura]);

  // Callback cuando el PDF ha sido decodificado
  const handleDataDecoded = useCallback((url, errorMsg) => {
    if (errorMsg) {
      setCanRenderPdf(false);
      showError(`Error al decodificar PDF: ${errorMsg}`, 'ERROR');
    }
  }, []);

  // Función para manejar error en la visualización del PDF
const handlePdfLoadError = () => {
  setCanRenderPdf(false);
  showError('Error al cargar el PDF. Por favor, intente de nuevo o contacte al soporte técnico.', 'ERROR');
};

  // Función para intentar descargar
  const handleDownloadAttempt = () => {
    if (!canRenderPdf) {
      showError('Error al descargar la factura. Por favor, intente de nuevo o contacte al soporte técnico.', 'ERROR');
      return false;
    }
    return true;
  };


  // Obtener el nombre del PDF
  const getPdfName = () => {
    if (factura && factura.pdf_bill_name) {
      return `${factura.pdf_bill_name}.pdf`;
    }
    return `factura_${id_bill}.pdf`;
  };

  // Formatear número como moneda en COP
  const formatCurrency = (value) => {
    if (!value) return '$0';
    
    const numValue = parseFloat(value);
    return `$${numValue.toLocaleString('es-CO')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <NavBar />
      
      <div>
        <div className="container mx-auto p-4 md:p-8 lg:p-0">
          <h1 className="text-center my-10 text-lg md:text-xl font-semibold mb-6">
            Factura {factura?.code || id_bill} - Lote {factura?.lot_code || lote}
          </h1>

          {/* Modal de errores unificado */}
          <Modal
            showModal={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            title={errorModalTitle}
            btnMessage="Entendido"
          >
            <p>{errorModalMessage}</p>
          </Modal>
          
          {/* Estado de carga */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Cargando factura...</span>
            </div>
          )}

          {/* Visualizador de factura */}
          {!loading && factura && (
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  {getPdfName()}
                </h3>
              </div>
              
              {/* Base64 Decoder (invisible) */}
              <Base64Decoder 
                base64Data={factura.pdf_base64} 
                onDataDecoded={handleDataDecoded} 
              />
              
              {/* Estado de la factura - Mantenemos la tabla original */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4 mb-4 overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-100">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {factura?.id_bill || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        {factura?.status && (
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                            ${factura.status.toLowerCase() === 'pendiente' ? 'bg-fuchsia-100 text-fuchsia-800' : ''} 
                            ${factura.status.toLowerCase() === 'validada' ? 'bg-blue-100 text-blue-800' : ''} 
                            ${factura.status.toLowerCase() === 'pagada' ? 'bg-green-100 text-green-800' : ''} 
                            ${factura.status.toLowerCase() === 'vencida' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {factura.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PDF Viewer */}
              <div className="border rounded-lg w-full h-screen bg-gray-100 relative">
                {canRenderPdf ? (
                  <iframe 
                    src={`data:application/pdf;base64,${factura.pdf_base64}`}
                    title={getPdfName()}
                    width="100%" 
                    height="100%" 
                    className="rounded-lg"
                    style={{ border: 'none' }}
                    onError={handlePdfLoadError}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-lg text-center font-medium text-gray-800">No se puede visualizar el PDF</p>
                    <p className="text-center text-gray-600">El documento no puede ser mostrado</p>
                    <button
                      onClick={() => {
                        setCanRenderPdf(true);
                        fetchFactura();
                      }}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Intentar cargar de nuevo
                    </button>
                  </div>
                )}
              </div>
              
              {/* Total a pagar y botones */}
              <div className="flex flex-col bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-semibold text-gray-800 mr-2">Total a pagar:</h3>
                      <span className="text-xl font-bold text-blue-800">{formatCurrency(factura?.total_amount)}</span>
                    </div>
                    <div className="mt-2">
                      <BackButton to="/facturacion/historial-facturas-lote" text="Regresar a la lista de facturas" className="hover:bg-blue-50" />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    {canRenderPdf ? (
                      <button
                        onClick={() => {
                          if (handleDownloadAttempt()) {
                            const downloadBtn = document.createElement('a');
                            downloadBtn.href = `data:application/pdf;base64,${factura.pdf_base64}`;
                            downloadBtn.download = getPdfName();
                            downloadBtn.click();
                          }
                        }}
                        className="bg-[#365486] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#344663] hover:scale-105 w-full lg:w-auto"
                      >
                        Descargar PDF
                      </button>
                    ) : (
                      <button 
                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-full cursor-not-allowed"
                        onClick={() => showError('No se puede descargar el PDF debido a un error en el formato.', 'Error de descarga')}
                      >
                        Descargar PDF
                      </button>
                    )}
                    
                    {factura?.status?.toLowerCase() === 'pagada' || !canRenderPdf ? (
                      <button 
                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-full cursor-not-allowed"
                        onClick={!canRenderPdf && factura?.status?.toLowerCase() !== 'pagada' ? 
                          () => showError("No se puede proceder con el pago debido a un error con el documento de la factura.", "Error de pago") 
                          : undefined}
                        disabled={factura?.status?.toLowerCase() === 'pagada'}
                      >
                        {factura?.status?.toLowerCase() === 'pagada' ? 'Pagado' : 'Pagar'}
                      </button>
                    ) : (
                      <button 
                        className="bg-[#365486] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#344663] hover:scale-105 w-full lg:w-auto"
                        onClick={() => navigate('/facturacion/pagar')}
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacturaLoteDetails;