"use client"
import { Link } from "react-router-dom"
import { ShieldX, Home, ArrowLeft, HelpCircle } from "lucide-react"

const NotAuthorized = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 rounded-full p-4">
                        <ShieldX className="h-12 w-12 text-red-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    No tienes los permisos necesarios para acceder a este apartado. Si crees que esto es un error, contacta al
                    administrador.
                </p>

                <div className="space-y-4">
                    <Link
                        to="/home"
                        className="w-full bg-[#2ba19b] hover:bg-[#5b9794] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 no-underline"
                    >
                        <Home className="h-5 w-5" />
                        Volver al Inicio
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Página Anterior
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NotAuthorized
