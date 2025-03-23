"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, AlertCircle, CheckCircle, Info, X } from "lucide-react"
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
  // Añadir un nuevo estado para el término de búsqueda en el modal de permisos adicionales
  const [morePermissionsSearchTerm, setMorePermissionsSearchTerm] = useState("")
  // Añadir estado para el error de permisos
  const [permissionsError, setPermissionsError] = useState("")

  // Estados para notificaciones y confirmaciones
  const [notification, setNotification] = useState(null)
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmAction: null,
    type: "info", // info, warning, success, error
  })
  const [isSaving, setIsSaving] = useState(false)

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

  // Función para mostrar notificaciones
  const showNotification = (message, type = "info", duration = 5000) => {
    setNotification({ message, type })

    // Auto-cerrar la notificación después del tiempo especificado
    if (duration) {
      setTimeout(() => {
        setNotification(null)
      }, duration)
    }
  }

  // Función para mostrar modal de confirmación
  const showConfirmation = (title, message, confirmAction, type = "info") => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      confirmAction,
      type,
    })
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
      showNotification("Error al cargar los roles. Por favor, intente de nuevo.", "error")
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
      showNotification("Error al cargar los permisos. Por favor, intente de nuevo.", "error")
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
      showNotification("Error al cargar los permisos agrupados.", "error")
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

  // Validar que el nombre del rol solo contenga letras
  const validateRoleName = (name) => {
    // Verificar si está vacío
    if (!name.trim()) {
      return "El nombre del rol no puede estar vacío."
    }

    // Verificar si solo contiene letras y espacios
    // Expresión regular que permite letras (incluyendo acentos) y espacios
    const lettersOnly = /^[a-zA-ZÀ-ÿ\s]+$/
    if (!lettersOnly.test(name)) {
      return "El nombre del rol solo puede contener letras (sin números ni caracteres especiales)."
    }

    return ""
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
      showNotification("Error al obtener los permisos del rol. Por favor, intente de nuevo.", "error")
    }
  }

  const handleSavePermissions = async () => {
    if (currentRole) {
      // Verificar si hay al menos un permiso seleccionado
      if (editedPermissions.length === 0) {
        showConfirmation(
          "Advertencia",
          "Estás a punto de guardar un rol sin permisos. ¿Estás seguro de que deseas continuar?",
          async () => {
            await saveRolePermissions()
          },
          "warning",
        )
      } else {
        await saveRolePermissions()
      }
    }
  }

  const saveRolePermissions = async () => {
    try {
      setIsSaving(true)
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
      await fetchRoles()
      setIsEditModalOpen(false)
      showNotification(`Permisos del rol "${currentRole.name}" actualizados correctamente.`, "success")
    } catch (error) {
      console.error("Error al guardar permisos:", error)

      // Mostrar mensaje de error específico si viene del backend
      if (error.response && error.response.data && error.response.data.detail) {
        showNotification(`Error: ${error.response.data.detail}`, "error")
      } else {
        showNotification("Error al guardar los permisos. Por favor, intente de nuevo.", "error")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRole = (role) => {
    setCurrentRole(role)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteRole = async () => {
    if (currentRole) {
      try {
        setIsSaving(true)
        const { instance } = setupAxios()

        await instance.delete(`/admin/groups/${currentRole.id}/`)

        // Actualizar la lista de roles
        setRoles(roles.filter((role) => role.id !== currentRole.id))
        setIsDeleteModalOpen(false)
        showNotification(`Rol "${currentRole.name}" eliminado correctamente.`, "success")
      } catch (error) {
        console.error("Error al eliminar rol:", error)

        // Mostrar mensaje de error específico si viene del backend
        if (error.response && error.response.data) {
          if (error.response.data.detail) {
            showNotification(`Error: ${error.response.data.detail}`, "error")
          } else if (typeof error.response.data === "string") {
            showNotification(`Error: ${error.response.data}`, "error")
          } else {
            showNotification("Error al eliminar el rol. Puede que tenga usuarios asignados.", "error")
          }
        } else {
          showNotification("Error al eliminar el rol. Por favor, intente de nuevo.", "error")
        }
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleCreateRole = () => {
    setNewRole({ name: "", permissions: [] })
    setPermissionSearchTerm("") // Limpiar la búsqueda
    setNameError("") // Limpiar errores previos
    setPermissionsError("") // Limpiar errores de permisos
    setIsCreateModalOpen(true)
  }

  const handleSaveNewRole = async () => {
    // Limpiar errores previos
    setNameError("")
    setPermissionsError("")

    // Validar el nombre del rol
    const nameValidationError = validateRoleName(newRole.name)
    if (nameValidationError) {
      setNameError(nameValidationError)
      return
    }

    // Verificar si el nombre ya existe
    if (roleNameExists(newRole.name.trim())) {
      setNameError("Ya existe un rol con este nombre. Por favor, use un nombre diferente.")
      return
    }

    // Validar que se haya seleccionado al menos un permiso
    if (!newRole.permissions.length) {
      // Mostrar confirmación en lugar de error directo
      showConfirmation(
        "Advertencia",
        "Estás a punto de crear un rol sin permisos. ¿Estás seguro de que deseas continuar?",
        async () => {
          await createNewRole()
        },
        "warning",
      )
      return
    }

    await createNewRole()
  }

  const createNewRole = async () => {
    try {
      setIsSaving(true)
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
      await fetchRoles()
      setIsCreateModalOpen(false)
      showNotification(`Rol "${newRole.name}" creado correctamente.`, "success")
    } catch (error) {
      console.error("Error al crear rol:", error)

      // Verificar si el error es por nombre duplicado
      if (error.response && error.response.data) {
        if (error.response.data.name) {
          setNameError(error.response.data.name[0] || "Error al crear el rol. El nombre podría estar duplicado.")
        } else if (error.response.data.detail) {
          showNotification(`Error: ${error.response.data.detail}`, "error")
        } else {
          showNotification("Error al crear el rol. Por favor, intente de nuevo.", "error")
        }
      } else {
        showNotification("Error al crear el rol. Por favor, intente de nuevo.", "error")
      }
    } finally {
      setIsSaving(false)
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

        // Limpiar el error de permisos cuando se selecciona uno
        if (permissionsError && !currentPermissions.includes(permissionId)) {
          setPermissionsError("")
        }

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
      <div className="flex items-center justify-center py-12">
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
      <div className="flex items-center justify-center py-12">
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
    setMorePermissionsSearchTerm("") // Resetear el término de búsqueda
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
      ),
    },
  ]

  // Componente de notificación
  const NotificationComponent = ({ notification, onClose }) => {
    if (!notification) return null

    const { message, type } = notification

    const bgColors = {
      success: "bg-green-50 border-green-200",
      error: "bg-red-50 border-red-200",
      warning: "bg-yellow-50 border-yellow-200",
      info: "bg-blue-50 border-blue-200",
    }

    const textColors = {
      success: "text-green-800",
      error: "text-red-800",
      warning: "text-yellow-800",
      info: "text-blue-800",
    }

    const icons = {
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      error: <AlertCircle className="h-5 w-5 text-red-500" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      info: <Info className="h-5 w-5 text-blue-500" />,
    }

    return (
      <div className="fixed top-24 right-4 z-40 max-w-md animate-fade-in">
        <div className={`p-4 rounded-lg shadow-lg border ${bgColors[type]} flex items-start gap-3`}>
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className={`flex-1 ${textColors[type]}`}>
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Crear una versión modificada de los roles para que funcionen con el DataTable
  const modifiedRoles = filteredRoles.map((role) => ({
    ...role,
    // Añadir estas propiedades para que los botones de acción se muestren
    is_active: true,
    is_activate: true,
  }))

  // Crear un componente personalizado para la tabla
  const CustomDataTable = () => {
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

  return (
    <div className="relative">
      {/* Notificación */}
      <NotificationComponent notification={notification} onClose={() => setNotification(null)} />

      {/* Modal de confirmación */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg relative z-10">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">{confirmationModal.title}</h2>
              <button
                onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                {confirmationModal.type === "warning" && <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                {confirmationModal.type === "info" && <Info className="h-5 w-5 text-blue-500 mt-0.5" />}
                {confirmationModal.type === "error" && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                {confirmationModal.type === "success" && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                <p>{confirmationModal.message}</p>
              </div>
            </div>
            <div className="p-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const action = confirmationModal.confirmAction
                  setConfirmationModal({ ...confirmationModal, isOpen: false })
                  if (action) action()
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white
                  ${
                    confirmationModal.type === "warning"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : confirmationModal.type === "error"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

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
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear nuevo rol
        </button>
      </div>

      {/* Usar el componente CustomDataTable que mantiene los botones originales */}
      <CustomDataTable />

      {/* Modales */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
          {/* Fondo difuminado alrededor del modal */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

          {/* Contenido del modal */}
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Editar permisos del rol: {currentRole?.name}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
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
            <div className="p-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
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
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
          {/* Fondo difuminado alrededor del modal */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

          {/* Contenido del modal */}
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Crear nuevo rol</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
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

            <div className="p-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
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
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
          {/* Fondo difuminado alrededor del modal */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

          {/* Contenido del modal */}
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg relative z-10">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Confirmar eliminación</h2>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p>¿Estás seguro de que deseas eliminar el rol "{currentRole?.name}"?</p>
                  <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
                </div>
              </div>
            </div>
            <div className="p-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteRole}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isViewMorePermissionsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
          {/* Fondo difuminado alrededor del modal */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

          {/* Contenido del modal */}
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Permisos adicionales</h2>
              <button
                onClick={() => setIsViewMorePermissionsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {/* Añadir campo de búsqueda */}
              <div className="mb-3 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar permisos..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={morePermissionsSearchTerm}
                  onChange={(e) => setMorePermissionsSearchTerm(e.target.value)}
                />
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPermissions
                    .filter(
                      (perm) =>
                        perm.name.toLowerCase().includes(morePermissionsSearchTerm.toLowerCase()) ||
                        perm.codename.toLowerCase().includes(morePermissionsSearchTerm.toLowerCase()),
                    )
                    .map((perm) => (
                      <div key={perm.id} className="p-2 border rounded-md flex flex-col justify-center min-h-[60px]">
                        <p className="font-medium text-sm">{perm.name}</p>
                        <p className="text-xs text-gray-500">{perm.codename}</p>
                      </div>
                    ))}
                </div>

                {/* Mostrar mensaje cuando no hay resultados */}
                {currentPermissions.filter(
                  (perm) =>
                    perm.name.toLowerCase().includes(morePermissionsSearchTerm.toLowerCase()) ||
                    perm.codename.toLowerCase().includes(morePermissionsSearchTerm.toLowerCase()),
                ).length === 0 && (
                  <div className="text-center py-3 text-gray-500 text-sm">
                    No se encontraron permisos que coincidan con la búsqueda
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 border-t flex justify-end">
              <button
                onClick={() => setIsViewMorePermissionsModalOpen(false)}
                className="px-4 py-2 bg-[#365486] hover:bg-[#2f4275] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RolesSystem

