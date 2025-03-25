"use client"

import { Plus, Trash2 } from "lucide-react"
import { useEffect } from "react"

const UserRolesManager = ({
  userRoles,
  selectedUserRole,
  setSelectedUserRole,
  currentUser,
  roles,
  getRoleName,
  assignRoleToUser,
  removeRoleFromUser,
  rolePermissions,
}) => {
  const [roleToAdd, setRoleToAdd] = useState("")

  // Efecto para actualizar la UI cuando cambian los roles
  useEffect(() => {
    // Si hay roles y no hay un rol seleccionado, seleccionar el primero
    if (userRoles.length > 0 && !selectedUserRole) {
      setSelectedUserRole(userRoles[0].toString())
    }
  }, [userRoles, selectedUserRole, setSelectedUserRole])

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Roles asignados</h3>

      {/* Lista de roles actuales */}
      <div className="mb-4">
        {userRoles && userRoles.length > 0 ? (
          <div className="flex flex-col gap-2 mb-4">
            {userRoles.map((roleId, index) => {
              const roleName = getRoleName(roleId)
              const isSelected = selectedUserRole === roleId.toString()

              return (
                <div
                  key={`role-${roleId}-${index}`}
                  className={`border p-3 rounded-md ${isSelected ? "bg-blue-100" : "bg-blue-50"} flex justify-between items-center cursor-pointer`}
                  onClick={() => setSelectedUserRole(roleId.toString())}
                >
                  <div>
                    <p className="font-medium">{roleName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Rol</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRoleFromUser(currentUser.document, roleId)
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      title="Quitar rol"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 mb-4">No tiene roles asignados</p>
        )}
      </div>

      {/* Selector para añadir nuevo rol */}
      <div className="flex gap-2 items-center">
        <select
          value={roleToAdd}
          onChange={(e) => setRoleToAdd(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]"
        >
          <option value="">Seleccionar rol para añadir</option>
          {roles.map(
            (role) =>
              // No mostrar roles que ya tiene asignados
              !userRoles.includes(role.id) && (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ),
          )}
        </select>
        <button
          onClick={() => {
            if (roleToAdd) {
              assignRoleToUser(currentUser.document, roleToAdd)
              setRoleToAdd("")
            }
          }}
          disabled={!roleToAdd}
          className={`px-3 py-2 rounded-md flex items-center ${
            roleToAdd ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Plus className="h-4 w-4 mr-1" />
          Añadir
        </button>
      </div>
    </div>
  )
}

import { useState } from "react"

export default UserRolesManager

