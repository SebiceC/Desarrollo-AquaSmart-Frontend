"use client"

import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

const Notification = ({ notification, onClose }) => {
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

export default Notification

