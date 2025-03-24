"use client"

import { useState, useEffect } from "react"
import { Search, Eye, UserCog, Check, X, AlertCircle, CheckCircle, Info } from "lucide-react"
import axios from "axios"

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

  // Añadir un nuevo estado para el término de búsqueda en el modal de permisos
  const [permissionsSearchTerm, setPermissionsSearchTerm] = useState("")

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
      const { instance } = setupAxios()

      const response = await instance.get("/admin/groups")
      setRoles(response.data)

      // Cargar los permisos de cada rol
      const rolePermissionsObj = {}
      for (const role of response.data) {
        try {
          const permissionsResponse = await instance.get(`/admin/groups/${role.id}/permissions`)
          rolePermissionsObj[role.id] = permissionsResponse.data.map((p) => p.id)
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

      const response = await instance.get("/admin/permissions")
      setAllPermissions(response.data)
    } catch (error) {
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
      // Silenciar error
      showNotification("Error al cargar los permisos agrupados.", "error")
    }
  }

  // Función para obtener todos los usuarios
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const { instance } = setupAxios()

      const response = await instance.get("/users/admin/listed")
      setUsers(response.data)
      setIsLoading(false)
    } catch (error) {
      setError("Error al cargar los usuarios. Por favor, intente de nuevo.")
      setIsLoading(false)
      showNotification("Error al cargar los usuarios. Por favor, intente de nuevo.", "error")
    }
  }

  // Función para extraer información de roles de los permisos de grupo
  const extractRoleInfoFromPermissions = (groupPermissions) => {
    if (!groupPermissions || !Array.isArray(groupPermissions) || groupPermissions.length === 0) {
      return []
    }

    // Conjunto para almacenar nombres de roles únicos
    const roleNames = new Set()

    // Recorrer cada permiso de grupo
    groupPermissions.forEach((perm) => {
      if (typeof perm === "object" && perm !== null) {
        // Manejar tanto group_names (array) como group_name (string)
        if (perm.group_names && Array.isArray(perm.group_names)) {
          perm.group_names.forEach((name) => roleNames.add(name))
        } else if (perm.group_name) {
          roleNames.add(perm.group_name)
        }
      }
    })

    // Convertir los nombres de roles a IDs de roles
    const roleIds = []
    Array.from(roleNames).forEach((roleName) => {
      const role = roles.find((r) => r.name === roleName)
      if (role) {
        roleIds.push(role.id)
      }
    })

    return roleIds
  }

  // Modificar la función fetchUserPermissions para manejar ambos formatos de respuesta
  const fetchUserPermissions = async (document) => {
    try {
      const { instance } = setupAxios()

      // Obtener permisos del usuario
      const permissionsResponse = await instance.get(`/admin/users/${document}/permissions`)

      // Obtener detalles del usuario
      const userResponse = await instance.get(`/users/details/${document}`)

      // Obtener los grupos del usuario
      let userGroups = userResponse.data.groups || []

      // Si no hay grupos en la respuesta del usuario, intentar extraerlos de los permisos de grupo
      if (userGroups.length === 0 && permissionsResponse.data && permissionsResponse.data.group_permissions) {
        userGroups = extractRoleInfoFromPermissions(permissionsResponse.data.group_permissions)
      }

      // Guardar los datos en el estado
      setUserRoles(userGroups)
      setUserPermissions(permissionsResponse.data)

      return {
        permissions: permissionsResponse.data,
        groups: userGroups,
        userData: userResponse.data,
      }
    } catch (error) {
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

  // Función para obtener el nombre del grupo de un permiso
  const getGroupNameForPermission = (perm) => {
    if (typeof perm !== "object" || perm === null) {
      return null
    }

    // Manejar tanto group_names (array) como group_name (string)
    if (perm.group_names && Array.isArray(perm.group_names)) {
      // Filtrar para mostrar solo los grupos a los que pertenece el usuario
      const userRoleNames = userRoles
        .map((roleId) => {
          const role = roles.find((r) => r.id === roleId)
          return role ? role.name : null
        })
        .filter(Boolean)

      return perm.group_names.filter((name) => userRoleNames.includes(name))
    } else if (perm.group_name) {
      // Verificar si el usuario pertenece a este grupo
      const roleName = perm.group_name
      const role = roles.find((r) => r.name === roleName)

      if (role && userRoles.includes(role.id)) {
        return [roleName]
      }
    }

    return []
  }

  // Modificar la función handleViewUserPermissions para mostrar información adicional
  const handleViewUserPermissions = async (user) => {
    setCurrentUser(user)
    try {
      const result = await fetchUserPermissions(user.document)
      setIsUserPermissionsModalOpen(true)
    } catch (error) {
      showNotification("Error al obtener los permisos del usuario. Por favor, intente de nuevo.", "error")
    }
  }

  // Modificar la función handleEditUserPermissions para asegurar que se carguen correctamente los permisos
  const handleEditUserPermissions = async (user) => {
    setCurrentUser(user)
    try {
      const result = await fetchUserPermissions(user.document)

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
      showNotification("Error al obtener los permisos del usuario. Por favor, intente de nuevo.", "error")
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
        const currentDirectPermissionCodenames = currentDirectPermissions
          .map((p) => {
            if (typeof p === "object" && p !== null) {
              return p.codename || null
            }
            // Si es un string, verificar si es un codename directamente
            if (typeof p === "string") {
              return p
            }
            return null
          })
          .filter((codename) => codename !== null)

        // Convertir los IDs seleccionados a codenames
        const selectedPermissionCodenames = selectedUserPermissions
          .map((id) => {
            const permission = allPermissions.find((p) => p.id === id)
            return permission ? permission.codename : null
          })
          .filter((codename) => codename !== null)

        // Permisos a añadir (están en selectedPermissionCodenames pero no en currentDirectPermissionCodenames)
        const permissionsToAdd = selectedPermissionCodenames.filter(
          (codename) => !currentDirectPermissionCodenames.includes(codename),
        )

        // Permisos a quitar (están en currentDirectPermissionCodenames pero no en selectedPermissionCodenames)
        const permissionsToRemove = currentDirectPermissionCodenames.filter(
          (codename) => !selectedPermissionCodenames.includes(codename),
        )

        // Asignar nuevos permisos si hay alguno
        if (permissionsToAdd.length > 0) {
          try {
            console.log("Enviando permisos a añadir:", {
              document: currentUser.document,
              permission_codenames: permissionsToAdd,
            })

            // Intentar enviar todos los permisos juntos primero
            try {
              await instance.post("/users/custom-permissions/assign/", {
                document: currentUser.document,
                permission_codenames: permissionsToAdd,
              })
              console.log("Todos los permisos añadidos correctamente")
            } catch (error) {
              console.error("Error al añadir permisos en lote, intentando uno por uno:", error)
              hasErrors = true

              // Si falla, intentar uno por uno
              let addedCount = 0
              for (const codename of permissionsToAdd) {
                try {
                  await instance.post("/users/custom-permissions/assign/", {
                    document: currentUser.document,
                    permission_codenames: [codename],
                  })
                  console.log(`Permiso ${codename} añadido correctamente`)
                  addedCount++
                } catch (error) {
                  console.error(`Error al añadir el permiso ${codename}:`, error)
                  // Continuar con el siguiente permiso
                }
              }

              if (addedCount > 0) {
                successMessage = `Se añadieron ${addedCount} de ${permissionsToAdd.length} permisos. Algunos permisos no pudieron ser añadidos debido a errores del servidor.`
              } else {
                successMessage = "No se pudieron añadir los permisos debido a errores del servidor."
              }
            }
          } catch (error) {
            console.error("Error al añadir permisos:", error)
            hasErrors = true
          }
        }

        // Quitar permisos si hay alguno
        if (permissionsToRemove.length > 0) {
          try {
            console.log("Enviando permisos a quitar:", {
              document: currentUser.document,
              permission_codenames: permissionsToRemove,
            })

            // Intentar enviar todos los permisos juntos primero
            try {
              await instance.post("/users/custom-permissions/remove/", {
                document: currentUser.document,
                permission_codenames: permissionsToRemove,
              })
              console.log("Todos los permisos quitados correctamente")
            } catch (error) {
              console.error("Error al quitar permisos en lote, intentando uno por uno:", error)
              hasErrors = true

              // Si falla, intentar uno por uno
              let removedCount = 0
              for (const codename of permissionsToRemove) {
                try {
                  await instance.post("/users/custom-permissions/remove/", {
                    document: currentUser.document,
                    permission_codenames: [codename],
                  })
                  console.log(`Permiso ${codename} quitado correctamente`)
                  removedCount++
                } catch (error) {
                  console.error(`Error al quitar el permiso ${codename}:`, error)
                  // Continuar con el siguiente permiso
                }
              }

              if (removedCount > 0) {
                successMessage = `${successMessage}. Se quitaron ${removedCount} de ${permissionsToRemove.length} permisos.`
              } else {
                successMessage = `${successMessage}. No se pudieron quitar los permisos debido a errores del servidor.`
              }
            }
          } catch (error) {
            console.error("Error al quitar permisos:", error)
            hasErrors = true
          }
        }

        // Actualizar el rol del usuario usando la ruta correcta
        const currentGroups = userData.groups || []
        const currentGroupId = currentGroups.length > 0 ? currentGroups[0] : null

        if (selectedUserRole !== (currentGroupId ? currentGroupId.toString() : "")) {
          try {
            // Usar la ruta de actualización de usuario para asignar el grupo
            const updateData = {
              groups: selectedUserRole ? [Number.parseInt(selectedUserRole)] : [],
            }

            console.log("Actualizando grupos del usuario:", updateData)

            try {
              // Usar la ruta correcta para actualizar el usuario
              await instance.patch(`/users/admin/update/${currentUser.document}`, updateData)
              console.log("Grupos actualizados correctamente")
            } catch (error) {
              console.error("Error al actualizar grupos:", error)

              // Intentar con un formato diferente si el primero falla
              if (error.response && error.response.status === 400) {
                try {
                  // Probar con un formato alternativo
                  const alternativeData = {
                    group: selectedUserRole ? Number.parseInt(selectedUserRole) : null,
                  }

                  console.log("Intentando formato alternativo:", alternativeData)
                  await instance.patch(`/users/admin/update/${currentUser.document}`, alternativeData)
                  console.log("Grupos actualizados correctamente con formato alternativo")
                } catch (secondError) {
                  console.error("Error con el formato alternativo:", secondError)
                  hasErrors = true
                  successMessage = `${successMessage}. No se pudo actualizar el rol del usuario.`
                }
              } else {
                hasErrors = true
                successMessage = `${successMessage}. No se pudo actualizar el rol del usuario.`
              }
            }
          } catch (error) {
            console.error("Error al actualizar grupos:", error)
            hasErrors = true
            successMessage = `${successMessage}. No se pudo actualizar el rol del usuario.`
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
          // El servidor respondió con un código de estado fuera del rango 2xx
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

  const toggleUserPermission = (permissionId) => {
    setSelectedUserPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
    )
  }

  // Verificar si un permiso está incluido en el rol seleccionado
  const isPermissionInSelectedRole = (permissionId) => {
    return (
      selectedUserRole && rolePermissions[selectedUserRole] && rolePermissions[selectedUserRole].includes(permissionId)
    )
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
          <div className="w-16 h-16 border-4 border-[#365486] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
              fetchUsers()
            }}
            className="px-4 py-2 bg-[#365486] text-white rounded-md text-sm font-medium hover:bg-[#2f4275]"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

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

  // Definir las columnas para la tabla
  const columns = [
    {
      key: "document",
      label: "Documento",
      render: (user) => <span className="font-medium">{user.document}</span>,
    },
    {
      key: "name",
      label: "Nombre",
      render: (user) => `${user.first_name || ""} ${user.last_name || ""}`,
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "status",
      label: "Estado",
      render: (user) =>
        user.is_active ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Inactivo
          </span>
        ),
    },
  ]

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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-4 text-gray-500 text-sm">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  {columns.map((column) => (
                    <td key={`${index}-${column.key}`} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(user) : user[column.key]}
                    </td>
                  ))}
                  <td className="px-4 py-4 whitespace-nowrap space-x-2 text-sm text-gray-900">
                    <div className="flex gap-2">
                      <button
                        className="bg-[#365486] hover:bg-[#2f4275] text-white text-xs px-3 py-1 h-8 rounded-md flex items-center"
                        onClick={() => handleViewUserPermissions(user)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver permisos
                      </button>
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-8 rounded-md flex items-center"
                        onClick={() => handleEditUserPermissions(user)}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        Editar permisos
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
                        : "bg-[#365486] hover:bg-[#2f4275]"
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
            placeholder="Buscar usuario"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Usar el componente CustomDataTable */}
      <CustomDataTable />

      {/* Modales */}
      {isUserPermissionsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
          {/* Fondo difuminado alrededor del modal */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

          {/* Contenido del modal */}
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Permisos del usuario: {currentUser?.first_name} {currentUser?.last_name}
              </h2>
              <button
                onClick={() => {
                  setIsUserPermissionsModalOpen(false)
                  setPermissionsSearchTerm("") // Limpiar el término de búsqueda al cerrar
                }}
                className="text-gray-500 hover:text-gray-700"
              >
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
                        const permName = typeof perm === "string" ? perm : perm.name || perm
                        const permCode = typeof perm === "string" ? "" : perm.codename || ""
                        return (
                          permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                          permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                        )
                      })
                      .map((perm, index) => {
                        // Obtener el nombre y código del permiso
                        const permName = typeof perm === "string" ? perm : perm.name || perm
                        const permCode = typeof perm === "string" ? "" : perm.codename || ""

                        // Obtener los nombres de los grupos que otorgan este permiso
                        let groupNames = []

                        if (typeof perm === "object" && perm !== null) {
                          if (perm.group_names && Array.isArray(perm.group_names)) {
                            groupNames = perm.group_names
                          } else if (perm.group_name) {
                            groupNames = [perm.group_name]
                          }
                        }

                        // Filtrar para mostrar solo los grupos a los que pertenece el usuario
                        const userGroupNames = []
                        if (userRoles.length > 0 && groupNames.length > 0) {
                          userRoles.forEach((roleId) => {
                            const role = roles.find((r) => r.id === roleId)
                            if (role && groupNames.includes(role.name)) {
                              userGroupNames.push(role.name)
                            }
                          })
                        }

                        return (
                          <div key={`group-perm-${index}`} className="border p-3 rounded-md bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{permName}</p>
                                {permCode && <p className="text-sm text-gray-500">{permCode}</p>}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {userGroupNames.length > 0 ? (
                                  userGroupNames.map((name, i) => (
                                    <span
                                      key={`group-${i}`}
                                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                    >
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">grupo1</span>
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
                    const permName = typeof perm === "string" ? perm : perm.name || perm
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
                        const permName = typeof perm === "string" ? perm : perm.name || perm
                        const permCode = typeof perm === "string" ? "" : perm.codename || ""
                        return (
                          permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                          permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                        )
                      })
                      .map((perm, index) => {
                        // Manejar tanto objetos como strings
                        const permName = typeof perm === "string" ? perm : perm.name || perm
                        const permCode = typeof perm === "string" ? "" : perm.codename || ""

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
                    const permCode = typeof perm === "string" ? "" : perm.codename || ""
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
                    const permCode = typeof perm === "string" ? "" : perm.codename || ""
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
                    const permCode = typeof perm === "string" ? "" : perm.codename || ""
                    return (
                      permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                      permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                    )
                  }).length === 0) ||
                  !userPermissions.direct_permissions ||
                  userPermissions.direct_permissions.length === 0) && (
                  <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                    <p className="text-gray-500">
                      No se encontraron permisos que coincidan con "{permissionsSearchTerm}"
                    </p>
                  </div>
                )}
            </div>
            <div className="p-3 border-t flex justify-end">
              <button
                onClick={() => {
                  setIsUserPermissionsModalOpen(false)
                  setPermissionsSearchTerm("") // Limpiar el término de búsqueda al cerrar
                }}
                className="px-4 py-2 bg-[#365486] hover:bg-[#2f4275] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditUserPermissionsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
          {/* Fondo difuminado alrededor del modal */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

          {/* Contenido del modal */}
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Editar permisos: {currentUser?.first_name} {currentUser?.last_name}
              </h2>
              <button
                onClick={() => {
                  setIsEditUserPermissionsModalOpen(false)
                  setPermissionsSearchTerm("") // Limpiar el término de búsqueda al cerrar
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
              <div className="mb-4">
                <label htmlFor="userRole" className="block text-sm font-medium mb-1">
                  Rol asignado
                </label>
                <select
                  id="userRole"
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#365486]"
                >
                  <option value="">Sin rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">El rol determina los permisos base del usuario</p>
              </div>

              {/* Sección de permisos seleccionados */}
              {(selectedUserPermissions.length > 0 ||
                (selectedUserRole &&
                  rolePermissions[selectedUserRole] &&
                  rolePermissions[selectedUserRole].length > 0)) && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium mb-2 text-blue-700">
                    Permisos seleccionados (
                    {selectedUserPermissions.length +
                      (selectedUserRole && rolePermissions[selectedUserRole]
                        ? rolePermissions[selectedUserRole].length
                        : 0)}
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

                    {/* Permisos del rol */}
                    {selectedUserRole &&
                      rolePermissions[selectedUserRole] &&
                      rolePermissions[selectedUserRole].map((permId) => {
                        // No mostrar si ya está en los permisos directos
                        if (selectedUserPermissions.includes(permId)) return null

                        const permission = allPermissions.find((p) => p.id === permId)
                        return permission ? (
                          <div
                            key={`selected-role-${permId}`}
                            className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1 flex items-center gap-1 text-sm"
                          >
                            <span className="truncate max-w-[150px]" title={permission.name}>
                              {permission.name}
                            </span>
                            <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Del rol</span>
                          </div>
                        ) : null
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

                {Object.entries(groupedPermissions)
                  .filter(([appLabel, models]) => {
                    // Verificar si hay permisos que coincidan con la búsqueda en este grupo
                    if (!permissionsSearchTerm.trim()) return true

                    for (const [model, permissions] of Object.entries(models)) {
                      const filteredPermissions = permissions.filter((permission) => {
                        const permName = permission.name || permission
                        const permCode = permission.codename || ""
                        return (
                          permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                          permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                        )
                      })
                      if (filteredPermissions.length > 0) {
                        return true
                      }
                    }
                    return false
                  })
                  .map(([appLabel, models], appIndex) => (
                    <div key={`app-${appIndex}-${appLabel}`} className="mb-8">
                      <h4 className="text-md font-medium mb-2 capitalize">{appLabel.replace("_", " ")}</h4>

                      {Object.entries(models)
                        .filter(([model, permissions]) => {
                          // No mostrar este modelo si no hay permisos que coincidan con la búsqueda
                          if (!permissionsSearchTerm.trim()) return true

                          const filteredPermissions = permissions.filter((permission) => {
                            const permName = permission.name || permission
                            const permCode = permission.codename || ""
                            return (
                              permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                              permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                            )
                          })
                          return filteredPermissions.length > 0
                        })
                        .map(([model, permissions], modelIndex) => (
                          <div key={`model-${modelIndex}-${model}`} className="mb-4">
                            <h5 className="text-sm font-medium mb-2 capitalize">{model.replace("_", " ")}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {permissions
                                .filter((permission) => {
                                  if (!permissionsSearchTerm.trim()) return true

                                  const permName = permission.name || permission
                                  const permCode = permission.codename || ""
                                  return (
                                    permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                                    permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                                  )
                                })
                                .map((permission, permIndex) => {
                                  const isInRole = isPermissionInSelectedRole(permission.id)
                                  return (
                                    <div
                                      key={`perm-${permIndex}-${permission.id || permission}`}
                                      className={`flex items-start space-x-2 border p-2 rounded-md ${isInRole ? "bg-blue-50" : ""}`}
                                    >
                                      <input
                                        type="checkbox"
                                        id={`user-perm-${permission.id || permIndex}`}
                                        checked={
                                          selectedUserPermissions.includes(permission.id || permission) || isInRole
                                        }
                                        onChange={() => toggleUserPermission(permission.id || permission)}
                                        disabled={isInRole}
                                        className="mt-1"
                                      />
                                      <div className="grid gap-1">
                                        <div className="flex items-center">
                                          <label
                                            htmlFor={`user-perm-${permission.id || permIndex}`}
                                            className="text-sm font-medium leading-none cursor-pointer"
                                          >
                                            {permission.name || permission}
                                          </label>
                                          {isInRole && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                              Del rol
                                            </span>
                                          )}
                                        </div>
                                        {permission.codename && (
                                          <p className="text-xs text-gray-500">{permission.codename}</p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}

                {/* Mostrar mensaje cuando no hay resultados de búsqueda */}
                {permissionsSearchTerm.trim() &&
                  Object.entries(groupedPermissions).filter(([appLabel, models]) => {
                    for (const [model, permissions] of Object.entries(models)) {
                      const filteredPermissions = permissions.filter((permission) => {
                        const permName = permission.name || permission
                        const permCode = permission.codename || ""
                        return (
                          permName.toLowerCase().includes(permissionsSearchTerm.toLowerCase()) ||
                          permCode.toLowerCase().includes(permissionsSearchTerm.toLowerCase())
                        )
                      })
                      if (filteredPermissions.length > 0) {
                        return true
                      }
                    }
                    return false
                  }).length === 0 && (
                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-500">
                        No se encontraron permisos que coincidan con "{permissionsSearchTerm}"
                      </p>
                    </div>
                  )}
              </div>
            </div>
            <div className="p-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditUserPermissionsModalOpen(false)
                  setPermissionsSearchTerm("") // Limpiar el término de búsqueda al cerrar
                }}
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
      )}
    </div>
  )
}

export default UsersSystem

