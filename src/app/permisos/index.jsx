"use client"

import { useState } from "react"
import RolesSystem from "./roles-system"
import UsersSystem from "./users-system"
import NavBar from "../../components/NavBar"

const PermissionsSystem = () => {
  const [activeTab, setActiveTab] = useState("roles") // "roles" o "users"

  return (
    <div>
      <NavBar />
      <div className="min-h-screen flex flex-col mt-15">
        <div className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h1 className="text-2xl font-semibold mb-6 text-center">Gestión de Permisos</h1>

            {/* Tabs para cambiar entre roles y usuarios */}
            <div className="flex border-b mb-6">
              <button
                className={`py-2 px-4 font-medium ${activeTab === "roles" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => setActiveTab("roles")}
              >
                Roles
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === "users" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => setActiveTab("users")}
              >
                Usuarios
              </button>
            </div>

            {/* Contenido de la pestaña activa */}
            {activeTab === "roles" ? <RolesSystem /> : <UsersSystem />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionsSystem

