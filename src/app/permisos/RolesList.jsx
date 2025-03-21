"use client"

import { useState, useEffect } from "react"
import { Search, ArrowUpDown, Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import NavBar from "../../components/NavBar"
import axios from "axios"

const RolesSystem = () => {
  // Estados
  const [roles, setRoles] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [groupedPermissions, setGroupedPermissions] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState(null)
  const [editedPermissions, setEditedPermissions] = useState([])
  const [newRole, setNewRole] = useState({ name: "", permissions: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  // Añadir un nuevo estado para el modal de permisos adicionales
  const [isViewMorePermissionsModalOpen, setIsViewMorePermissionsModalOpen] = useState(false)
  const [currentPermissions, setCurrentPermissions] = useState([])
  const [permissionSearchTerm, setPermissionSearchTerm] = useState("")
  // Añadir estado para el error de nombre duplicado
  const [nameError, setNameError] = useState("")

  // Configuración de axios
  const setupAxios = () => {
    const token = localStorage.getItem("token")
    const API_URL = import.meta.env.VITE_APP_API_URL

    return {
      instance: axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Token ${token}` },
      }),
      API_URL,
    }
  }

  // Función para obtener todos los roles (grupos)
  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      const { instance } = setupAxios()

      const response = await instance.get("/admin/groups/")
      setRoles(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error al obtener roles:", error)
      setError("Error al cargar los roles. Por favor, intente de nuevo.")
      setIsLoading(false)
    }
  }

  // Función para obtener todos los permisos
  const fetchPermissions = async () => {
    try {
      const { instance } = setupAxios()

      const response = await instance.get("/admin/permissions")
      setAllPermissions(response.data)
    } catch (error) {
      console.error("Error al obtener permisos:", error)
      setError("Error al cargar los permisos. Por favor, intente de nuevo.")
    }
  }

  // Función para obtener permisos agrupados
  const fetchGroupedPermissions = async () => {
    try {
      const { instance } = setupAxios()

      const response = await instance.get("/admin/grouped_permissions")
      setGroupedPermissions(response.data)
    } catch (error) {
      console.error("Error al obtener permisos agrupados:", error)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchRoles()
    fetchPermissions()
    fetchGroupedPermissions()
  }, [])

  // Filtrar roles según el término de búsqueda
  const filteredRoles = roles.filter(
    (role) =>
      role.id.toString().includes(searchTerm.toLowerCase()) ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Obtener el nombre de un permiso por su ID
  const getPermissionName = (permissionId) => {
    const permission = allPermissions.find((p) => p.id === permissionId)
    return permission ? permission.name : "Permiso desconocido"
  }

  // Verificar si un nombre de rol ya existe
  const roleNameExists = (name) => {
    return roles.some((role) => role.name.toLowerCase() === name.toLowerCase())
  }

  // Manejadores de eventos para roles
  const handleEditPermissions = async (role) => {
    setCurrentRole(role)

    try {
      const { instance } = setupAxios()

      // Obtener los permisos actuales del rol
      const response = await instance.get(`/admin/groups/${role.id}/permissions`)

      // Extraer los IDs de los permisos
      const permissionIds = response.data.map((p) => p.id)
      setEditedPermissions(permissionIds)
      setIsEditModalOpen(true)
    } catch (error) {
      console.error("Error al obtener permisos del rol:", error)
      alert("Error al obtener los permisos del rol. Por favor, intente de nuevo.")
    }
  }

  const handleSavePermissions = async () => {
    if (currentRole) {
      try {
        const { instance } = setupAxios()

        // Obtener los permisos actuales del rol
        const currentPermissionsResponse = await instance.get(`/admin/groups/${currentRole.id}/permissions`)
        const currentPermissionIds = currentPermissionsResponse.data.map((p) => p.id)

        // Permisos a añadir (están en editedPermissions pero no en currentPermissionIds)
        const permissionsToAdd = editedPermissions.filter((id) => !currentPermissionIds.includes(id))

        // Permisos a quitar (están en currentPermissionIds pero no en editedPermissions)
        const permissionsToRemove = currentPermissionIds.filter((id) => !editedPermissions.includes(id))

        // Asignar nuevos permisos si hay alguno
        if (permissionsToAdd.length > 0) {
          await instance.post(`/admin/groups/${currentRole.id}/assign_permissions`, {
            permission_ids: permissionsToAdd,
          })
        }

        // Quitar permisos si hay alguno
        if (permissionsToRemove.length > 0) {
          await instance.post(`/admin/groups/${currentRole.id}/remove_permissions`, {
            permission_ids: permissionsToRemove,
          })
        }

        // Actualizar la lista de roles
        fetchRoles()
        setIsEditModalOpen(false)
      } catch (error) {
        console.error("Error al guardar permisos:", error)
        alert("Error al guardar los permisos. Por favor, intente de nuevo.")
      }
    }
  }

  const handleDeleteRole = (role) => {
    setCurrentRole(role)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteRole = async () => {
    if (currentRole) {
      try {
        const { instance } = setupAxios()

        await instance.delete(`/admin/groups/${currentRole.id}/`)

        // Actualizar la lista de roles
        setRoles(roles.filter((role) => role.id !== currentRole.id))
        setIsDeleteModalOpen(false)
      } catch (error) {
        console.error("Error al eliminar rol:", error)
        alert("Error al eliminar el rol. Por favor, intente de nuevo.")
      }
    }
  }

  const handleCreateRole = () => {
    setNewRole({ name: "", permissions: [] })
    setPermissionSearchTerm("") // Limpiar la búsqueda
    setNameError("") // Limpiar errores previos
    setIsCreateModalOpen(true)
  }

  const handleSaveNewRole = async () => {
    if (newRole.name.trim()) {
      // Verificar si el nombre ya existe
      if (roleNameExists(newRole.name.trim())) {
        setNameError("Ya existe un rol con este nombre. Por favor, use un nombre diferente.")
        return
      }

      try {
        const { instance } = setupAxios()

        // Primero crear el rol
        const createResponse = await instance.post("/admin/groups/", {
          name: newRole.name,
        })

        const createdRole = createResponse.data

        // Si hay permisos seleccionados, asignarlos al nuevo rol
        if (newRole.permissions.length > 0) {
          await instance.post(`/admin/groups/${createdRole.id}/assign_permissions`, {
            permission_ids: newRole.permissions,
          })
        }

        // Actualizar la lista de roles
        fetchRoles()
        setIsCreateModalOpen(false)
      } catch (error) {
        console.error("Error al crear rol:", error)

        // Verificar si el error es por nombre duplicado
        if (error.response && error.response.data && error.response.data.name) {
          setNameError(error.response.data.name[0] || "Error al crear el rol. El nombre podría estar duplicado.")
        } else {
          alert("Error al crear el rol. Por favor, intente de nuevo.")
        }
      }
    }
  }

  const togglePermission = (permissionId, isEditing) => {
    if (isEditing) {
      setEditedPermissions((prev) =>
        prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
      )
    } else {
      setNewRole((prev) => {
        // Asegurarse de que prev.permissions sea un array
        const currentPermissions = Array.isArray(prev.permissions) ? prev.permissions : []

        return {
          ...prev,
          permissions: currentPermissions.includes(permissionId)
            ? currentPermissions.filter((id) => id !== permissionId)
            : [...currentPermissions, permissionId],
        }
      })
    }
  }

  // Función auxiliar para combinar clases de Tailwind
  const cn = (...classes) => {
    return classes.filter(Boolean).join(" ")
  }

  // Renderizar mensaje de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Cargando datos...</p>
        </div>
      </div>
    )
  }

  // Renderizar mensaje de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-lg max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              fetchRoles()
              fetchPermissions()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  // Modificar la función que muestra los permisos adicionales
  const handleViewMorePermissions = (permissions) => {
    setCurrentPermissions(permissions.slice(3))
    setIsViewMorePermissionsModalOpen(true)
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
    <div>
      <NavBar />
      <div className="min-h-screen flex flex-col mt-15">
        <div className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h1 className="text-2xl font-semibold mb-6 text-center">Gestión de roles</h1>

            <div className="flex justify-between items-center mb-6">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID o nombre"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={handleCreateRole}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear nuevo rol
              </button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        <div className="flex items-center">
                          ID
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Permisos</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-gray-500">
                          No se encontraron roles
                        </td>
                      </tr>
                    ) : (
                      filteredRoles.map((role) => (
                        <tr key={role.id} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{role.id}</td>
                          <td className="px-4 py-3 text-sm">{role.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {role.permissions && role.permissions.length > 0 ? (
                                role.permissions.slice(0, 3).map((perm) => (
                                  <span
                                    key={perm.id}
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
                                    onClick={() => handleViewMorePermissions(role.permissions)}
                                  >
                                    +{role.permissions.length - 3} más
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8 rounded-md flex items-center"
                                onClick={() => handleEditPermissions(role)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Permisos
                              </button>
                              <button
                                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 h-8 rounded-md flex items-center"
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
            </div>
          </div>
        </div>

        {/* Modal para editar permisos de rol */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Editar permisos del rol: {currentRole?.name}</h2>
              </div>
              <div className="p-6 overflow-y-auto flex-grow">
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

                {Object.entries(groupedPermissions).map(([appLabel, models]) => {
                  // Verificar si hay permisos que coincidan con la búsqueda en este grupo
                  let hasMatchingPermissions = false

                  for (const [model, permissions] of Object.entries(models)) {
                    const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionSearchTerm)
                    if (filteredPermissions.length > 0) {
                      hasMatchingPermissions = true
                      break
                    }
                  }

                  // Solo mostrar el grupo si tiene permisos que coincidan con la búsqueda
                  if (!hasMatchingPermissions && permissionSearchTerm.trim()) {
                    return null
                  }

                  return (
                    <div key={appLabel} className="mb-8">
                      <h3 className="text-lg font-medium mb-4 capitalize">{appLabel.replace("_", " ")}</h3>

                      {Object.entries(models).map(([model, permissions]) => {
                        const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionSearchTerm)

                        // No mostrar este modelo si no hay permisos que coincidan con la búsqueda
                        if (filteredPermissions.length === 0 && permissionSearchTerm.trim()) {
                          return null
                        }

                        return (
                          <div key={model} className="mb-6">
                            <h4 className="text-md font-medium mb-2 capitalize">{model.replace("_", " ")}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {filteredPermissions.map((permission) => (
                                <div key={permission.id} className="flex items-start space-x-2 border p-3 rounded-md">
                                  <input
                                    type="checkbox"
                                    id={`edit-${permission.id}`}
                                    checked={editedPermissions.includes(permission.id)}
                                    onChange={() => togglePermission(permission.id, true)}
                                    className="mt-1"
                                  />
                                  <div className="grid gap-1">
                                    <label
                                      htmlFor={`edit-${permission.id}`}
                                      className="text-sm font-medium leading-none cursor-pointer"
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
                    </div>
                  )
                })}
              </div>
              <div className="p-6 border-t flex justify-end space-x-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para crear nuevo rol */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Crear nuevo rol</h2>
              </div>
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="mb-4">
                  <label htmlFor="roleName" className="block text-sm font-medium mb-1">
                    Nombre del rol
                  </label>
                  <input
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) => {
                      setNewRole({ ...newRole, name: e.target.value })
                      // Limpiar el error cuando el usuario cambia el nombre
                      if (nameError) setNameError("")
                    }}
                    placeholder="Ingrese el nombre del rol"
                    className={`w-full px-3 py-2 border ${nameError ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
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

                {Object.entries(groupedPermissions).map(([appLabel, models]) => {
                  // Verificar si hay permisos que coincidan con la búsqueda en este grupo
                  let hasMatchingPermissions = false

                  for (const [model, permissions] of Object.entries(models)) {
                    const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionSearchTerm)
                    if (filteredPermissions.length > 0) {
                      hasMatchingPermissions = true
                      break
                    }
                  }

                  // Solo mostrar el grupo si tiene permisos que coincidan con la búsqueda
                  if (!hasMatchingPermissions && permissionSearchTerm.trim()) {
                    return null
                  }

                  return (
                    <div key={appLabel} className="mb-8">
                      <h3 className="text-lg font-medium mb-4 capitalize">{appLabel.replace("_", " ")}</h3>

                      {Object.entries(models).map(([model, permissions]) => {
                        const filteredPermissions = filterPermissionsBySearchTerm(permissions, permissionSearchTerm)

                        // No mostrar este modelo si no hay permisos que coincidan con la búsqueda
                        if (filteredPermissions.length === 0 && permissionSearchTerm.trim()) {
                          return null
                        }

                        return (
                          <div key={model} className="mb-6">
                            <h4 className="text-md font-medium mb-2 capitalize">{model.replace("_", " ")}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {filteredPermissions.map((permission) => (
                                <div key={permission.id} className="flex items-start space-x-2 border p-3 rounded-md">
                                  <input
                                    type="checkbox"
                                    id={`new-${permission.id}`}
                                    checked={newRole.permissions.includes(permission.id)}
                                    onChange={() => togglePermission(permission.id, false)}
                                    className="mt-1"
                                  />
                                  <div className="grid gap-1">
                                    <label
                                      htmlFor={`new-${permission.id}`}
                                      className="text-sm font-medium leading-none cursor-pointer"
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
                    </div>
                  )
                })}
              </div>
              <div className="p-6 border-t flex justify-end space-x-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNewRole}
                  disabled={!newRole.name.trim()}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    newRole.name.trim()
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Crear rol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para confirmar eliminación */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Confirmar eliminación</h2>
              </div>
              <div className="p-6">
                <p>¿Estás seguro de que deseas eliminar el rol "{currentRole?.name}"?</p>
                <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
              </div>
              <div className="p-6 border-t flex justify-end space-x-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteRole}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para ver más permisos */}
        {isViewMorePermissionsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Permisos adicionales</h2>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {currentPermissions.map((perm) => (
                    <div key={perm.id} className="p-2 border rounded-md">
                      <p className="font-medium">{perm.name}</p>
                      <p className="text-sm text-gray-500">{perm.codename}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t flex justify-end">
                <button
                  onClick={() => setIsViewMorePermissionsModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RolesSystem