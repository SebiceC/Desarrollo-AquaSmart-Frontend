"use client"

import { X, Search } from "lucide-react"
import GroupedPermissionsSelector from "./GroupedPermissionsSelector"

const EditRoleModal = ({
  isOpen,
  onClose,
  currentRole,
  editedPermissions,
  setEditedPermissions,
  permissionSearchTerm,
  setPermissionSearchTerm,
  handleSavePermissions,
  isSaving,
  allPermissions,
  groupedPermissions,
  expandedGroups,
  toggleGroupExpansion,
  togglePermission,
}) => {
  if (!isOpen) return null

  // Función para seleccionar/deseleccionar todos los permisos de un modelo
  const toggleModelPermissions = (appLabel, model, permissions, isEditing) => {
    // Para el modo de edición
    const permissionIds = permissions.map((p) => p.id)
    const allSelected = permissionIds.every((id) => editedPermissions.includes(id))

    if (allSelected) {
      // Si todos están seleccionados, deseleccionar todos
      setEditedPermissions((prev) => prev.filter((id) => !permissionIds.includes(id)))
    } else {
      // Si no todos están seleccionados, seleccionar todos
      setEditedPermissions((prev) => {
        const newPermissions = [...prev]
        permissionIds.forEach((id) => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id)
          }
        })
        return newPermissions
      })
    }
  }

  // Función para seleccionar/deseleccionar todos los permisos de una aplicación
  const toggleAppPermissions = (appLabel, models, isEditing) => {
    // Obtener todos los IDs de permisos de esta aplicación
    const allPermissionIds = []
    Object.values(models).forEach((permissions) => {
      permissions.forEach((permission) => {
        allPermissionIds.push(permission.id)
      })
    })

    // Para el modo de edición
    const allSelected = allPermissionIds.every((id) => editedPermissions.includes(id))

    if (allSelected) {
      // Si todos están seleccionados, deseleccionar todos
      setEditedPermissions((prev) => prev.filter((id) => !allPermissionIds.includes(id)))
    } else {
      // Si no todos están seleccionados, seleccionar todos
      setEditedPermissions((prev) => {
        const newPermissions = [...prev]
        allPermissionIds.forEach((id) => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id)
          }
        })
        return newPermissions
      })
    }
  }

  // Función para verificar si todos los permisos de un modelo están seleccionados
  const areAllModelPermissionsSelected = (permissions, isEditing) => {
    const permissionIds = permissions.map((p) => p.id)
    return permissionIds.every((id) => editedPermissions.includes(id))
  }

  // Función para verificar si algunos permisos de un modelo están seleccionados
  const areSomeModelPermissionsSelected = (permissions, isEditing) => {
    const permissionIds = permissions.map((p) => p.id)
    return (
      permissionIds.some((id) => editedPermissions.includes(id)) &&
      !permissionIds.every((id) => editedPermissions.includes(id))
    )
  }

  // Función para verificar si todos los permisos de una aplicación están seleccionados
  const areAllAppPermissionsSelected = (models, isEditing) => {
    const allPermissionIds = []
    Object.values(models).forEach((permissions) => {
      permissions.forEach((permission) => {
        allPermissionIds.push(permission.id)
      })
    })

    return allPermissionIds.every((id) => editedPermissions.includes(id))
  }

  // Función para verificar si algunos permisos de una aplicación están seleccionados
  const areSomeAppPermissionsSelected = (models, isEditing) => {
    const allPermissionIds = []
    Object.values(models).forEach((permissions) => {
      permissions.forEach((permission) => {
        allPermissionIds.push(permission.id)
      })
    })

    return (
      allPermissionIds.some((id) => editedPermissions.includes(id)) &&
      !allPermissionIds.every((id) => editedPermissions.includes(id))
    )
  }

  // Añadir función para filtrar permisos en los modales
  const filterPermissionsBySearchTerm = (permissions, searchTerm) => {
    if (!searchTerm.trim()) return permissions

    return permissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.codename.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
      {/* Fondo difuminado alrededor del modal */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Contenido del modal */}
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Editar permisos del rol: {currentRole?.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar permisos..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={permissionSearchTerm}
                onChange={(e) => setPermissionSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Sección de permisos seleccionados */}
          {editedPermissions.length > 0 && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium mb-2 text-blue-700">
                Permisos seleccionados ({editedPermissions.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {editedPermissions.map((permId) => {
                  const permission = allPermissions.find((p) => p.id === permId)
                  return permission ? (
                    <div
                      key={`selected-${permId}`}
                      className="bg-white border border-blue-200 rounded-md px-2 py-1 flex items-center gap-1 text-sm"
                    >
                      <span className="truncate max-w-[150px]" title={permission.name}>
                        {permission.name}
                      </span>
                      <button
                        onClick={() => togglePermission(permId, true)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Usar el componente de permisos agrupados */}
          <GroupedPermissionsSelector
            isEditing={true}
            groupedPermissions={groupedPermissions}
            permissionSearchTerm={permissionSearchTerm}
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
            toggleAppPermissions={toggleAppPermissions}
            toggleModelPermissions={toggleModelPermissions}
            togglePermission={togglePermission}
            areAllAppPermissionsSelected={areAllAppPermissionsSelected}
            areSomeAppPermissionsSelected={areSomeAppPermissionsSelected}
            areAllModelPermissionsSelected={areAllModelPermissionsSelected}
            areSomeModelPermissionsSelected={areSomeModelPermissionsSelected}
            editedPermissions={editedPermissions}
            newRole={{ permissions: [] }}
            filterPermissionsBySearchTerm={filterPermissionsBySearchTerm}
          />
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
            onClick={handleSavePermissions}
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

export default EditRoleModal

