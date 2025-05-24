"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ChevronDown, ChevronUp } from "lucide-react"

const NavItem = ({ direction, text, subItems = [] }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const isActive = location.pathname.startsWith(direction)

    const [menuOpen, setMenuOpen] = useState(false)
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024)
    const contentRef = useRef(null)
    const menuRef = useRef(null)

    // Detectar cambios en el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 1024)
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Manejo de clics fuera del menú para cerrarlo
    const handleClickOutside = useCallback((event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setMenuOpen(false)
        }
    }, [])

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [handleClickOutside])

    const handleClick = () => {
        if (subItems.length > 0) {
            setMenuOpen(!menuOpen)
        } else {
            navigate(direction)
        }
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={handleClick}
                className={`w-full text-left px-2 py-2 font-semibold flex justify-between items-center transition-all duration-300 ease-in-out whitespace-nowrap rounded-md
                    ${isActive ? "bg-[#003F88] text-white" : "hover:text-white hover:bg-[#003F88]"}`}
            >
                <span>{text}</span>
                {subItems.length > 0 && (menuOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
            </button>

            {subItems.length > 0 && (
                <>
                    {isSmallScreen ? (
                        <div
                            ref={contentRef}
                            className="overflow-hidden transition-all duration-300 ease-in-out"
                            style={{
                                maxHeight: menuOpen ? `${contentRef.current?.scrollHeight}px` : "0px",
                            }}
                        >
                            <div className="bg-[#DCF2F1] w-full">
                                {subItems.map((subItem, index) => (
                                    <Link
                                        key={index}
                                        to={subItem.direction}
                                        className="block px-6 py-2 text-black hover:bg-[#002D62] hover:text-white transition"
                                        onClick={() => setTimeout(() => setMenuOpen(false), 150)}
                                    >
                                        {subItem.text}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`absolute left-0 w-full bg-[#DCF2F1] py-2 transition-all duration-300 ease-in-out z-50 rounded-md shadow-lg border border-gray-200 ${menuOpen ? "block" : "hidden"}`}
                        >
                            {subItems.map((subItem, index) => (
                                <Link
                                    key={index}
                                    to={subItem.direction}
                                    className="block px-4 py-2 text-black hover:bg-[#002D62] hover:text-white transition break-words"
                                    onClick={() => setTimeout(() => setMenuOpen(false), 150)}
                                >
                                    {subItem.text}
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default NavItem
