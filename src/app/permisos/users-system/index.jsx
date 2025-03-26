"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { setupAxios } from "../utils/api"
import Notification from "../components/Notification"
import ConfirmationModal from "../components/ConfirmationModal"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorDisplay from "../components/ErrorDisplay"
import UsersTable from "./components/UsersTable"
import ViewUserPermissionsModal from "./components/ViewUserPermissionsModal"
import EditUserPermissionsModal from "./components/EditUserPermissionsModal"

const UsersSystem = () => {
  // Estados
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [groupedPermissions, setGroupedPermissions] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isUserPermissionsModalOpen, setIsUserPermissionsModalOpen] = useState(false)
  const [userPermissions, setUserPermissions] = useState({
    direct_permissions: [],
    group_permissions: [],
    all_permissions: [],
  })
  const [isEditUserPermissionsModalOpen, setIsEditUserPermissionsModalOpen] = useState(false)
  const [selectedUserRole, setSelectedUserRole] = useState("")
  const [selectedUserPermissions, setSelectedUserPermissions] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const [rolePermissions, setRolePermissions] = useState({}) // Almacena los permisos de cada rol
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
  const [permissionsSearchTerm, setPermissionsSearchTerm] = useState("")
  const [morePermissionsSearchTerm, setMorePermissionsSearchTerm] = useState("")

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
      const { instance } = setupAxios()

      // Quitar el prefijo /api
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

      // Cargar los permisos de cada rol
      const rolePermissionsObj = {}
      const rolesData = Array.isArray(response.data)
        ? response.data
        : response.data.results && Array.isArray(response.data.results)
          ? response.data.results
          : []

      for (const role of rolesData) {
        try {
          const permissionsResponse = await instance.get(`/admin/groups/${role.id}/permissions`)

          // Verificar si la respuesta tiene la estructura esperada
          if (Array.isArray(permissionsResponse.data)) {
            rolePermissionsObj[role.id] = permissionsResponse.data.map((p) => p.id)
          } else if (permissionsResponse.data.results && Array.isArray(permissionsResponse.data.results)) {
            rolePermissionsObj[role.id] = permissionsResponse.data.results.map((p) => p.id)
          } else {
            rolePermissionsObj[role.id] = []
          }
        } catch (error) {
          rolePermissionsObj[role.id] = []
        }
      }
      setRolePermissions(rolePermissionsObj)
    } catch (error) {
      setError("Error al cargar los roles. Por favor, intente de nuevo.")
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
      // Silenciar error
      showNotification("Error al cargar los permisos agrupados.", "error")
    }
  }

  // Función para obtener todos los usuarios
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const { instance } = setupAxios()

      // Quitar el prefijo /api
      const response = await instance.get("/users/admin/listed")

      // Verificar si la respuesta tiene la estructura esperada
      if (Array.isArray(response.data)) {
        setUsers(response.data)
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // Si la API ahora devuelve un objeto con una propiedad 'results'
        setUsers(response.data.results)
      } else {
        console.error("Formato de respuesta inesperado:", response.data)
        setError("Error en el formato de respuesta de usuarios.")
      }

      setIsLoading(false)
    } catch (error) {
      setError("Error al cargar los usuarios. Por favor, intente de nuevo.")
      setIsLoading(false)
      showNotification("Error al cargar los usuarios. Por favor, intente de nuevo.", "error")
    }
  }

  // Modificar la función fetchUserPermissions para extraer correctamente los roles
  const fetchUserPermissions = async (document) => {
    try {
      const { instance } = setupAxios()

      // Obtener los permisos del usuario
      const permissionsResponse = await instance.get(`/admin/users/${document}/permissions`)
      console.log("Respuesta de permisos:", permissionsResponse.data)

      // Obtener detalles del usuario (incluye los grupos/roles asignados)
      const userResponse = await instance.get(`/users/details/${document}`)
      console.log("Respuesta de detalles del usuario:", userResponse.data)

      // Extraer los grupos del usuario
      const userGroups = userResponse.data.groups || []

      // Si no hay grupos en la respuesta del usuario pero hay permisos de rol,
      // extraer los nombres de los roles de los permisos de grupo
      if (userGroups.length === 0 && permissionsResponse.data.Permisos_Rol) {
        // Extraer los nombres de los roles de los permisos de grupo
        const roleNames = Object.keys(permissionsResponse.data.Permisos_Rol)

        // Convertir los nombres de roles a IDs de roles
        for (const roleName of roleNames) {
          const role = roles.find((r) => r.name === roleName)
          if (role) {
            userGroups.push(role.id)
          }
        }
      }

      // Estructurar los datos para la interfaz
      const permissionsData = {
        direct_permissions: permissionsResponse.data.Permisos_Usuario || [],
        group_permissions: [],
        all_permissions: [],
      }

      // Procesar los permisos de grupo si existen
      if (permissionsResponse.data.Permisos_Rol) {
        // Iterar sobre cada rol y sus permisos
        Object.entries(permissionsResponse.data.Permisos_Rol).forEach(([roleName, permissions]) => {
          if (Array.isArray(permissions)) {
            permissions.forEach((perm) => {
              if (typeof perm === "object" && perm !== null) {
                // Añadir el nombre del rol al permiso
                perm.group_name = roleName
                permissionsData.group_permissions.push(perm)
              }
            })
          }
        })
      }

      // Guardar los datos en el estado
      setUserRoles(userGroups)
      setUserPermissions(permissionsData)

      return {
        permissions: permissionsData,
        groups: userGroups,
        userData: userResponse.data,
      }
    } catch (error) {
      console.error("Error al obtener los permisos del usuario:", error)
      showNotification("Error al obtener los permisos del usuario.", "error")
      return {
        permissions: {
          direct_permissions: [],
          group_permissions: [],
          all_permissions: [],
        },
        groups: [],
        userData: {},
      }
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchUsers(), fetchRoles(), fetchPermissions(), fetchGroupedPermissions()])
    }

    loadData()
  }, [])

  // Efecto para actualizar los permisos mostrados cuando cambia el rol seleccionado
  useEffect(() => {
    if (selectedUserRole && rolePermissions[selectedUserRole]) {
      // No modificamos los permisos directos, solo mostramos visualmente los del rol
    }
  }, [selectedUserRole, rolePermissions])

  // Filtrar usuarios según el término de búsqueda
  const filteredUsers = users.filter(
    (user) =>
      user.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Obtener el nombre de un permiso por su ID
  const getPermissionName = (permissionId) => {
    const permission = allPermissions.find((p) => p.id === permissionId)
    return permission ? permission.name : "Permiso desconocido"
  }

  // Mejorar la función getRoleName para manejar mejor los casos de error
  const getRoleName = (roleId) => {
    if (!roleId) return "Rol desconocido"

    // Convertir a número si es string
    const numericRoleId = typeof roleId === "string" ? Number.parseInt(roleId, 10) : roleId

    const role = roles.find((r) => r.id === numericRoleId)
    return role ? role.name : `Rol ID: ${numericRoleId}`
  }

  // Modificar la función handleViewUserPermissions para mostrar información adicional
  const handleViewUserPermissions = async (user) => {
    setCurrentUser(user)
    try {
      setIsLoading(true)
      const result = await fetchUserPermissions(user.document)
      setIsLoading(false)
      setIsUserPermissionsModalOpen(true)
    } catch (error) {
      setIsLoading(false)
      showNotification("Error al obtener los permisos del usuario. Por favor, intente de nuevo.", "error")
    }
  }

  // Modificar la función isPermissionInRole para que verifique todos los roles asignados
  const isPermissionInRole = (permissionId) => {
    // Verificar si el permiso está en el rol seleccionado
    const inSelectedRole =
      selectedUserRole && rolePermissions[selectedUserRole] && rolePermissions[selectedUserRole].includes(permissionId)

    // Verificar si el permiso está en cualquiera de los roles asignados
    const inAnyAssignedRole = userRoles.some(
      (roleId) => rolePermissions[roleId] && rolePermissions[roleId].includes(permissionId),
    )

    // Devolver true si está en el rol seleccionado o en cualquier rol asignado
    return inSelectedRole || inAnyAssignedRole
  }

  // Modificar la función handleEditUserPermissions para considerar todos los roles
  const handleEditUserPermissions = async (user) => {
    setCurrentUser(user)
    try {
      setIsLoading(true)
      const result = await fetchUserPermissions(user.document)
      setIsLoading(false)

      // Inicializar con valores por defecto para evitar errores
      setSelectedUserRole("")
      setSelectedUserPermissions([])

      // Solo asignar valores si existen
      if (result && result.groups && result.groups.length > 0) {
        setSelectedUserRole(result.groups[0].toString())
      }

      // Asegurarse de que direct_permissions sea un array y extraer correctamente los IDs
      if (result && result.permissions && result.permissions.direct_permissions) {
        const directPermissions = result.permissions.direct_permissions
        const permissionIds = directPermissions
          .map((p) => {
            // Si es un objeto con id, usar el id
            if (typeof p === "object" && p !== null && p.id) {
              return p.id
            }
            // Si es un objeto con codename, buscar el id correspondiente
            else if (typeof p === "object" && p !== null && p.codename) {
              const foundPerm = allPermissions.find((ap) => ap.codename === p.codename)
              return foundPerm ? foundPerm.id : null
            }
            // Si es un string, podría ser un id o un codename
            else if (typeof p === "string") {
              // Primero intentar encontrarlo como id
              const foundById = allPermissions.find((ap) => ap.id === p)
              if (foundById) return p

              // Si no, intentar encontrarlo como codename
              const foundByCodename = allPermissions.find((ap) => ap.codename === p)
              return foundByCodename ? foundByCodename.id : null
            }
            return null
          })
          .filter((id) => id !== null) // Filtrar cualquier null que pueda haber quedado

        setSelectedUserPermissions(permissionIds)
      }

      setIsEditUserPermissionsModalOpen(true)
    } catch (error) {
      setIsLoading(false)
      showNotification("Error al obtener los permisos del usuario. Por favor, intente de nuevo.", "error")
    }
  }

  // Función para asignar un rol a un usuario
  const assignRoleToUser = async (userId, roleId) => {
    try {
      const { instance } = setupAxios()

      // Usar el endpoint específico para asignar grupos
      const endpoint = `/admin/users/${userId}/assign_group`
      await instance.post(endpoint, {
        group_id: roleId,
      })

      // Actualizar la lista de roles del usuario
      const result = await fetchUserPermissions(userId)

      // Actualizar la UI para mostrar los permisos del nuevo rol
      if (rolePermissions[roleId]) {
        // Actualizar el rol seleccionado para mostrar sus permisos
        setSelectedUserRole(roleId.toString())

        // Actualizar la lista de permisos seleccionados
        // Mantenemos los permisos directos y añadimos los del rol
        const directPermissions = [...selectedUserPermissions]

        // Forzar la actualización de la UI
        setTimeout(() => {
          // Este timeout es necesario para que React actualice la UI
          setUserRoles((prev) => [...prev])
        }, 100)
      }

      showNotification(`Rol ${getRoleName(roleId)} asignado correctamente`, "success")

      return true
    } catch (error) {
      console.error("Error al asignar rol:", error)
      showNotification(`Error al asignar rol: ${error.response?.data?.detail || error.message}`, "error")
      return false
    }
  }

  // Función para quitar un rol a un usuario
  const removeRoleFromUser = async (userId, roleId) => {
    try {
      const { instance } = setupAxios()

      // Usar el endpoint específico para quitar el rol
      const endpoint = `/admin/users/${userId}/remove_group`
      await instance.post(endpoint, {
        group_id: roleId,
      })

      // Actualizar la lista de roles del usuario
      await fetchUserPermissions(userId)

      // Si el rol que se quitó era el seleccionado, limpiar la selección
      if (selectedUserRole === roleId.toString()) {
        setSelectedUserRole("")
      }

      // Forzar la actualización de la UI
      setTimeout(() => {
        // Este timeout es necesario para que React actualice la UI
        setUserRoles((prev) => [...prev])
      }, 100)

      showNotification(`Rol ${getRoleName(roleId)} quitado correctamente`, "success")
      return true
    } catch (error) {
      console.error("Error al quitar rol:", error)
      showNotification(`Error al quitar rol: ${error.response?.data?.detail || error.message}`, "error")
      return false
    }
  }

  // Modificar la función handleSaveUserPermissions para usar las rutas correctas
  const handleSaveUserPermissions = async () => {
    if (currentUser) {
      try {
        setIsSaving(true)
        const { instance } = setupAxios()
        let hasErrors = false
        let successMessage = "Operación completada con éxito"

        // Obtener los permisos actuales del usuario
        const userData = await fetchUserPermissions(currentUser.document)

        // Extraer los codenames de los permisos actuales
        const currentDirectPermissions = userData.permissions.direct_permissions || []
        const currentDirectPermissionIds = currentDirectPermissions
          .map((p) => {
            if (typeof p === "object" && p !== null && p.id) {
              return p.id
            }
            return null
          })
          .filter((id) => id !== null)

        // Permisos a añadir (están en selectedUserPermissions pero no en currentDirectPermissionIds)
        const permissionsToAdd = selectedUserPermissions.filter((id) => !currentDirectPermissionIds.includes(id))

        // Permisos a quitar (están en currentDirectPermissionIds pero no en selectedUserPermissions)
        const permissionsToRemove = currentDirectPermissionIds.filter((id) => !selectedUserPermissions.includes(id))

        // Obtener el ID del usuario (si está disponible)
        const userId = userData.userData && userData.userData.id ? userData.userData.id : null

        // Si no tenemos el ID del usuario, intentar obtenerlo del documento
        // Si no tenemos el ID del usuario, usamos el documento como identificador (sin mostrar error)
        if (!userId) {
          // El backend acepta el documento como identificador, así que esto es válido
          console.log("Usando documento como identificador para el usuario:", currentUser.document)
        }

        // Asignar nuevos permisos si hay alguno
        if (permissionsToAdd.length > 0) {
          try {
            console.log("Enviando permisos a añadir:", {
              permission_ids: permissionsToAdd,
            })

            // Usar la ruta correcta según el backend
            // Verificar si tenemos el ID o usamos el documento
            const endpoint = userId
              ? `/admin/users/${userId}/add_permissions`
              : `/admin/users/${currentUser.document}/add_permissions`

            await instance.post(endpoint, {
              permission_ids: permissionsToAdd,
            })
            console.log("Todos los permisos añadidos correctamente")
          } catch (error) {
            console.error("Error al añadir permisos:", error)
            hasErrors = true

            // Intentar uno por uno si falla el lote
            let addedCount = 0
            for (const id of permissionsToAdd) {
              try {
                const endpoint = userId
                  ? `/admin/users/${userId}/add_permissions`
                  : `/admin/users/${currentUser.document}/add_permissions`

                await instance.post(endpoint, {
                  permission_ids: [id],
                })
                console.log(`Permiso ${id} añadido correctamente`)
                addedCount++
              } catch (error) {
                console.error(`Error al añadir el permiso ${id}:`, error)
              }
            }

            if (addedCount > 0) {
              successMessage = `Se añadieron ${addedCount} de ${permissionsToAdd.length} permisos. Algunos permisos no pudieron ser añadidos.`
            } else {
              successMessage = "No se pudieron añadir los permisos."
            }
          }
        }

        // Quitar permisos si hay alguno
        if (permissionsToRemove.length > 0) {
          try {
            console.log("Enviando permisos a quitar:", {
              permission_ids: permissionsToRemove,
            })

            // Usar la ruta correcta según el backend
            const endpoint = userId
              ? `/admin/users/${userId}/remove_permission`
              : `/admin/users/${currentUser.document}/remove_permission`

            await instance.post(endpoint, {
              permission_ids: permissionsToRemove,
            })
            console.log("Todos los permisos quitados correctamente")
          } catch (error) {
            console.error("Error al quitar permisos:", error)
            hasErrors = true

            // Intentar uno por uno si falla el lote
            let removedCount = 0
            for (const id of permissionsToRemove) {
              try {
                const endpoint = userId
                  ? `/admin/users/${userId}/remove_permission`
                  : `/admin/users/${currentUser.document}/remove_permission`

                await instance.post(endpoint, {
                  permission_ids: [id],
                })
                console.log(`Permiso ${id} quitado correctamente`)
                removedCount++
              } catch (error) {
                console.error(`Error al quitar el permiso ${id}:`, error)
              }
            }

            if (removedCount > 0) {
              successMessage = `${successMessage}. Se quitaron ${removedCount} de ${permissionsToRemove.length} permisos.`
            } else {
              successMessage = `${successMessage}. No se pudieron quitar los permisos.`
            }
          }
        }

        // Actualizar la lista de usuarios y cerrar el modal
        await fetchUsers()
        setIsEditUserPermissionsModalOpen(false)

        // Mostrar mensaje de éxito o advertencia
        if (hasErrors) {
          showNotification(successMessage, "warning")
        } else {
          showNotification("Permisos actualizados correctamente", "success")
        }
      } catch (error) {
        console.error("Error al guardar permisos:", error)

        // Mostrar mensaje de error más detallado
        let errorMessage = "Error al guardar los permisos del usuario. Por favor, intente de nuevo."

        if (error.response) {
          if (error.response.data && error.response.data.error) {
            errorMessage = `Error: ${error.response.data.error}`
          } else if (error.response.data && error.response.data.message) {
            errorMessage = `Error: ${error.response.data.message}`
          } else if (error.response.data && error.response.data.detail) {
            errorMessage = `Error: ${error.response.data.detail}`
          } else if (typeof error.response.data === "string") {
            errorMessage = `Error: ${error.response.data}`
          }
        }

        showNotification(errorMessage, "error")
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Función para alternar la expansión de un grupo
  const toggleGroupExpansion = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }

  // Función para seleccionar/deseleccionar un permiso individual
  const toggleUserPermission = (permissionId) => {
    setSelectedUserPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
  }

  // Renderizar mensaje de carga
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Renderizar mensaje de error
  if (error) {
    return <ErrorDisplay error={error} resetError={setError} retryAction={fetchUsers} />
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
            placeholder="Buscar usuario"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de usuarios */}
      <UsersTable
        filteredUsers={filteredUsers}
        handleViewUserPermissions={handleViewUserPermissions}
        handleEditUserPermissions={handleEditUserPermissions}
      />

      {/* Modales */}
      <ViewUserPermissionsModal
        isOpen={isUserPermissionsModalOpen}
        onClose={() => {
          setIsUserPermissionsModalOpen(false)
          setPermissionsSearchTerm("")
        }}
        currentUser={currentUser}
        userRoles={userRoles}
        userPermissions={userPermissions}
        permissionsSearchTerm={permissionsSearchTerm}
        setPermissionsSearchTerm={setPermissionsSearchTerm}
        getRoleName={getRoleName}
        roles={roles}
      />

      <EditUserPermissionsModal
        isOpen={isEditUserPermissionsModalOpen}
        onClose={() => {
          setIsEditUserPermissionsModalOpen(false)
          setPermissionsSearchTerm("")
        }}
        currentUser={currentUser}
        userRoles={userRoles}
        selectedUserRole={selectedUserRole}
        setSelectedUserRole={setSelectedUserRole}
        selectedUserPermissions={selectedUserPermissions}
        setSelectedUserPermissions={setSelectedUserPermissions}
        permissionsSearchTerm={permissionsSearchTerm}
        setPermissionsSearchTerm={setPermissionsSearchTerm}
        handleSaveUserPermissions={handleSaveUserPermissions}
        isSaving={isSaving}
        allPermissions={allPermissions}
        groupedPermissions={groupedPermissions}
        expandedGroups={expandedGroups}
        toggleGroupExpansion={toggleGroupExpansion}
        toggleUserPermission={toggleUserPermission}
        isPermissionInRole={isPermissionInRole}
        getRoleName={getRoleName}
        roles={roles}
        assignRoleToUser={assignRoleToUser}
        removeRoleFromUser={removeRoleFromUser}
        rolePermissions={rolePermissions}
      />
    </div>
  )
}

export default UsersSystem

