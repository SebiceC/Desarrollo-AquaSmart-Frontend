import { MapPinIcon } from "lucide-react"
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa"
import { IoLogoWhatsapp, IoMdMail } from "react-icons/io"

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white">

            {/* Main Footer Content */}
            <div className="container mx-auto px-4 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-teal-400">AquaSmart</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Soluciones inteligentes para el manejo del agua. Comprometidos con la innovación y la sostenibilidad.
                        </p>
                        <div className="flex items-start gap-2">
                            <MapPinIcon className="h-5 w-5 text-teal-400 mt-1 flex-shrink-0" />
                            <span className="text-gray-300 text-sm">
                                Universidad Surcolombiana
                                <br />
                                Neiva, Huila
                            </span>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Información de Contacto</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <IoMdMail className="h-5 w-5 text-teal-400" />
                                <span className="text-gray-300 text-sm">soporte@aquasmart.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <IoLogoWhatsapp className="h-5 w-5 text-teal-400" />
                                <span className="text-gray-300 text-sm">+57 300 123 4567</span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4">
                            <h5 className="font-medium text-white">Horarios de Atención</h5>
                            <p className="text-gray-300 text-sm">
                                Lunes a Viernes: 8:00 AM - 6:00 PM
                                <br />
                                Sábados: 9:00 AM - 2:00 PM
                            </p>
                        </div>
                    </div>

                    {/* Social Media & Additional Info */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Síguenos</h4>
                        <div className="flex space-x-4">
                            <FaFacebook className="h-6 w-6 text-gray-300" />
                            <FaTwitter className="h-6 w-6 text-gray-300" />
                            <FaInstagram className="h-6 w-6 text-gray-300" />
                            <FaLinkedin className="h-6 w-6 text-gray-300" />
                        </div>

                        <div className="space-y-2 pt-4">
                            <h5 className="font-medium text-white">Misión</h5>
                            <p className="text-gray-300 text-sm">
                                Desarrollar tecnologías innovadoras para la gestión eficiente y sostenible del recurso hídrico.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-center items-center">
                        <p className="text-gray-400 text-sm">© 2025 AquaSmart. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
