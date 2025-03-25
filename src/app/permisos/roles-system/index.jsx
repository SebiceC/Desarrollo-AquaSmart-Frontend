"use client"

import { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { setupAxios } from "../utils/api"
import Notification from "../components/Notification"
import ConfirmationModal from "../components/ConfirmationModal"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorDisplay from "../components/ErrorDisplay"
import RolesTable from "./components/RolesTable"
import EditRoleModal from "./components/EditRoleModal"
import CreateRoleModal from "./components/CreateRoleModal"
import DeleteRoleModal from "./components/DeleteRoleModal"
import ViewMorePermissionsModal from "./components/ViewMorePermissionsModal"

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
  const [isViewMorePermissionsModalOpen, setIsViewMorePermissionsModalOpen] = useState(false)
  const [currentPermissions, setCurrentPermissions] = useState([])
  const [permissionSearchTerm, setPermissionSearchTerm] = useState("")
  const [nameError, setNameError] = useState("")
  const [morePermissionsSearchTerm, setMorePermissionsSearchTerm] = useState("")
  const [permissionsError, setPermissionsError] = useState("")
  const [expandedGroups, setExpandedGroups] = useState({})
  const [notification, setNotification] = useState(null)
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmAction: null,
    type: "info", // info, warning, success, error
  })
  const [isSaving, setIsSaving] = useState(false)

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

  // Modificar la función fetchRoles para usar la ruta correcta
  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      const { instance } = setupAxios()

      // Quitar el prefijo /api ya que está incluido en la URL base
      const response = await instance.get("/admin/groups")

      // Verificar si la respuesta tiene la estructura esperada
      if (Array.isArray(response.data)) {
        setRoles(response.data)
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // Si la API ahora devuelve un objeto con una propiedad 'results'
        setRoles(response.data.results)
      } else {
        console.error("Formato de respuesta inesperado:", response.data)
        setError("Error en el formato de respuesta de roles.")
      }

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

      // Quitar el prefijo /api
      const response = await instance.get("/admin/permissions")

      // Verificar si la respuesta tiene la estructura esperada
      if (Array.isArray(response.data)) {
        setAllPermissions(response.data)
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // Si la API ahora devuelve un objeto con una propiedad 'results'
        setAllPermissions(response.data.results)
      } else {
        console.error("Formato de respuesta inesperado:", response.data)
        showNotification("Error en el formato de respuesta de permisos.", "error")
      }
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

      // Quitar el prefijo /api
      const response = await instance.get("/admin/grouped_permissions")

      // Verificar si la respuesta tiene la estructura esperada
      if (typeof response.data === "object" && response.data !== null) {
        setGroupedPermissions(response.data)

        // Inicializar todos los grupos como expandidos
        const initialExpandedState = {}
        Object.keys(response.data).forEach((appLabel) => {
          initialExpandedState[appLabel] = true
        })
        setExpandedGroups(initialExpandedState)
      } else {
        console.error("Formato de respuesta inesperado:", response.data)
        showNotification("Error en el formato de respuesta de permisos agrupados.", "error")
      }
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

    // Verificar si excede el máximo de 20 caracteres
    if (name.length > 20) {
      return "El nombre del rol no puede exceder los 20 caracteres."
    }

    // Verificar si solo contiene letras y espacios
    // Expresión regular que permite letras (incluyendo acentos) y espacios
    const lettersOnly = /^[a-zA-ZÀ-ÿ\s]+$/
    if (!lettersOnly.test(name)) {
      return "El nombre del rol solo puede contener letras (sin números ni caracteres especiales)."
    }

    return ""
  }

  // Modificar la función handleEditPermissions para usar la ruta correcta
  const handleEditPermissions = async (role) => {
    setCurrentRole(role)

    try {
      const { instance } = setupAxios()

      // Quitar el prefijo /api
      const response = await instance.get(`/admin/groups/${role.id}/permissions`)

      // Verificar si la respuesta tiene la estructura esperada
      if (Array.isArray(response.data)) {
        // Extraer los IDs de los permisos
        const permissionIds = response.data.map((p) => p.id)
        setEditedPermissions(permissionIds)
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // Si la API ahora devuelve un objeto con una propiedad 'results'
        const permissionIds = response.data.results.map((p) => p.id)
        setEditedPermissions(permissionIds)
      } else {
        console.error("Formato de respuesta inesperado:", response.data)
        showNotification("Error en el formato de respuesta de permisos del rol.", "error")
        return
      }

      setIsEditModalOpen(true)
    } catch (error) {
      console.error("Error al obtener permisos del rol:", error)
      showNotification("Error al obtener los permisos del rol. Por favor, intente de nuevo.", "error")
    }
  }

  const handleSavePermissions = async (role) => {
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

      // Extraer los IDs de los permisos actuales
      let currentPermissionIds = []
      if (Array.isArray(currentPermissionsResponse.data)) {
        currentPermissionIds = currentPermissionsResponse.data.map((p) => p.id)
      } else if (currentPermissionsResponse.data.results && Array.isArray(currentPermissionsResponse.data.results)) {
        currentPermissionIds = currentPermissionsResponse.data.results.map((p) => p.id)
      }

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

  // Modificar la función confirmDeleteRole para usar una ruta que exista
  const confirmDeleteRole = async () => {
    if (currentRole) {
      try {
        setIsSaving(true)
        const { instance } = setupAxios()

        // Usar la ruta correcta proporcionada por el backend
        await instance.delete(`/admin/groups/delete/${currentRole.id}`)

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
            showNotification(
              "Error al eliminar el rol. Puede que tenga usuarios asignados o la ruta no existe en el backend.",
              "error",
            )
          }
        } else {
          showNotification(
            "Error al eliminar el rol. Por favor, intente de nuevo o contacte al administrador del sistema.",
            "error",
          )
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

  // Modificar la función handleSaveNewRole para validar que haya permisos seleccionados
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
      setPermissionsError("Debe seleccionar al menos un permiso para crear el rol.")
      return
    }

    await createNewRole()
  }

  // Modificar la función createNewRole para asegurar que los permisos se asignen correctamente
  const createNewRole = async () => {
    try {
      setIsSaving(true)
      const { instance } = setupAxios()

      // Primero crear el rol - Quitar el prefijo /api y la barra final
      const createResponse = await instance.post("/admin/groups", {
        name: newRole.name,
      })

      // Verificar si la respuesta tiene la estructura esperada
      let createdRole
      if (createResponse.data && createResponse.data.id) {
        createdRole = createResponse.data
      } else {
        console.error("Formato de respuesta inesperado:", createResponse.data)
        showNotification("Error en el formato de respuesta al crear el rol.", "error")
        setIsSaving(false)
        return
      }

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

  // Función para alternar la expansión de un grupo
  const toggleGroupExpansion = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }

  // Modificar la función handleViewMorePermissions para asegurar que se muestren todos los permisos adicionales
  const handleViewMorePermissions = (permissions) => {
    console.log("Permisos a mostrar:", permissions.slice(3)) // Agregar log para depuración
    setCurrentPermissions(permissions.slice(3))
    setMorePermissionsSearchTerm("") // Resetear el término de búsqueda
    setIsViewMorePermissionsModalOpen(true)
  }

  // Renderizar mensaje de carga
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Renderizar mensaje de error
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        resetError={setError}
        retryAction={() => {
          fetchRoles()
          fetchPermissions()
        }}
      />
    )
  }

  return (
    <div className="relative">
      {/* Notificación */}
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {/* Modal de confirmación */}
      <ConfirmationModal confirmationModal={confirmationModal} setConfirmationModal={setConfirmationModal} />

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

      {/* Tabla de roles */}
      <RolesTable
        filteredRoles={filteredRoles}
        handleEditPermissions={handleEditPermissions}
        handleDeleteRole={handleDeleteRole}
        handleViewMorePermissions={handleViewMorePermissions}
      />

      {/* Modales */}
      <EditRoleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentRole={currentRole}
        editedPermissions={editedPermissions}
        setEditedPermissions={setEditedPermissions}
        permissionSearchTerm={permissionSearchTerm}
        setPermissionSearchTerm={setPermissionSearchTerm}
        handleSavePermissions={handleSavePermissions}
        isSaving={isSaving}
        allPermissions={allPermissions}
        groupedPermissions={groupedPermissions}
        expandedGroups={expandedGroups}
        toggleGroupExpansion={toggleGroupExpansion}
        togglePermission={togglePermission}
      />

      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        newRole={newRole}
        setNewRole={setNewRole}
        nameError={nameError}
        setNameError={setNameError}
        permissionsError={permissionsError}
        permissionSearchTerm={permissionSearchTerm}
        setPermissionSearchTerm={setPermissionSearchTerm}
        handleSaveNewRole={handleSaveNewRole}
        isSaving={isSaving}
        allPermissions={allPermissions}
        groupedPermissions={groupedPermissions}
        expandedGroups={expandedGroups}
        toggleGroupExpansion={toggleGroupExpansion}
        togglePermission={togglePermission}
      />

      <DeleteRoleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        currentRole={currentRole}
        confirmDeleteRole={confirmDeleteRole}
        isSaving={isSaving}
      />

      <ViewMorePermissionsModal
        isOpen={isViewMorePermissionsModalOpen}
        onClose={() => setIsViewMorePermissionsModalOpen(false)}
        currentPermissions={currentPermissions}
        morePermissionsSearchTerm={morePermissionsSearchTerm}
        setMorePermissionsSearchTerm={setMorePermissionsSearchTerm}
      />
    </div>
  )
}

export default RolesSystem

