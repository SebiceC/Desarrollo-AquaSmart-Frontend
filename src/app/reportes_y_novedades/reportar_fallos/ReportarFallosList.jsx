import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../../components/NavBar'
import DataTable from '../../../components/DataTable'
import ReportFailureModal from './ReportFailureModal'
import Modal from '../../../components/Modal'

const ReportarFallosList = () => {
    const navigate = useNavigate();
    const [showReportModal, setShowReportModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const API_URL = import.meta.env.VITE_APP_API_URL;
    
    const [items, setItems] = useState([
        { id: 1, nombre: 'Reporte de fallos en el aplicativo', tipo: 'reporte' },
        { id: 2, nombre: 'Reporte de fallos en el suministro de agua', tipo: 'reporte' },
    ]);
    
    // Función para mostrar mensajes de éxito usando el modal
    const handleRequestSuccess = (message) => {
        setModalMessage(message);
        setShowModal(true);
    };
    
    const getColumns = () => [
        {
            key: "nombre",
            label: "Nombre",
        },
        {
            key: "tipo",
            label: "Tipo",
            render: (item) => {
                const isReport = item.tipo === 'reporte';
                const statusClass = isReport
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-green-100 text-green-800 border border-green-200";

                return (
                    <span className={`flex justify-center items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} w-24`}>
                        {isReport ? "Reporte" : "Solicitud"}
                    </span>
                );
            }
        },
    ];

    const handleConsult = (item) => {
        if (item.id === 1) {
            // Mostrar modal para reporte de fallos en aplicativo
            setShowReportModal(true);
        } else if (item.id === 2) {
            // Navegar a la página de fallos en suministro de agua
            navigate('/reporte-fallos-suministro');
        }
    };

    const customStyles = {
        tableStyles: "",
        tableHeadStyles: "",
        tableBodyStyles: "",
        tableRowStyles: "",
        tableCellStyles: "",
        actionCellStyles: "flex justify-center items-center"
    };

    return (
        <div>
            <NavBar />
            <div className="container mx-auto p-4 md:p-8 lg:p-20">
                <h1 className="text-center my-10 text-lg md:text-2xl font-bold mb-6">
                    REPORTE DE FALLOS
                </h1>

                {/* DataTable con los reportes y solicitudes */}
                <DataTable
                    columns={getColumns()}
                    data={items}
                    emptyMessage="No hay reportes o solicitudes disponibles."
                    actions={true}
                    onReport={handleConsult}
                    customStyles={customStyles}
                />
                
                {/* Modal de mensajes (éxito o error) */}
                {showModal && (
                    <Modal
                        showModal={showModal}
                        onClose={() => setShowModal(false)}
                        title={
                            modalMessage.includes("correctamente")
                                ? "Éxito"
                                : modalMessage.includes("inactivo")
                                    ? "Advertencia"
                                    : "Error"
                        }
                        btnMessage="Cerrar"
                    >
                        <p>{modalMessage}</p>
                    </Modal>
                )}
                
                {/* Modal de reporte de fallos */}
                <ReportFailureModal 
                    showModal={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    onSuccess={handleRequestSuccess}
                    API_URL={API_URL}
                />
            </div>
        </div>
    )
}

export default ReportarFallosList