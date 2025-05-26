"use client"

import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"  // Para obtener parámetro de URL
import { CreditCard, Lock, Shield, CheckCircle, ChevronDown, ArrowLeft } from "lucide-react"
import axios from "axios"
import BackButton from "../../components/BackButton"

export default function PasarelaPago() {
    const { id_bill } = useParams() // ID factura desde URL

    // Estados del formulario y UI
    const [paymentMethod, setPaymentMethod] = useState("card")
    const [cardNumber, setCardNumber] = useState("")
    const [cardName, setCardName] = useState("")
    const [cvv, setCvv] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [expiryMonth, setExpiryMonth] = useState("")
    const [expiryYear, setExpiryYear] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")

    // Estados de errores
    const [phoneError, setPhoneError] = useState("")
    const [cardNameError, setCardNameError] = useState("")
    const [cvvError, setCvvError] = useState("")
    const [expiryError, setExpiryError] = useState("")
    const [cardNumberError, setCardNumberError] = useState("")

    // Estado para modal y factura
    const [showModal, setShowModal] = useState(false)
    const [modalMessage, setModalMessage] = useState("")
    const [modalTitle, setModalTitle] = useState("")
    const [factura, setFactura] = useState(null)
    const [loadingFactura, setLoadingFactura] = useState(true)

    const API_URL = import.meta.env.VITE_APP_API_URL
    const navigate = useNavigate();

    // Fetch factura real al montar
    useEffect(() => {
        if (!id_bill) return

        const fetchFactura = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) throw new Error("No autorizado")

                const res = await axios.get(`${API_URL}/billing/bills/${id_bill}`, {
                    headers: { Authorization: `Token ${token}` },
                })

                setFactura(res.data)
            } catch (error) {
                console.error("Error cargando factura:", error)
                setModalTitle("Error")
                setModalMessage("No se pudo cargar la factura. Por favor, intente de nuevo.")
                setShowModal(true)
            } finally {
                setLoadingFactura(false)
            }
        }

        fetchFactura()
    }, [id_bill])

    // Funciones auxiliares
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
        const matches = v.match(/\d{4,16}/g)
        const match = (matches && matches[0]) || ""
        const parts = []
        for (let i = 0; i < match.length; i += 4) {
            parts.push(match.substring(i, i + 4))
        }
        return parts.length ? parts.join(" ") : v
    }

    const handleCardNumberChange = (e) => {
        const formattedNumber = formatCardNumber(e.target.value)
        setCardNumber(formattedNumber)

        // Validar que tenga exactamente 16 dígitos
        const digitsOnly = formattedNumber.replace(/\s/g, "")
        if (digitsOnly.length === 0) {
            setCardNumberError("El número de tarjeta es requerido")
        } else if (digitsOnly.length < 16) {
            setCardNumberError("El número de tarjeta debe tener 16 dígitos")
        } else if (digitsOnly.length > 16) {
            setCardNumberError("El número de tarjeta no puede tener más de 16 dígitos")
        } else {
            setCardNumberError("")
        }
    }

    const handleCardNameChange = (e) => {
        const value = e.target.value
        // Solo permitir letras y espacios
        const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")

        if (onlyLetters.length <= 30) {
            setCardName(onlyLetters.toUpperCase())
            setCardNameError("")
        } else {
            setCardNameError("El nombre no puede tener más de 30 caracteres")
        }

        if (onlyLetters.length === 0) {
            setCardNameError("El nombre es requerido")
        }
    }

    const handleCvvChange = (e) => {
        const value = e.target.value
        // Solo permitir números
        const onlyNumbers = value.replace(/\D/g, "")

        if (onlyNumbers.length <= 4) {
            setCvv(onlyNumbers)

            if (onlyNumbers.length < 3) {
                setCvvError("El CVV debe tener mínimo 3 dígitos")
            } else {
                setCvvError("")
            }
        }
    }

    const handlePhoneNumberChange = (e) => {
        const onlyNums = e.target.value.replace(/\D/g, "")
        setPhoneNumber(onlyNums)
        if (onlyNums.length < 10) setPhoneError("El número debe tener 10 dígitos")
        else if (onlyNums.length > 10) setPhoneError("El número no puede tener más de 10 dígitos")
        else setPhoneError("")
    }

    const validateExpiryDate = (month, year) => {
        if (!month || !year) {
            setExpiryError("Seleccione mes y año de vencimiento")
            return false
        }

        const currentDate = new Date()
        const expiryDate = new Date(parseInt(year), parseInt(month) - 1)
        const minDate = new Date(2025, 5) // Junio 2025 (mes 5 porque es 0-indexado)

        if (expiryDate < minDate) {
            setExpiryError("La tarjeta no puede vencer antes de 06/2025")
            return false
        }

        setExpiryError("")
        return true
    }

    const handleExpiryMonthChange = (e) => {
        const month = e.target.value
        setExpiryMonth(month)
        validateExpiryDate(month, expiryYear)
    }

    const handleExpiryYearChange = (e) => {
        const year = e.target.value
        setExpiryYear(year)
        validateExpiryDate(expiryMonth, year)
    }

    // Actualizar estado factura en backend
    const actualizarEstadoFactura = async (facturaCode) => {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("No autorizado")

        const response = await axios.post(
            `${API_URL}/billing/bills/update-status`,
            { code: facturaCode, status: "pagada" },
            { headers: { Authorization: `Token ${token}` } },
        )
        return response.data
    }

    // Validar formulario antes del pago
    const validateForm = () => {
        let isValid = true

        if (paymentMethod === "card") {
            // Validar número de tarjeta
            const cardDigits = cardNumber.replace(/\s/g, "")
            if (cardDigits.length !== 16) {
                setCardNumberError("El número de tarjeta debe tener exactamente 16 dígitos")
                isValid = false
            }

            // Validar nombre
            if (!cardName.trim()) {
                setCardNameError("El nombre es requerido")
                isValid = false
            }

            // Validar CVV
            if (cvv.length < 3) {
                setCvvError("El CVV debe tener mínimo 3 dígitos")
                isValid = false
            }

            // Validar fecha de expiración
            if (!validateExpiryDate(expiryMonth, expiryYear)) {
                isValid = false
            }
        }

        if (paymentMethod === "nequi" && phoneNumber.length !== 10) {
            setPhoneError("El número debe tener exactamente 10 dígitos")
            isValid = false
        }

        return isValid
    }

    // Manejar pago
    const handlePayment = async () => {
        if (!validateForm()) {
            return
        }

        if (!factura) {
            setModalTitle("Error")
            setModalMessage("No hay factura cargada para procesar el pago.")
            setShowModal(true)
            return
        }

        setIsProcessing(true)

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500)) // Simular delay
            await actualizarEstadoFactura(factura.code)
            setFactura({ ...factura, status: "pagada" })
            setModalTitle("Pago Exitoso")
            setModalMessage("¡Pago procesado con éxito! La factura ha sido marcada como pagada.")
            setShowModal(true)
        } catch (error) {
            let errorMessage = "Error al actualizar el estado de la factura. Por favor, contacte a soporte."
            if (error.response?.data?.detail) errorMessage = error.response.data.detail
            setModalTitle("Error")
            setModalMessage(errorMessage)
            setShowModal(true)
        } finally {
            setIsProcessing(false)
        }
    }

    if (loadingFactura) return <p className="p-4 text-center">Cargando datos de la factura...</p>
    if (!factura)
        return (
            <p className="p-4 text-center text-red-600">
                No se encontró la factura. Por favor, verifique la URL o intente de nuevo.
            </p>
        )

    const formatCurrency = (value) => {
        if (!value) return "$0"
        const numValue = Number.parseFloat(value)
        return `$${numValue.toLocaleString("es-CO")}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <button
                onClick={() => navigate(-1)} // -1 significa "una vista atrás"
                className="bg-[#2d6a4f] text-white px-4 py-2 rounded-lg flex items-center gap-3 font-semibold mb-5"
            >
                <ArrowLeft size={18}/>Volver a detalle de factura
            </button>
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">FINALIZAR PAGO</h1>
                    <p className="text-slate-600">Completa tu pago de forma segura</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Formulario de Pago */}
                    <div className="space-y-6">
                        {/* Métodos de Pago */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                            <div className="p-6 border-b border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    Método de Pago
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">Selecciona tu método de pago preferido</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <label className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={paymentMethod === "card"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-4 h-4 text-[#2d6a4f]"
                                    />
                                    <CreditCard className="h-5 w-5 text-[#2d6a4f]" />
                                    <div className="flex-1">
                                        <div className="font-medium">Tarjeta de Crédito/Débito</div>
                                        <div className="text-sm text-slate-500">Visa, Mastercard, American Express</div>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="nequi"
                                        checked={paymentMethod === "nequi"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-4 h-4 text-[#2d6a4f]"
                                    />
                                    <div className="h-5 w-5 bg-[#2d6a4f] rounded flex items-center justify-center">
                                        <img src="/img/nequi.png" alt="Nequi" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">Nequi</div>
                                        <div className="text-sm text-slate-500">Paga con tu cuenta nequi</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Formulario de Tarjeta */}
                        {paymentMethod === "card" && (
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="p-6 border-b border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-900">Información de la Tarjeta</h3>
                                    <p className="text-sm text-slate-600 mt-1">Ingresa los datos de tu tarjeta de forma segura</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700">
                                            Número de Tarjeta
                                        </label>
                                        <input
                                            id="cardNumber"
                                            type="text"
                                            placeholder="1234 5678 9012 3456"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            maxLength={19}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent text-lg tracking-wider ${cardNumberError ? "border-red-500" : "border-slate-300"
                                                }`}
                                        />
                                        {cardNumberError && <p className="text-red-600 text-sm">{cardNumberError}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="cardName" className="block text-sm font-medium text-slate-700">
                                            Nombre del Titular
                                        </label>
                                        <input
                                            id="cardName"
                                            type="text"
                                            placeholder="Juan Pérez"
                                            value={cardName}
                                            onChange={handleCardNameChange}
                                            maxLength={30}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent uppercase ${cardNameError ? "border-red-500" : "border-slate-300"
                                                }`}
                                        />
                                        {cardNameError && <p className="text-red-600 text-sm">{cardNameError}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700">Fecha de Vencimiento</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <select
                                                        value={expiryMonth}
                                                        onChange={handleExpiryMonthChange}
                                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent appearance-none bg-white ${expiryError ? "border-red-500" : "border-slate-300"
                                                            }`}
                                                    >
                                                        <option value="">Mes</option>
                                                        {Array.from({ length: 12 }, (_, i) => (
                                                            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                                                                {String(i + 1).padStart(2, "0")}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={expiryYear}
                                                        onChange={handleExpiryYearChange}
                                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent appearance-none bg-white ${expiryError ? "border-red-500" : "border-slate-300"
                                                            }`}
                                                    >
                                                        <option value="">Año</option>
                                                        {Array.from({ length: 10 }, (_, i) => (
                                                            <option key={i} value={String(2024 + i)}>
                                                                {2024 + i}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            {expiryError && <p className="text-red-600 text-sm">{expiryError}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="cvv" className="block text-sm font-medium text-slate-700">
                                                CVV
                                            </label>
                                            <input
                                                id="cvv"
                                                type="text"
                                                placeholder="123"
                                                value={cvv}
                                                onChange={handleCvvChange}
                                                maxLength={4}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent text-center ${cvvError ? "border-red-500" : "border-slate-300"
                                                    }`}
                                            />
                                            {cvvError && <p className="text-red-600 text-sm">{cvvError}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Campo teléfono solo para Nequi */}
                        {paymentMethod === "nequi" && (
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
                                    Número de teléfono
                                </label>
                                <input
                                    id="phoneNumber"
                                    type="text"
                                    placeholder="Ej: 3001234567"
                                    value={phoneNumber}
                                    onChange={handlePhoneNumberChange}
                                    maxLength={10}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent ${phoneError ? "border-red-500" : "border-slate-300"
                                        }`}
                                />
                                {phoneError && <p className="text-red-600 mt-1 text-sm">{phoneError}</p>}
                            </div>
                        )}
                    </div>

                    {/* Resumen del Pedido */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                            <div className="p-6 border-b border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900">Total de la factura</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Productos */}

                                {/* Cálculos */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Total</span>
                                        <span>{factura ? formatCurrency(factura.total_amount) : "-"}</span>
                                    </div>
                                    <hr className="border-slate-200" />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{factura ? formatCurrency(factura.total_amount) : "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seguridad */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                            <div className="p-6">
                                <div className="flex items-center gap-3 text-sm text-[slate-600] mb-4">
                                    <Lock className="h-4 w-4 text-green-600" />
                                    <span>Conexión segura</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[slate-600] mb-4">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Datos protegidos</span>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <span className="px-2 py-1 text-xs border border-slate-300 rounded">Visa</span>
                                    <span className="px-2 py-1 text-xs border border-slate-300 rounded">Mastercard</span>
                                    <span className="px-2 py-1 text-xs border border-slate-300 rounded">Nequi</span>
                                </div>
                            </div>
                        </div>

                        {/* Botón de Pago */}
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full h-12 text-lg font-semibold bg-[#2d6a4f] text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-5 w-5" />
                                    Pagar {factura ? formatCurrency(factura.total_amount) : "-"}
                                </>
                            )}
                        </button>

                        {/* Modal sencillo */}
                        {showModal && (
                            <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50 ">
                                <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-lg">
                                    <h2 className="text-xl font-semibold mb-4">{modalTitle}</h2>
                                    <p className="mb-6">{modalMessage}</p>
                                    <button
                                        onClick={() => navigate("/mis-facturas")}
                                        className="bg-[#2d6a4f] text-white px-4 py-2 rounded"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}