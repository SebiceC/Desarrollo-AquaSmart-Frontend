"use client"

import { Eye, UserCog } from "lucide-react"

const UsersTable = ({ filteredUsers, handleViewUserPermissions, handleEditUserPermissions, getRoleName }) => {
  // Definir las columnas para la tabla
  const columns = [
    {
      key: "document",
      label: "Documento",
      render: (user) => <span className="font-medium">{user.document}</span>,
    },
    {
      key: "name",
      label: "Nombre",
      render: (user) => `${user.first_name || ""} ${user.last_name || ""}`,
    },
    {
      key: "roles",
      label: "Roles",
      render: (user) => {
        // Si el usuario tiene roles asignados
        if (user.groups && user.groups.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {user.groups.map((roleId, index) => (
                <span
                  key={`role-${roleId}-${index}`}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {getRoleName(roleId)}
                </span>
              ))}
            </div>
          )
        }
        return <span className="text-gray-500 text-sm">Sin roles asignados</span>
      },
    },
    {
      key: "status",
      label: "Estado",
      render: (user) =>
        user.is_active ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Inactivo
          </span>
        ),
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-4 text-gray-500 text-sm">
                No se encontraron usuarios
              </td>
            </tr>
          ) : (
            filteredUsers.map((user, index) => (
              <tr key={index} className="hover:bg-gray-100">
                {columns.map((column) => (
                  <td key={`${index}-${column.key}`} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(user) : user[column.key]}
                  </td>
                ))}
                <td className="px-4 py-4 whitespace-nowrap space-x-2 text-sm text-gray-900">
                  <div className="flex gap-2">
                    <button
                      className="bg-[#365486] hover:bg-[#2f4275] text-white text-xs px-3 py-1 h-8 rounded-md flex items-center"
                      onClick={() => handleViewUserPermissions(user)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver permisos
                    </button>
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-8 rounded-md flex items-center"
                      onClick={() => handleEditUserPermissions(user)}
                    >
                      <UserCog className="h-4 w-4 mr-1" />
                      Editar permisos
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

import { Check, X } from "lucide-react"

export default UsersTable