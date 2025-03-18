import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell } from "lucide-react";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_APP_API_URL;
  //var API_URL = process.env.VITE_APP_API_URL || "http://localhost:5173"; // var de pruebas

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(`${API_URL}/notifications`, {
          headers: { Authorization: `Token ${token}` },
        });

        setNotifications(response.data);
      } catch (err) {
        console.warn("Backend no disponible, no se mostrarán notificaciones.");
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        bellRef.current &&
        !notificationRef.current.contains(event.target) &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && notificationRef.current && bellRef.current) {
      adjustPosition();
      window.addEventListener("resize", adjustPosition);
      return () => window.removeEventListener("resize", adjustPosition);
    }
  }, [isOpen]);

  const adjustPosition = () => {
    if (!notificationRef.current || !bellRef.current) return;

    const bellRect = bellRef.current.getBoundingClientRect();
    const dropdownRect = notificationRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (bellRect.left + dropdownRect.width > viewportWidth) {
      notificationRef.current.style.left = "auto";
      notificationRef.current.style.right = "0";
    } else {
      notificationRef.current.style.left = "0";
      notificationRef.current.style.right = "auto";
    }

    if (bellRect.bottom + dropdownRect.height > viewportHeight) {
      notificationRef.current.style.top = "auto";
      notificationRef.current.style.bottom = "100%";
      notificationRef.current.style.marginTop = "0";
      notificationRef.current.style.marginBottom = "8px";
    } else {
      notificationRef.current.style.top = "100%";
      notificationRef.current.style.bottom = "auto";
      notificationRef.current.style.marginTop = "8px";
      notificationRef.current.style.marginBottom = "0";
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-6 w-6 text-[#365486]" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={notificationRef}
          className="absolute z-50 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200"
          style={{
            top: "100%",
            left: "0",
            marginTop: "8px",
          }}
        >
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Notificaciones</h3>
          </div>

          {notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate("/gestionDatos/pre-registros")}
                >
                  <p className="text-sm font-medium text-gray-800">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Hace un momento</p>
                </div>
              ))}
              <div className="p-2 text-center">
                <button className="text-sm text-[#365486] hover:underline">
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No hay notificaciones nuevas
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
