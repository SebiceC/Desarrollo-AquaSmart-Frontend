import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../app/auth/Login";
import PreRegister from "../app/auth/PreRegister";
import Home from "../Home";
import ForgotPassword from "../app/forgotPassword/ForgotPassword";
import RecoverPassword from "../app/forgotPassword/RecoverPassword";
import Perfil from "../app/Perfil";
import IoTControll from "../app/IoTControll";
import ProtectedRoute from "./ProtectedRoute"; // Importamos el componente de protección
import UsersList from "../app/gestionDatos/Users/UsersList";
import RegistroPredios from "../app/gestionRegistros/RegistroPredios";
import PreRegistrosList from "../app/gestionDatos/Users/PreRegistrosList";
import PreRegistroDetail from "../app/gestionDatos/Users/PreRegistroDetail";
import UserUpdateInformation from "../app/gestionDatos/Users/id/UserUpdateInformation";

import UpdateInformation from "../app/gestionDatos/UserEdit/UpdateInformation"
import PrediosList from "../app/gestionDatos/predios/PrediosList";
import UserInformation from "../app/gestionDatos/Users/id/UserInformation";
import RegistroLotes from "../app/gestionRegistros/RegistroLotes";

import UpdatedPassword from "../app/seguridad/UpdatedPassword";
import LotesList from "../app/gestionDatos/lotes/LotesList";
import LoteInformation from "../app/gestionDatos/lotes/LoteInformation";
import DispositivoIoTList from "../app/gestionDatos/dispositivosIoT/DispositivosIoTList"
import DispositivosIoTInformation from "../app/gestionDatos/dispositivosIoT/DispositivosIoTInformation";

import PrediosDetail from "../app/gestionDatos/predios/PrediosDetail";
import LoteEdit from "../app/gestionDatos/lotes/LoteEdit";
import PrediosUpdate from "../app/gestionDatos/predios/PrediosUpdate"
import RegistroDispositivosIoT from "../app/gestionRegistros/RegistroDispositivosIoT";
import PermissionsSystem from "../app/permisos/index"
import DispositivoEdit from "../app/gestionDatos/dispositivosIoT/DispositivoEdit";

import PlotLotUsers from "../app/infoprediosylotes/PlotLotUsersList";
import MiPlotLotDetail from "../app/infoprediosylotes/PlotLotUsersDetail";
import LotUsersDetail from "../app/infoprediosylotes/LotUsersDetail";

import HistorialDistrito from "../app/HistorialConsumo/HistorialDistrito";
import HistorialPredio from "../app/HistorialConsumo/HistorialPredio";
import HistorialPredioDetail from "../app/HistorialConsumo/HistorialPredioDetail";
import HistorialLoteDetail from "../app/HistorialConsumo/HistorialLoteDetail";
import HistorialUserPredio from "../app/HistorialConsumo/HistorialUserPredioList";
import HistorialUserPredioDetail from "../app/HistorialConsumo/HistorialUserPredioDetail";
import HistorialUserLoteDetail from "../app/HistorialConsumo/HistorialUserLoteDetail";
import ControlBocatoma from "../app/controloT/ControlBocatoma";

import ValvesList from "../app/valvulas/ValvesList"
import ValveDetail from "../app/valvulas/ValveDetail"
import ValveFlowUpdate from "../app/valvulas/ValveFlowUpdate"
import HistorialFacturasLote from "../app/facturacion/HistorialFacturasLote";
import MisFacturas from "../app/misFacturas/MisFacturas";

import GestionFacturas from "../app/facturacion/GestionFacturas"
import FacturaLoteDetails from "../app/facturacion/FacturaLoteDetails";
import MisFacturasDetails from "../app/misFacturas/MisFacturasDetails";
import PagarFactura from "../app/misFacturas/PagarFactura";

import ReportesYNovedades from "../app/reportes_y_novedades/solicitud_caudal/ReportesYNovedades";
import ReportesYNovedadesLotesList from "../app/reportes_y_novedades/solicitud_caudal/ReportesYNovedadesLotesList";
import ReportarFallosList from "../app/reportes_y_novedades/reportar_fallos/ReportarFallosList";
import CancelacionCaudal from "../app/reportes_y_novedades/solicitud_caudal/CancelacionCaudal";
import ActivacionCaudal from "../app/reportes_y_novedades/solicitud_caudal/activar-caudal";

import GestionSolicitudesReportes from "../app/reportes_y_novedades/atencion_solicitudes-reportes/GestionSolicitudes-Reportes";
import ReportesSolicitudes from "../app/reportes_y_novedades/mis-reportes-solicitudes/ReportesSolicitudes";
import ReportesSolicitudesDetails from "../app/reportes_y_novedades/mis-reportes-solicitudes/ReportesSolicitudesDetails";
import InformeMantenimiento from "../app/reportes_y_novedades/informe_mantenimiento/informe-mantenimiento";
import CrearMantenimiento from "../app/reportes_y_novedades/informe_mantenimiento/crear-informe";
import ControlReportesIntervenciones from "../app/reportes_y_novedades/gestion_gerencia_informe/control-reportes-intervenciones";
import GestionarInforme from "../app/reportes_y_novedades/gestion_gerencia_informe/gestionar-informe";
import NotAuthorized from "../app/NotAuthorized";
import PasarelaPago from "../app/misFacturas/PasarelaPago";

const AppRouter = () => {
    return (
        <Routes>
            {/* Redirección a login si no está autenticado */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<Navigate to="/perfil" replace />} />

            {/* Rutas públicas */}
            <Route path="/preRegister" element={<PreRegister />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
            <Route path="/recoverPassword" element={<RecoverPassword />} />
            {/* <Route path="/registro-predios" element={<RegistroPredios/>}/> */}

            {/* Rutas protegidas */}
            <Route path="/perfil" element={<ProtectedRoute element={<Perfil />} />} />
            <Route path="/control-IoT" element={<ProtectedRoute element={<IoTControll />} />} />

            <Route
                path="gestionRegistros/predios"
                element={
                    <ProtectedRoute
                        permissions={["registrar_info_predios"]}
                        element={<RegistroPredios />}
                    />
                }
            />
            <Route
                path="gestionRegistros/lotes"
                element={
                    <ProtectedRoute
                        permissions={["registrar_info_lotes"]}
                        element={<RegistroLotes />}
                    />
                }
            />

            <Route
                path="/gestionRegistros/predios"
                lement={
                    <ProtectedRoute
                        permissions={["registrar_disp_iot"]}
                        element={<RegistroPredios />}
                    />
                }
            />

            <Route
                path="/gestionDatos/users"
                element={
                    <ProtectedRoute
                        permissions={[
                            "visualizar_usuarios_distrito",
                            "ver_info_usuarios_distrito",
                            "actualizar_info_usuarios_distrito",
                            "agregar_info_usuarios_distrito",
                            "eliminar_info_usuarios_distrito"]}
                        element={<UsersList />} />}
            />
            <Route path="/gestionDatos/users/:document" element={<ProtectedRoute element={<UserInformation />} />} />
            <Route
                path="/gestionDatos/lotes"
                element={
                    <ProtectedRoute
                        permissions={[
                            "ver_lotes",
                            "actualizar_info_lotes",
                            "inhabilitar_lotes",
                        ]}
                        element={<LotesList />}
                    />
                }
            />
            <Route path="/gestionDatos/lotes/:id_lot" element={<ProtectedRoute element={<LoteInformation />} />} />
            <Route
                path="/gestionDatos/dispositivosIoT"
                element={
                    <ProtectedRoute
                        permissions={[
                            "habilitar_disp_iot",
                            "ver_disp_iot",
                            "change_iotdevice",
                            "inhabilitar_disp_iot"
                        ]}
                        element={<DispositivoIoTList />}
                    />
                }
            />
            <Route path="/gestionDatos/dispositivosIoT/:iot_id" element={<ProtectedRoute element={<DispositivosIoTInformation />} />} />
            <Route
                path="/gestionDatos/pre-registros"
                element={
                    <ProtectedRoute
                        permissions={[
                            "ver_pre_registros",
                            "aceptar_pre_registros",
                            "rechazar_pre_registros",
                        ]}
                        element={<PreRegistrosList />}
                    />
                }
            />
            <Route path="/gestionDatos/pre-registros/:document" element={<ProtectedRoute element={<PreRegistroDetail />} />} />
            <Route path="/perfil/actualizar-informacion" element={<ProtectedRoute element={<UserUpdateInformation />} />} />
            <Route path="/gestionDatos/users/updateinformation/:document" element={<ProtectedRoute element={<UpdateInformation />} />} />
            <Route
                path="/gestionDatos/predios"
                element={
                    <ProtectedRoute
                        permissions={[
                            "ver_predios",
                            "inhabilitar_predios",
                            "actualizar_info_predios",
                            "eliminar_info_predios"
                        ]}
                        element={<PrediosList />}
                    />
                }
            />
            <Route path="/perfil/actualizar-informacion" element={<ProtectedRoute element={<UserUpdateInformation />} />} />
            <Route path="/seguridad/actualizar-contrasena" element={<ProtectedRoute element={<UpdatedPassword />} />} />
            <Route path="/gestionDatos/predios/:id_plot" element={<ProtectedRoute element={<PrediosDetail />} />} />
            <Route path="/gestionDatos/lotes/:id_lot/update" element={<ProtectedRoute element={<LoteEdit />} />} />
            <Route path="/gestionDatos/predios/update/:id_plot" element={<ProtectedRoute element={<PrediosUpdate />} />} />
            <Route path="/gestionRegistros/dispositivosIoT" element={<ProtectedRoute element={<RegistroDispositivosIoT />} />} />
            <Route
                path="/permisos"
                element=
                {<ProtectedRoute
                    permissions={[
                        "asignar_permisos",
                        "quitar_permisos_asignados",
                        "ver_permisos_asignados",
                        "ver_roles_asignados",
                        "asignar_roles_asignados"
                    ]}
                    element={<PermissionsSystem />}
                />
                }
            />
            <Route path="/gestionDatos/dispositivosIoT/:iot_id/update" element={<ProtectedRoute element={<DispositivoEdit />} />} />
            <Route path="/mispredios/:document" element={<ProtectedRoute element={<PlotLotUsers />} />} />
            <Route path="/mispredios/predio/:id_plot" element={<ProtectedRoute element={<MiPlotLotDetail />} />} />
            <Route path="/mislotes/lote/:id_lot" element={<ProtectedRoute element={<LotUsersDetail />} />} />
            <Route
                path="/historial-consumo/distrito"
                element={
                    <ProtectedRoute
                        permissions={[
                            "ver_historial_consumo_general_distrito",
                            "descargar_facturas_distrito_pdf"
                        ]}
                        element={<HistorialDistrito />}
                    />
                }
            />
            <Route
                path="/historial-consumo/predio"
                element={
                    <ProtectedRoute
                        permissions={[
                            "ver_historial_consumo_predios",
                            "ver_historial_consumo_lotes"
                        ]}
                        element={<HistorialPredio />}
                    />
                }
            />
            <Route path="/historial-consumo/predio/:id_plot" element={<ProtectedRoute element={<HistorialPredioDetail />} />} />
            <Route path="/historial-consumo/predio/:id_plot/lote/:id_lot" element={<ProtectedRoute element={<HistorialLoteDetail />} />} />
            <Route
                path="/mispredios/historial-consumoList/:document"
                element={
                    <ProtectedRoute
                        permissions={[
                            "ver_historial_consumo_predios_individuales",
                            "ver_historial_consumo_lotes_individuales"
                        ]}
                        element={<HistorialUserPredio />}
                    />
                }
            />
            <Route path="/mispredios/historial-consumoPredio/:id_plot" element={<ProtectedRoute element={<HistorialUserPredioDetail />} />} />
            <Route path="/mispredios/historial-consumoPredio/:id_plot/milote/:id_lot" element={<ProtectedRoute element={<HistorialUserLoteDetail />} />} />
            <Route path="/control-IoT/bocatoma" element={<ProtectedRoute element={<ControlBocatoma />} />} />
            <Route path="/control-IoT/valvulas" element={<ProtectedRoute element={<ValvesList />} />} />
            <Route path="/control-IoT/valvulas/:id_valve" element={<ProtectedRoute element={<ValveDetail />} />} />
            <Route path="/control-IoT/valvulas/:id_valve/update-flow" element={<ProtectedRoute element={<ValveFlowUpdate />} />} />
            <Route
                path="/facturacion/GestionFacturas"
                element={
                    <ProtectedRoute
                        permissions={[
                            "ver_tarifas_cobro",
                            "ingresar_tarifas_cobro",
                            "modificar_tarifas_cobro"
                        ]}
                        element={<GestionFacturas />}
                    />
                }
            />
            <Route
                path="/facturacion/historial-facturas-lote"
                element={
                    <ProtectedRoute
                        permissions={[
                            "ver_historial_facturas_usuarios"
                        ]}
                        element={<HistorialFacturasLote />}
                    />
                }
            />
            <Route path="/mis-facturas" element={<ProtectedRoute element={<MisFacturas />} />} />
            <Route path="/facturacion/detalle/:id_bill" element={<ProtectedRoute element={<FacturaLoteDetails />} />} />
            <Route path="/mis-facturas/detalle/:id_bill" element={<ProtectedRoute element={<MisFacturasDetails />} />} />
            <Route path="/facturacion/pagar/:id_bill" element={<ProtectedRoute element={<PagarFactura />} />} />
            <Route path="/facturacion/pagar/:id_bill/pasarela-pago" element={<ProtectedRoute element={<PasarelaPago />} />} />
            <Route path="/mis-facturas/detalle/:id_bill" element={<ProtectedRoute element={<MisFacturasDetails />} />} />
            <Route path="/reportes-y-novedades/solicitud_caudal" element={<ProtectedRoute element={<ReportesYNovedades />} />} />
            <Route path="/reportes-y-novedades/lote" element={<ProtectedRoute element={<ReportesYNovedadesLotesList />} />} />
            <Route path="/reportes-y-novedades/cancelacion_caudal" element={<ProtectedRoute element={<CancelacionCaudal />} />} />
            <Route path="/reportes-y-novedades/activar-caudal" element={<ProtectedRoute element={<ActivacionCaudal />} />} />
            <Route path="/reportes-y-novedades/reportar_fallos" element={<ProtectedRoute element={<ReportarFallosList />} />} />
            <Route path="/reportes-y-novedades/lotes" element={<ProtectedRoute element={<ReportesYNovedadesLotesList />} />} />
            <Route
                path="/reportes-y-novedades/atencion_solicitudes-reportes"
                element={
                    <ProtectedRoute
                        permissions={[
                            "view_all_assignments",
                            "can_assign_user",
                            "change_assignment",
                            "add_assignment"
                        ]}
                        element={<GestionSolicitudesReportes />}
                    />
                }
            />
            <Route path="/reportes-y-novedades/mis-reportes-solicitudes" element={<ProtectedRoute element={<ReportesSolicitudes />} />} />
            <Route path="/reportes-y-novedades/mis-reportes-solicitudes/detalle/:id_reportes_solicitudes" element={<ProtectedRoute element={<ReportesSolicitudesDetails />} />} />
            <Route
                path="/reportes-y-novedades/informe-mantenimiento"
                element={
                    <ProtectedRoute
                        permissions={[
                            "Can_view_assignment",
                            "can_be_assigned"
                        ]}
                        element={<InformeMantenimiento />}
                    />
                }
            />
            <Route path="/reportes-y-novedades/crear-informe/:id" element={<ProtectedRoute element={<CrearMantenimiento />} />} />
            <Route path="/reportes-y-novedades/control-reportes-intervenciones" element={<ControlReportesIntervenciones />} />
            <Route path="/reportes-y-novedades/gestionar-informe/:id" element={<GestionarInforme />} />

            <Route path="/no-autorizado" element={<NotAuthorized />} />
        </Routes>
    );
};

export default AppRouter;
