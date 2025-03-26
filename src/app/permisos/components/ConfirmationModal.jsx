"use client"

import { X, AlertCircle, CheckCircle, Info } from "lucide-react"

const ConfirmationModal = ({ confirmationModal, setConfirmationModal }) => {
  if (!confirmationModal.isOpen) return null

  return (
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
  )
}

export default ConfirmationModal

