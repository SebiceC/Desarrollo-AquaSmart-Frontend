"use client"

import { ChevronDown, ChevronRight } from "lucide-react"

const GroupedPermissionsSelector = ({
  isEditing,
  groupedPermissions,
  permissionSearchTerm,
  expandedGroups,
  toggleGroupExpansion,
  toggleAppPermissions,
  toggleModelPermissions,
  togglePermission,
  areAllAppPermissionsSelected,
  areSomeAppPermissionsSelected,
  areAllModelPermissionsSelected,
  areSomeModelPermissionsSelected,
  editedPermissions,
  newRole,
  filterPermissionsBySearchTerm,
}) => {
  return (
    <>
      {Object.entries(groupedPermissions)
        .filter(([appLabel, models]) => {
          // Verificar si hay permisos que coincidan con la búsqueda en este grupo
          if (!permissionSearchTerm.trim()) return true

          for (const [model, permissions] of Object.entries(models)) {
            const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionSearchTerm)
            if (filteredPermissions.length > 0) {
              return true
            }
          }
          return false
        })
        .map(([appLabel, models]) => {
          const isAppExpanded = expandedGroups[appLabel]
          const allAppSelected = areAllAppPermissionsSelected(models, isEditing)
          const someAppSelected = areSomeAppPermissionsSelected(models, isEditing)

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
                    id={`app-${appLabel}-${isEditing ? "edit" : "new"}`}
                    checked={allAppSelected}
                    className={`mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                      someAppSelected ? "indeterminate" : ""
                    }`}
                    onChange={() => toggleAppPermissions(appLabel, models, isEditing)}
                    ref={(el) => {
                      if (el && someAppSelected) {
                        el.indeterminate = true
                      }
                    }}
                  />
                  <label
                    htmlFor={`app-${appLabel}-${isEditing ? "edit" : "new"}`}
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
                      if (!permissionSearchTerm.trim()) return true

                      const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionSearchTerm)
                      return filteredPermissions.length > 0
                    })
                    .map(([model, permissions]) => {
                      const allModelSelected = areAllModelPermissionsSelected(permissions, isEditing)
                      const someModelSelected = areSomeModelPermissionsSelected(permissions, isEditing)
                      const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionSearchTerm)

                      return (
                        <div key={model} className="mb-6 ml-6">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id={`model-${appLabel}-${model}-${isEditing ? "edit" : "new"}`}
                              checked={allModelSelected}
                              className={`mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                                someModelSelected ? "indeterminate" : ""
                              }`}
                              onChange={() => toggleModelPermissions(appLabel, model, permissions, isEditing)}
                              ref={(el) => {
                                if (el && someModelSelected) {
                                  el.indeterminate = true
                                }
                              }}
                            />
                            <label
                              htmlFor={`model-${appLabel}-${model}-${isEditing ? "edit" : "new"}`}
                              className="text-md font-medium capitalize cursor-pointer"
                            >
                              {model.replace("_", " ")}
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                            {filteredPermissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-start space-x-2 border p-3 rounded-md overflow-hidden"
                              >
                                <input
                                  type="checkbox"
                                  id={`${isEditing ? "edit" : "new"}-${permission.id}`}
                                  checked={
                                    isEditing
                                      ? editedPermissions.includes(permission.id)
                                      : newRole.permissions.includes(permission.id)
                                  }
                                  onChange={() => togglePermission(permission.id, isEditing)}
                                  className="mt-1"
                                />
                                <div className="grid gap-1">
                                  <label
                                    htmlFor={`${isEditing ? "edit" : "new"}-${permission.id}`}
                                    className="text-sm font-medium leading-tight cursor-pointer break-words"
                                  >
                                    {permission.name}
                                  </label>
                                  <p className="text-sm text-gray-500">{permission.codename}</p>
                                </div>
                              </div>
                            ))}
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

