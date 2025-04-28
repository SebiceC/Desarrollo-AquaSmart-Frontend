import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Crear el contexto
export const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [document, setDocument] = useState(null);

    // Función para obtener el perfil del usuario
    const fetchUserProfile = async () => {
        try {
            const API_URL = import.meta.env.VITE_APP_API_URL;
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("No tienes token de autenticación");
                setLoading(false);
                return null;
            }

            const response = await axios.get(`${API_URL}/users/profile`, {
                headers: { Authorization: `Token ${token}` },
            });

            // Asumiendo que la respuesta incluye el ID del usuario
            const document = response.data.document;
            console.log("ID del usuario:", document);
            setDocument(document);
            return document;

        } catch (error) {
            console.error("Error al obtener el perfil:", error);
            return null;
        }
    };

    // Función para cargar permisos desde el backend
    const fetchPermissions = async (document) => {
        if (!document) return;

        try {
            const API_URL = import.meta.env.VITE_APP_API_URL;
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("No tienes token de autenticación");
                setLoading(false);
                return;
            }

            // Usar el endpoint que retorna los permisos específicos del usuario
            const response = await axios.get(`${API_URL}/admin/users/${document}/permissions`, {
                headers: { Authorization: `Token ${token}` },
            });

            console.log("Permisos del usuario:", response.data);

            const data = response.data;

            const permisosUsuario = data.Permisos_Usuario || [];
            const permisosRol = Object.values(data.Permisos_Rol || {}).flat();

            const permisosCombinados = [...permisosUsuario, ...permisosRol];

            setPermissions(permisosCombinados);

        } catch (error) {
            console.error("Error al obtener permisos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            const id = await fetchUserProfile();
            if (id) {
                await fetchPermissions(id);
            } else {
                setLoading(false);
            }
        };

        initializeData();
    }, []);

    // Función hasPermission que verifica si el permiso está en la lista del usuario
    const hasPermission = (codename) => {
        // Verificar si el permiso existe en la lista del usuario
        const hasUserPermission = permissions.some(p => p.codename === codename);
        console.log(`Verificando permiso: ${codename}, Resultado: ${hasUserPermission}`);
        return hasUserPermission;
    };

    return (
        <PermissionsContext.Provider value={{ permissions, hasPermission, loading, document }}>
            {children}
        </PermissionsContext.Provider>
    );
};