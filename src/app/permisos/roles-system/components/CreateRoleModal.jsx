"use client"

import { X, Search, AlertCircle } from "lucide-react"
import GroupedPermissionsSelector from "./GroupedPermissionsSelector"

const CreateRoleModal = ({
  isOpen,
  onClose,
  newRole,
  setNewRole,
  nameError,
  setNameError,
  permissionsError,
  permissionSearchTerm,
  setPermissionSearchTerm,
  handleSaveNewRole,
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
    // Para el modo de creación
    const permissionIds = permissions.map((p) => p.id)
    const allSelected = permissionIds.every((id) => newRole.permissions.includes(id))

    if (allSelected) {
      // Si todos están seleccionados, deseleccionar todos
      setNewRole((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((id) => !permissionIds.includes(id)),
      }))
    } else {
      // Si no todos están seleccionados, seleccionar todos
      setNewRole((prev) => {
        const currentPermissions = Array.isArray(prev.permissions) ? [...prev.permissions] : []
        permissionIds.forEach((id) => {
          if (!currentPermissions.includes(id)) {
            currentPermissions.push(id)
          }
        })
        return {
          ...prev,
          permissions: currentPermissions,
        }
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

    // Para el modo de creación
    const allSelected = allPermissionIds.every((id) => newRole.permissions.includes(id))

    if (allSelected) {
      // Si todos están seleccionados, deseleccionar todos
      setNewRole((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((id) => !allPermissionIds.includes(id)),
      }))
    } else {
      // Si no todos están seleccionados, seleccionar todos
      setNewRole((prev) => {
        const currentPermissions = Array.isArray(prev.permissions) ? [...prev.permissions] : []
        allPermissionIds.forEach((id) => {
          if (!currentPermissions.includes(id)) {
            currentPermissions.push(id)
          }
        })
        return {
          ...prev,
          permissions: currentPermissions,
        }
      })
    }
  }

  // Función para verificar si todos los permisos de un modelo están seleccionados
  const areAllModelPermissionsSelected = (permissions, isEditing) => {
    const permissionIds = permissions.map((p) => p.id)
    return permissionIds.every((id) => newRole.permissions.includes(id))
  }

  // Función para verificar si algunos permisos de un modelo están seleccionados
  const areSomeModelPermissionsSelected = (permissions, isEditing) => {
    const permissionIds = permissions.map((p) => p.id)
    return (
      permissionIds.some((id) => newRole.permissions.includes(id)) &&
      !permissionIds.every((id) => newRole.permissions.includes(id))
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

    return allPermissionIds.every((id) => newRole.permissions.includes(id))
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
      allPermissionIds.some((id) => newRole.permissions.includes(id)) &&
      !allPermissionIds.every((id) => newRole.permissions.includes(id))
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

  // Función para manejar el cambio en el campo de nombre
  const handleNameChange = (e) => {
    // Limitar a 20 caracteres
    const value = e.target.value.slice(0, 20)

    setNewRole({ ...newRole, name: value })

    // Limpiar el error cuando el usuario cambia el nombre
    if (nameError) setNameError("")
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
      {/* Fondo difuminado alrededor del modal */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Contenido del modal */}
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Crear nuevo rol</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
          <div className="mb-4">
            <label htmlFor="roleName" className="block text-sm font-medium mb-1">
              Nombre del rol
            </label>
            <div className="relative">
              <input
                id="roleName"
                value={newRole.name}
                onChange={handleNameChange}
                placeholder="Ingrese el nombre del rol"
                maxLength={20}
                className={`w-full px-3 py-2 border ${nameError ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <div className="absolute right-2 top-2 text-xs text-gray-500">{newRole.name.length}/20</div>
            </div>
            {nameError && (
              <div className="flex items-center mt-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                <p>{nameError}</p>
              </div>
            )}
          </div>

          <div className="mb-4 mt-6">
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
          {newRole.permissions.length > 0 && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium mb-2 text-blue-700">
                Permisos seleccionados ({newRole.permissions.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {newRole.permissions.map((permId) => {
                  const permission = allPermissions.find((p) => p.id === permId)
                  return permission ? (
                    <div
                      key={`selected-new-${permId}`}
                      className="bg-white border border-blue-200 rounded-md px-2 py-1 flex items-center gap-1 text-sm"
                    >
                      <span className="truncate max-w-[150px]" title={permission.name}>
                        {permission.name}
                      </span>
                      <button
                        onClick={() => togglePermission(permId, false)}
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

          {/* Mostrar error de permisos si existe */}
          {permissionsError && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <p>{permissionsError}</p>
              </div>
            </div>
          )}

          {/* Usar el componente de permisos agrupados */}
          <GroupedPermissionsSelector
            isEditing={false}
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
            editedPermissions={[]}
            newRole={newRole}
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
            onClick={handleSaveNewRole}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              newRole.name.trim() && !isSaving
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creando...
              </>
            ) : (
              "Crear rol"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateRoleModal

