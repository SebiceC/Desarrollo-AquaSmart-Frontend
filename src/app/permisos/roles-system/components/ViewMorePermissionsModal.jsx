"use client"

import { X, Search } from "lucide-react"

const ViewMorePermissionsModal = ({
  isOpen,
  onClose,
  currentPermissions,
  morePermissionsSearchTerm,
  setMorePermissionsSearchTerm,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
      {/* Fondo difuminado alrededor del modal */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Contenido del modal */}
      <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg relative z-10" style={{ maxHeight: "80vh" }}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Permisos adicionales</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
            {/* Agregar información de depuración */}
            <div className="mb-2 text-xs text-gray-500">Mostrando {currentPermissions.length} permisos adicionales</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentPermissions
                .filter(
                  (perm) =>
                    perm.name.toLowerCase().includes(morePermissionsSearchTerm.toLowerCase()) ||
                    perm.codename.toLowerCase().includes(morePermissionsSearchTerm.toLowerCase()),
                )
                .map((perm, index) => (
                  <div
                    key={`perm-${perm.id || index}`}
                    className="p-2 border rounded-md flex flex-col justify-center min-h-[60px]"
                  >
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
            onClick={onClose}
            className="px-4 py-2 bg-[#365486] hover:bg-[#2f4275] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewMorePermissionsModal

