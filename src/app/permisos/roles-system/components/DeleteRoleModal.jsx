"use client"

import { X, AlertCircle } from "lucide-react"

const DeleteRoleModal = ({ isOpen, onClose, currentRole, confirmDeleteRole, isSaving }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40" style={{ marginTop: "60px" }}>
      {/* Fondo difuminado alrededor del modal */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Contenido del modal */}
      <div className="bg-white rounded-lg max-w-md w-full shadow-lg relative z-10">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Confirmar eliminación</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
            onClick={onClose}
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
  )
}

export default DeleteRoleModal

