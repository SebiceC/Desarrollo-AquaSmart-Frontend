"use client"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const BackButton = ({ to, text = "Regresar", iconSize = 18, className = "" }) => {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors ${className}`}
    >
      <ArrowLeft size={iconSize} /> {text}
    </button>
  )
}

export default BackButton

