"use client"

import { Edit, Trash2 } from "lucide-react"

const RolesTable = ({ filteredRoles, handleEditPermissions, handleDeleteRole, handleViewMorePermissions }) => {
  // Definir las columnas para la tabla
  const columns = [
    {
      key: "id",
      label: "ID",
      render: (role) => <span className="font-medium">{role.id}</span>,
    },
    {
      key: "name",
      label: "Nombre",
    },
    {
      key: "permissions",
      label: "Permisos",
      render: (role) => (
        <div className="flex flex-wrap gap-1">
          {role.permissions && role.permissions.length > 0 ? (
            role.permissions.slice(0, 3).map((perm, idx) => (
              <span
                key={`perm-${perm.id || idx}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
              >
                {perm.name}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">Sin permisos</span>
          )}
          {role.permissions && role.permissions.length > 3 && (
            <div className="relative inline-block">
              <button
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200"
                onClick={() => {
                  console.log("Permisos completos:", role.permissions)
                  handleViewMorePermissions(role.permissions)
                }}
              >
                +{role.permissions.length - 3} más
              </button>
            </div>
          )}
        </div>
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
          {filteredRoles.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-4 text-gray-500 text-sm">
                No se encontraron roles
              </td>
            </tr>
          ) : (
            filteredRoles.map((role, index) => (
              <tr key={index} className="hover:bg-gray-100">
                {columns.map((column) => (
                  <td key={`${index}-${column.key}`} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(role) : role[column.key]}
                  </td>
                ))}
                <td className="px-4 py-4 whitespace-nowrap space-x-2 text-sm text-gray-900">
                  <div className="flex gap-2">
                    <button
                      className="bg-[#365486] hover:bg-[#2f4275] text-white text-xs px-3 py-1 h-8 rounded-md flex items-center"
                      onClick={() => handleEditPermissions(role)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Permisos
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-8 rounded-md flex items-center"
                      onClick={() => handleDeleteRole(role)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
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

export default RolesTable

