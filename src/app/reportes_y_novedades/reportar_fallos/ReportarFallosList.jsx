import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../../components/NavBar'
import DataTable from '../../../components/DataTable'

const ReportarFallosList = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([
        { id: 1, nombre: 'Reporte de fallos en el aplicativo', tipo: 'reporte' },
        { id: 2, nombre: 'Reporte de fallos en el suministro de agua', tipo: 'reporte' },

    ]);
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
        if (item.tipo === 'reporte') {
            // Navegar a la página de solicitudes de lotes
            navigate('');
        } else {
            // Navegar a la página de lotes pero en modo reporte
            navigate('');
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
            </div>
        </div>
    )
}

export default ReportarFallosList
