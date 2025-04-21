import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, HelpCircle, Minus, Bell } from "lucide-react";
import NavItem from "./NavItem";
import axios from "axios";
import NotificationBell from "./NotificationBell";
import { PermissionsContext } from "../app/context/PermissionsContext";

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const { hasPermission } = useContext(PermissionsContext);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa.");
        return;
      }

      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Token ${token}` },
      });

      setUser(response.data); // Guardar los datos del usuario en el estado
    } catch (err) {
      setError(err.response?.data?.error || "Error al obtener el perfil");
    }
  };

  // Llamar a la función al montar el componente
  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay sesión activa.");
        return;
      }

      await axios.post(
        `${API_URL}/users/logout`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );

      localStorage.removeItem("token");
      setUser(null); // <-- Limpia el usuario
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Error en el servidor");
    }
  };
  return (
    <header className="w-full fixed top-0 bg-[#DCF2F1] z-50">
      <nav className="px-5 py-2 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <div className="relative flex items-center ml-auto mr-4">
            <NotificationBell />
          </div>

          <Link to="/home">
            <img src="/img/logo.png" alt="Logo" className="w-[250px]" />
          </Link>
        </div>

        <ul className="hidden lg:flex space-x-1 font-semibold">
          <NavItem direction="/perfil" text="Perfil" />
          <NavItem
            direction="/control-IoT"
            text="Control IoT"
            subItems={[
              { direction: "/control-IoT/bocatoma", text: "Bocatoma" },
              { direction: "/control-IoT/valvulas", text: "Valvulas" },
            ]}
          />
          {
            <NavItem
              direction="/gestionDatos"
              text="Gestión de datos"
              subItems={[
                hasPermission("ver_pre_registros") &&
                  hasPermission("aceptar_pre_registros") &&
                  hasPermission("rechazar_pre_registros") && {
                    direction: "/gestionDatos/pre-registros",
                    text: "Pre Registros",
                  },
                hasPermission("visualizar_usuarios_distrito") &&
                  hasPermission("ver_info_usuarios_distrito") &&
                  hasPermission("actualizar_info_usuarios_distrito") &&
                  hasPermission("agregar_info_usuarios_distrito") &&
                  hasPermission("eliminar_info_usuarios_distrito") && {
                    direction: "/gestionDatos/users",
                    text: "Usuarios",
                  },
                hasPermission("ver_predios_distrito") &&
                  hasPermission("actualizar_info_predios") &&
                  hasPermission("eliminar_info_predios") && {
                    direction: "/gestionDatos/predios",
                    text: "Predios",
                  },
                hasPermission("view_lot") &&
                  hasPermission("delete_lot") &&
                  hasPermission("change_lot") && {
                    direction: "/gestionDatos/lotes",
                    text: "Lotes",
                  },
                hasPermission("view_iotdevice") &&
                  hasPermission("change_iotdevice") &&
                  hasPermission("delete_iotdevice") && {
                    direction: "/gestionDatos/dispositivosIoT",
                    text: "Dispositvos",
                  },
              ].filter(Boolean)}
            />
          }
          {
            <NavItem
              direction="/gestionRegistros"
              text="Gestión de registros"
              subItems={[
                hasPermission("registrar_info_predios") && {
                  direction: "/gestionRegistros/predios",
                  text: "Registro de Predios",
                },
                hasPermission("add_lot") && {
                  direction: "/gestionRegistros/lotes",
                  text: "Registro de Lotes",
                },
                hasPermission("add_iotdevice") && {
                  direction: "/gestionRegistros/dispositivosIoT",
                  text: "Registro Dispositivos",
                },
              ].filter(Boolean)}
            />
          }
          <NavItem
            direction="/facturacion"
            text="Facturación"
            subItems={[
              { direction: "/facturacion/historial", text: "Historial" },
              { direction: "/facturacion/reportes", text: "Reportes" },
            ]}
          />
          {
            <NavItem
              direction="/historialConsumo"
              text="Historial de consumo"
              subItems={[
                hasPermission("ver_historial_consumo_predios_individuales") &&
                  hasPermission("ver_historial_consumo_lotes_individuales") && {
                    direction: "/mispredios/historial-consumoList/:document",
                    text: "Historial de mis predios y lotes",
                  },
                hasPermission("ver_historial_consumo_predios") &&
                  hasPermission("ver_historial_consumo_lotes") && {
                    direction: "/historial-consumo/predio",
                    text: "Historial del predio",
                  },
                hasPermission("ver_historial_consumo_general_distrito") && {
                  direction: "/historial-consumo/distrito",
                  text: "Historial del distrito",
                },
              ].filter(Boolean)}
            />
          }
          <NavItem
            direction="/seguridad/actualizar-contrasena"
            text="Seguridad"
          />
          {hasPermission("asignar_permisos") &&
            hasPermission("quitar_permisos_asignados") &&
            hasPermission("ver_permisos_asignados") && (
              <NavItem direction="/permisos" text="Permisos" />
            )}
        </ul>

        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden">
          <Menu size={28} />
        </button>

        <div
          className={`fixed right-0 top-0 h-full w-[80%] sm:w-[50%] bg-[#DCF2F1] rounded-l-3xl p-5 border-l-[#365486] border-1 transform 
                    ${
                      menuOpen ? "translate-x-0" : "translate-x-full"
                    } transition-transform duration-300 ease-in-out lg:hidden`}
        >
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-3 right-3"
          >
            <X size={24} />
          </button>

          {user ? (
            <div className="flex items-center space-x-2 mb-10">
              <span className="font-semibold text-lg">
                {user.first_name + " " + user.last_name}
              </span>
              <User size={32} />
            </div>
          ) : (
            <p className="text-gray-600 mt-4 mb-10">Cargando perfil...</p>
          )}

          {/* Contenedor de enlaces, SOLO ESTE será desplazable */}
          <div className="flex flex-col space-y-4 font-medium overflow-y-auto h-[calc(100vh-180px)]">
            <NavItem direction="/perfil" text="Perfil" />
            <NavItem
              direction="/control-IoT"
              text="Control IoT"
              subItems={[
                { direction: "/control-IoT/sensores", text: "Sensores" },
              ]}
            />
            <NavItem
              direction="/gestionDatos"
              text="Gestión de datos"
              subItems={[
                { direction: "/gestionDatos/users", text: "Usuarios" },
                { direction: "/gestionDatos/predios", text: "Predios" },
                { direction: "/gestionDatos/lotes", text: "Lotes" },
                {
                  direction: "/gestionDatos/dispositivosIoT",
                  text: "Dispositvos IoT",
                },
              ]}
            />
            <NavItem
              direction="/gestionDatos"
              text="Gestión de registros"
              subItems={[
                {
                  direction: "/gestionRegistros/usuarios",
                  text: "Registro de Usuarios",
                },
                {
                  direction: "/gestionRegistros/predios",
                  text: "Registro de Predios",
                },
                {
                  direction: "/gestionRegistros/lotes",
                  text: "Registro de Lotes",
                },
                {
                  direction: "/gestionRegistros/dispositivosIoT",
                  text: "Registro Dispositivos",
                },
              ]}
            />
            <NavItem
              direction="/facturacion"
              text="Facturación"
              subItems={[
                { direction: "/facturacion/historial", text: "Historial" },
                { direction: "/facturacion/reportes", text: "Reportes" },
              ]}
            />
            <NavItem
              direction="/historialConsumo"
              text="Historial de consumo"
              subItems={[
                {
                  direction: "/historialConsumo/diario",
                  text: "Consumo Diario",
                },
                {
                  direction: "/historialConsumo/mensual",
                  text: "Consumo Mensual",
                },
              ]}
            />
            <NavItem
              direction="/seguridad/actualizar-contrasena"
              text="Seguridad"
            />
            <NavItem direction="/permisos" text="Permisos" />
          </div>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden">
          <Menu size={28} />
        </button>

        <div
          className={`fixed right-0 top-0 h-full w-[80%] sm:w-[50%] bg-[#DCF2F1] rounded-l-3xl p-5 border-l-[#365486] border-1 transform 
              ${
                menuOpen ? "translate-x-0" : "translate-x-full"
              } transition-transform duration-300 ease-in-out lg:hidden`}
        >
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-3 right-3"
          >
            <X size={24} />
          </button>

          {user ? (
            <div className="flex items-center space-x-2 mb-10">
              <span className="font-semibold text-lg">
                {user.first_name + " " + user.last_name}
              </span>
              <User size={32} />
            </div>
          ) : (
            <p className="text-gray-600 mt-4 mb-10">Cargando perfil...</p>
          )}

          {/* Contenedor de enlaces, SOLO ESTE será desplazable */}
          <div className="flex flex-col space-y-4 font-medium overflow-y-auto h-[calc(100vh-180px)]">
            <NavItem direction="/perfil" text="Perfil" />
            <NavItem
              direction="/control-IoT"
              text="Control IoT"
              subItems={[
                { direction: "/control-IoT/sensores", text: "Sensores" },
              ]}
            />
            <NavItem
              direction="/gestionDatos"
              text="Gestión de datos"
              subItems={[
                {
                  direction: "/gestionDatos/pre-registros",
                  text: "Pre Registros",
                },
                { direction: "/gestionDatos/users", text: "Usuarios" },
                { direction: "/gestionDatos/predios", text: "Predios" },
                { direction: "/gestionDatos/lotes", text: "Lotes" },
                {
                  direction: "/gestionDatos/dispositivosIoT",
                  text: "Dispositvos IoT",
                },
              ]}
            />
            <NavItem
              direction="/gestionRegistros"
              text="Gestión de registros"
              subItems={[
                {
                  direction: "/gestionRegistros/usuarios",
                  text: "Registro de Usuarios",
                },
                {
                  direction: "/gestionRegistros/predios",
                  text: "Registro de Predios",
                },
                {
                  direction: "/gestionRegistros/lotes",
                  text: "Registro de Lotes",
                },
                {
                  direction: "/gestionRegistros/dispositivosIoT",
                  text: "Registro Dispositivos",
                },
              ]}
            />
            <NavItem
              direction="/facturacion"
              text="Facturación"
              subItems={[
                { direction: "/facturacion/historial", text: "Historial" },
                { direction: "/facturacion/reportes", text: "Reportes" },
              ]}
            />
            <NavItem
              direction="/historialConsumo"
              text="Historial de consumo"
              subItems={[
                {
                  direction: "/historialConsumo/diario",
                  text: "Consumo Diario",
                },
                {
                  direction: "/historialConsumo/mensual",
                  text: "Consumo Mensual",
                },
              ]}
            />
            <NavItem
              direction="/seguridad/actualizar-contrasena"
              text="Seguridad"
            />
            <NavItem direction="/permisos" text="Permisos" />
          </div>

          {/* Contenedor de enlaces, SOLO ESTE será desplazable */}
          <div className="flex flex-col space-y-4 font-medium overflow-y-auto h-[calc(100vh-230px)]">
            <NavItem direction="/perfil" text="Perfil" />
            <NavItem
              direction="/control-IoT"
              text="Control IoT"
              subItems={[
                { direction: "/control-IoT/bocatoma", text: "Bocatoma" },
                { direction: "/control-IoT/valvulas", text: "Valvulas" },
              ]}
            />
            {
              <NavItem
                direction="/gestionDatos"
                text="Gestión de datos"
                subItems={[
                  hasPermission("ver_pre_registros") &&
                    hasPermission("aceptar_pre_registros") &&
                    hasPermission("rechazar_pre_registros") && {
                      direction: "/gestionDatos/pre-registros",
                      text: "Pre Registros",
                    },
                  hasPermission("visualizar_usuarios_distrito") &&
                    hasPermission("ver_info_usuarios_distrito") &&
                    hasPermission("actualizar_info_usuarios_distrito") &&
                    hasPermission("agregar_info_usuarios_distrito") &&
                    hasPermission("eliminar_info_usuarios_distrito") && {
                      direction: "/gestionDatos/users",
                      text: "Usuarios",
                    },
                  hasPermission("ver_predios_distrito") &&
                    hasPermission("actualizar_info_predios") &&
                    hasPermission("eliminar_info_predios") && {
                      direction: "/gestionDatos/predios",
                      text: "Predios",
                    },
                  hasPermission("view_lot") &&
                    hasPermission("delete_lot") &&
                    hasPermission("change_lot") && {
                      direction: "/gestionDatos/lotes",
                      text: "Lotes",
                    },
                  hasPermission("view_iotdevice") &&
                    hasPermission("change_iotdevice") &&
                    hasPermission("delete_iotdevice") && {
                      direction: "/gestionDatos/dispositivosIoT",
                      text: "Dispositvos",
                    },
                ].filter(Boolean)}
              />
            }
            {
              <NavItem
                direction="/gestionRegistros"
                text="Gestión de registros"
                subItems={[
                  hasPermission("registrar_info_predios") && {
                    direction: "/gestionRegistros/predios",
                    text: "Registro de Predios",
                  },
                  hasPermission("add_lot") && {
                    direction: "/gestionRegistros/lotes",
                    text: "Registro de Lotes",
                  },
                  hasPermission("add_iotdevice") && {
                    direction: "/gestionRegistros/dispositivosIoT",
                    text: "Registro Dispositivos",
                  },
                ].filter(Boolean)}
              />
            }
            <NavItem
              direction="/facturacion"
              text="Facturación"
              subItems={[
                { direction: "/facturacion/historial", text: "Historial" },
                { direction: "/facturacion/reportes", text: "Reportes" },
              ]}
            />
            {
              <NavItem
                direction="/historialConsumo"
                text="Historial de consumo"
                subItems={[
                  hasPermission("ver_historial_consumo_predios_individuales") &&
                    hasPermission(
                      "ver_historial_consumo_lotes_individuales"
                    ) && {
                      direction: "/mispredios/historial-consumoList/:document",
                      text: "Historial de mis predios y lotes",
                    },
                  hasPermission("ver_historial_consumo_predios") &&
                    hasPermission("ver_historial_consumo_lotes") && {
                      direction: "/historial-consumo/predio",
                      text: "Historial del predio",
                    },
                  hasPermission("ver_historial_consumo_general_distrito") && {
                    direction: "/historial-consumo/distrito",
                    text: "Historial del distrito",
                  },
                ].filter(Boolean)}
              />
            }
            <NavItem
              direction="/seguridad/actualizar-contrasena"
              text="Seguridad"
            />
            {hasPermission("asignar_permisos") &&
              hasPermission("quitar_permisos_asignados") &&
              hasPermission("ver_permisos_asignados") && (
                <NavItem direction="/permisos" text="Permisos" />
              )}
          </div>

          {/* Botones Fijos */}
          <div className="flex  flex-col  gap-3 absolute bottom-5 w-full px-5 pt-5 bg-[#DCF2F1]">
            <button
              type="submit"
              onClick={handleLogout}
              className="px-2 flex items-center space-x-2 text-gray-600 w-[70%]"
            >
              <LogOut size={20} />
              <span>Cerrar sesión</span>
            </button>
            <Minus className="w-full h-[2px] bg-gray-400" />
            <Link
              to="/"
              className="flex items-center space-x-2 text-sm text-gray-600 pb-5 px-2"
            >
              <HelpCircle size={20} />
              <span>Manual de usuario y soporte</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
