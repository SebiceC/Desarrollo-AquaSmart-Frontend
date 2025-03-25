"use client"

import { ChevronDown, ChevronRight } from "lucide-react"

const GroupedPermissionsSelector = ({
  groupedPermissions,
  permissionsSearchTerm,
  expandedGroups,
  toggleGroupExpansion,
  toggleAppPermissions,
  toggleModelPermissions,
  toggleUserPermission,
  areAllAppPermissionsSelected,
  areSomeAppPermissionsSelected,
  areAllModelPermissionsSelected,
  areSomeModelPermissionsSelected,
  selectedUserPermissions,
  isPermissionInRole,
}) => {
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
    <>
      {Object.entries(groupedPermissions)
        .filter(([appLabel, models]) => {
          // Verificar si hay permisos que coincidan con la búsqueda en este grupo
          if (!permissionsSearchTerm.trim()) return true

          for (const [model, permissions] of Object.entries(models)) {
            const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionsSearchTerm)
            if (filteredPermissions.length > 0) {
              return true
            }
          }
          return false
        })
        .map(([appLabel, models]) => {
          const isAppExpanded = expandedGroups[appLabel]
          const allAppSelected = areAllAppPermissionsSelected(models)
          const someAppSelected = areSomeAppPermissionsSelected(models)

          return (
            <div key={appLabel} className="mb-8">
              <div className="flex items-center mb-4">
                <button
                  onClick={() => toggleGroupExpansion(appLabel)}
                  className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {isAppExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`app-${appLabel}`}
                    checked={allAppSelected}
                    className={`mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                      someAppSelected ? "indeterminate" : ""
                    }`}
                    onChange={() => toggleAppPermissions(appLabel, models)}
                    ref={(el) => {
                      if (el && someAppSelected) {
                        el.indeterminate = true
                      }
                    }}
                  />
                  <label
                    htmlFor={`app-${appLabel}`}
                    className="text-lg font-medium capitalize cursor-pointer"
                    onClick={() => toggleGroupExpansion(appLabel)}
                  >
                    {appLabel.replace("_", " ")}
                  </label>
                </div>
              </div>

              {isAppExpanded && (
                <>
                  {Object.entries(models)
                    .filter(([model, permissions]) => {
                      // No mostrar este modelo si no hay permisos que coincidan con la búsqueda
                      if (!permissionsSearchTerm.trim()) return true

                      const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionsSearchTerm)
                      return filteredPermissions.length > 0
                    })
                    .map(([model, permissions]) => {
                      const allModelSelected = areAllModelPermissionsSelected(permissions)
                      const someModelSelected = areSomeModelPermissionsSelected(permissions)
                      const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionsSearchTerm)

                      return (
                        <div key={model} className="mb-6 ml-6">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id={`model-${appLabel}-${model}`}
                              checked={allModelSelected}
                              className={`mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                                someModelSelected ? "indeterminate" : ""
                              }`}
                              onChange={() => toggleModelPermissions(appLabel, model, permissions)}
                              ref={(el) => {
                                if (el && someModelSelected) {
                                  el.indeterminate = true
                                }
                              }}
                            />
                            <label
                              htmlFor={`model-${appLabel}-${model}`}
                              className="text-md font-medium capitalize cursor-pointer"
                            >
                              {model.replace("_", " ")}
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                            {filteredPermissions.map((permission) => {
                              const isInRole = isPermissionInRole(permission.id)
                              return (
                                <div
                                  key={permission.id}
                                  className={`flex items-start space-x-2 border p-3 rounded-md overflow-hidden ${isInRole ? "bg-blue-50" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    id={`perm-${permission.id}`}
                                    checked={selectedUserPermissions.includes(permission.id) || isInRole}
                                    onChange={() => toggleUserPermission(permission.id)}
                                    disabled={isInRole}
                                    className="mt-1"
                                  />
                                  <div className="grid gap-1">
                                    <div className="flex items-center">
                                      <label
                                        htmlFor={`perm-${permission.id}`}
                                        className="text-sm font-medium leading-tight cursor-pointer break-words"
                                      >
                                        {permission.name}
                                      </label>
                                      {isInRole && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                          Del rol
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500">{permission.codename}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                </>
              )}
            </div>
          )
        })}
    </>
  )
}

export default GroupedPermissionsSelector

