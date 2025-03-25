"use client"

import { X, Search } from "lucide-react"
import UserRolesManager from "./UserRolesManager"
import GroupedPermissionsSelector from "./GroupedPermissionsSelector"

const EditUserPermissionsModal = ({
  isOpen,
  onClose,
  currentUser,
  userRoles,
  selectedUserRole,
  setSelectedUserRole,
  selectedUserPermissions,
  setSelectedUserPermissions,
  permissionsSearchTerm,
  setPermissionsSearchTerm,
  handleSaveUserPermissions,
  isSaving,
  allPermissions,
  groupedPermissions,
  expandedGroups,
  toggleGroupExpansion,
  toggleUserPermission,
  isPermissionInRole,
  getRoleName,
  roles,
  assignRoleToUser,
  removeRoleFromUser,
  rolePermissions,
}) => {
  if (!isOpen) return null

  // Función para seleccionar/deseleccionar todos los permisos de un modelo
  const toggleModelPermissions = (appLabel, model, permissions) => {
    // Obtener los IDs de los permisos del modelo
    const permissionIds = permissions.map((p) => p.id)

    // Verificar si todos los permisos del modelo están seleccionados
    const allSelected = permissionIds.every((id) => selectedUserPermissions.includes(id))

    if (allSelected) {
      // Si todos están seleccionados, deseleccionar todos
      setSelectedUserPermissions((prev) => prev.filter((id) => !permissionIds.includes(id)))
    } else {
      // Si no todos están seleccionados, seleccionar todos
      setSelectedUserPermissions((prev) => {
        const newPermissions = [...prev]
        permissionIds.forEach((id) => {
          if (!newPermissions.includes(id) && !isPermissionInRole(id)) {
            newPermissions.push(id)
          }
        })
        return newPermissions
      })
    }
  }

  // Función para seleccionar/deseleccionar todos los permisos de una aplicación
  const toggleAppPermissions = (appLabel, models) => {
    // Obtener todos los IDs de permisos de esta aplicación
    const allPermissionIds = []
    Object.values(models).forEach((permissions) => {
      permissions.forEach((permission) => {
        allPermissionIds.push(permission.id)
      })
    })

    // Verificar si todos los permisos de la aplicación están seleccionados
    const allSelected = allPermissionIds.every((id) => selectedUserPermissions.includes(id) || isPermissionInRole(id))

    if (allSelected) {
      // Si todos están seleccionados, deseleccionar todos (excepto los del rol)
      setSelectedUserPermissions((prev) =>
        prev.filter((id) => !allPermissionIds.includes(id) || isPermissionInRole(id)),
      )
    } else {
      // Si no todos están seleccionados, seleccionar todos (excepto los del rol)
      setSelectedUserPermissions((prev) => {
        const newPermissions = [...prev]
        allPermissionIds.forEach((id) => {
          if (!newPermissions.includes(id) && !isPermissionInRole(id)) {
            newPermissions.push(id)
          }
        })
        return newPermissions
      })
    }
  }

  // Función para verificar si todos los permisos de un modelo están seleccionados
  const areAllModelPermissionsSelected = (permissions) => {
    const permissionIds = permissions.map((p) => p.id)
    return permissionIds.every((id) => selectedUserPermissions.includes(id) || isPermissionInRole(id))
  }

  // Función para verificar si algunos permisos de un modelo están seleccionados
  const areSomeModelPermissionsSelected = (permissions) => {
    const permissionIds = permissions.map((p) => p.id)
    return (
      permissionIds.some((id) => selectedUserPermissions.includes(id) || isPermissionInRole(id)) &&
      !permissionIds.every((id) => selectedUserPermissions.includes(id) || isPermissionInRole(id))
    )
  }

  // Función para verificar si todos los permisos de una aplicación están seleccionados
  const areAllAppPermissionsSelected = (models) => {
    const allPermissionIds = []
    Object.values(models).forEach((permissions) => {
      permissions.forEach((permission) => {
        allPermissionIds.push(permission.id)
      })
    })

    return allPermissionIds.every((id) => selectedUserPermissions.includes(id) || isPermissionInRole(id))
  }

  // Función para verificar si algunos permisos de una aplicación están seleccionados
  const areSomeAppPermissionsSelected = (models) => {
    const allPermissionIds = []
    Object.values(models).forEach((permissions) => {
      permissions.forEach((permission) => {
        allPermissionIds.push(permission.id)
      })
    })

    return (
      allPermissionIds.some((id) => selectedUserPermissions.includes(id) || isPermissionInRole(id)) &&
      !allPermissionIds.every((id) => selectedUserPermissions.includes(id) || isPermissionInRole(id))
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
      {/* Fondo difuminado alrededor del modal */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Contenido del modal */}
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Editar permisos: {currentUser?.first_name} {currentUser?.last_name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
          {/* Gestor de roles */}
          <UserRolesManager
            userRoles={userRoles}
            selectedUserRole={selectedUserRole}
            setSelectedUserRole={setSelectedUserRole}
            currentUser={currentUser}
            roles={roles}
            getRoleName={getRoleName}
            assignRoleToUser={assignRoleToUser}
            removeRoleFromUser={removeRoleFromUser}
          />

          {/* Sección de permisos seleccionados */}
          {(selectedUserPermissions.length > 0 ||
            userRoles.some((roleId) => rolePermissions[roleId] && rolePermissions[roleId].length > 0)) && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium mb-2 text-blue-700">
                Permisos seleccionados (
                {selectedUserPermissions.length +
                  userRoles.reduce((total, roleId) => {
                    return total + (rolePermissions[roleId] ? rolePermissions[roleId].length : 0)
                  }, 0)}
                )
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Permisos directos */}
                {selectedUserPermissions.map((permId) => {
                  const permission = allPermissions.find((p) => p.id === permId)
                  return permission ? (
                    <div
                      key={`selected-direct-${permId}`}
                      className="bg-white border border-blue-200 rounded-md px-2 py-1 flex items-center gap-1 text-sm"
                    >
                      <span className="truncate max-w-[150px]" title={permission.name}>
                        {permission.name}
                      </span>
                      <button
                        onClick={() => toggleUserPermission(permId)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null
                })}

                {/* Permisos de todos los roles */}
                {userRoles.map((roleId) => {
                  if (!rolePermissions[roleId]) return null

                  return rolePermissions[roleId].map((permId) => {
                    // No mostrar si ya está en los permisos directos
                    if (selectedUserPermissions.includes(permId)) return null

                    // No mostrar duplicados de otros roles
                    const isAlreadyShown = userRoles
                      .slice(0, userRoles.indexOf(roleId))
                      .some((prevRoleId) => rolePermissions[prevRoleId] && rolePermissions[prevRoleId].includes(permId))

                    if (isAlreadyShown) return null

                    const permission = allPermissions.find((p) => p.id === permId)
                    const roleName = getRoleName(roleId)

                    return permission ? (
                      <div
                        key={`selected-role-${roleId}-${permId}`}
                        className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1 flex items-center gap-1 text-sm"
                      >
                        <span className="truncate max-w-[150px]" title={permission.name}>
                          {permission.name}
                        </span>
                        <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">{roleName}</span>
                      </div>
                    ) : null
                  })
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Permisos adicionales</h3>

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

            {/* Usar el componente de permisos agrupados */}
            <GroupedPermissionsSelector
              groupedPermissions={groupedPermissions}
              permissionsSearchTerm={permissionsSearchTerm}
              expandedGroups={expandedGroups}
              toggleGroupExpansion={toggleGroupExpansion}
              toggleAppPermissions={toggleAppPermissions}
              toggleModelPermissions={toggleModelPermissions}
              toggleUserPermission={toggleUserPermission}
              areAllAppPermissionsSelected={areAllAppPermissionsSelected}
              areSomeAppPermissionsSelected={areSomeAppPermissionsSelected}
              areAllModelPermissionsSelected={areAllModelPermissionsSelected}
              areSomeModelPermissionsSelected={areSomeModelPermissionsSelected}
              selectedUserPermissions={selectedUserPermissions}
              isPermissionInRole={isPermissionInRole}
            />
          </div>
        </div>
        <div className="p-3 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveUserPermissions}
            className="px-4 py-2 bg-[#365486] hover:bg-[#2f4275] text-white rounded-lg text-sm font-medium transition-colors flex items-center"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditUserPermissionsModal

