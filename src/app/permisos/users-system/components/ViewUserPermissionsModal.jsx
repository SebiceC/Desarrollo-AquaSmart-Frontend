"use client"

import { X, Search } from "lucide-react"

const ViewUserPermissionsModal = ({
  isOpen,
  onClose,
  currentUser,
  userRoles,
  userPermissions,
  permissionsSearchTerm,
  setPermissionsSearchTerm,
  getRoleName,
  roles,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
      {/* Fondo difuminado alrededor del modal */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Contenido del modal */}
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Permisos del usuario: {currentUser?.first_name} {currentUser?.last_name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
          {/* Añadir campo de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar permisos..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]"
                value={permissionsSearchTerm}
                onChange={(e) => setPermissionsSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Actualizar la sección del modal que muestra los roles asignados */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Roles asignados</h3>
            {userRoles && userRoles.length > 0 ? (
              <div className="flex flex-col gap-2 mb-4">
                {userRoles.map((roleId, index) => {
                  const roleName = getRoleName(roleId)
                  return (
                    <div key={`role-${roleId}-${index}`} className="border p-3 rounded-md bg-blue-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{roleName}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Rol</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 mb-4">No tiene roles asignados</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Permisos de grupo</h3>
            {userPermissions.group_permissions && userPermissions.group_permissions.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {userPermissions.group_permissions
                  .filter((perm) => {
                    // Filtrar por término de búsqueda
                    const permName = typeof perm === "string" ? perm : perm.name || ""
                    const permCode = typeof perm === "string" ? "" : perm.codename || ""
                    return (
                      permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                      permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                    )
                  })
                  .map((perm, index) => {
                    // Obtener el nombre y código del permiso
                    const permName = typeof perm === "string" ? perm : perm.name || ""
                    const permCode = typeof perm === "string" ? "" : perm.codename || ""
                    const groupName = typeof perm === "object" && perm !== null ? perm.group_name : ""

                    return (
                      <div key={`group-perm-${index}`} className="border p-3 rounded-md bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{permName}</p>
                            {permCode && <p className="text-sm text-gray-500">{permCode}</p>}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {groupName ? (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{groupName}</span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Rol</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="text-gray-500">No tiene permisos de grupo</p>
            )}

            {/* Mostrar mensaje cuando no hay resultados de búsqueda */}
            {userPermissions.group_permissions &&
              userPermissions.group_permissions.length > 0 &&
              userPermissions.group_permissions.filter((perm) => {
                const permName = typeof perm === "string" ? perm : perm.name || ""
                const permCode = typeof perm === "string" ? "" : perm.codename || ""
                return (
                  permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                  permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                )
              }).length === 0 &&
              permissionsSearchTerm && (
                <p className="text-gray-500 text-sm mt-2">
                  No se encontraron permisos de grupo que coincidan con la búsqueda
                </p>
              )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Permisos directos</h3>
            {userPermissions.direct_permissions && userPermissions.direct_permissions.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {userPermissions.direct_permissions
                  .filter((perm) => {
                    // Filtrar por término de búsqueda
                    const permName = typeof perm === "string" ? perm : perm.name || ""
                    const permCode = typeof perm === "string" ? "" : perm.codename || ""
                    return (
                      permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                      permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                    )
                  })
                  .map((perm, index) => {
                    // Manejar tanto objetos como strings
                    const permName = typeof perm === "string" ? perm : perm.name || perm
                    const permCode = typeof perm === "string" ? "" : perm.codename || perm

                    return (
                      <div key={`direct-perm-${index}`} className="border p-3 rounded-md bg-green-50">
                        <p className="font-medium">{permName}</p>
                        {permCode && <p className="text-sm text-gray-500">{permCode}</p>}
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="text-gray-500">No tiene permisos directos</p>
            )}

            {/* Mostrar mensaje cuando no hay resultados de búsqueda */}
            {userPermissions.direct_permissions &&
              userPermissions.direct_permissions.length > 0 &&
              userPermissions.direct_permissions.filter((perm) => {
                const permName = typeof perm === "string" ? perm : perm.name || perm
                const permCode = typeof perm === "string" ? "" : perm.codename || perm
                return (
                  permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                  permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                )
              }).length === 0 &&
              permissionsSearchTerm && (
                <p className="text-gray-500 text-sm mt-2">
                  No se encontraron permisos directos que coincidan con la búsqueda
                </p>
              )}
          </div>

          {/* Mostrar mensaje cuando no hay resultados en ninguna categoría */}
          {permissionsSearchTerm &&
            ((userPermissions.group_permissions &&
              userPermissions.group_permissions.filter((perm) => {
                const permName = typeof perm === "string" ? perm : perm.name || perm
                const permCode = typeof perm === "string" ? "" : perm.codename || perm
                return (
                  permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                  permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                )
              }).length === 0) ||
              !userPermissions.group_permissions ||
              userPermissions.group_permissions.length === 0) &&
            ((userPermissions.direct_permissions &&
              userPermissions.direct_permissions.filter((perm) => {
                const permName = typeof perm === "string" ? perm : perm.name || perm
                const permCode = typeof perm === "string" ? "" : perm.codename || perm
                return (
                  permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                  permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                )
              }).length === 0) ||
              !userPermissions.direct_permissions ||
              userPermissions.direct_permissions.length === 0) && (
              <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                <p className="text-gray-500">No se encontraron permisos que coincidan con "{permissionsSearchTerm}"</p>
              </div>
            )}
        </div>
        <div className="p-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#365486] hover:bg-[#2f4275] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewUserPermissionsModal

