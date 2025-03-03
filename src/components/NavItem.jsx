import React from "react";
import { Link, useLocation } from "react-router-dom";

const NavItem = ({ direction, text }) => {
    const location = useLocation();
    const isActive = location.pathname === direction || (direction === "/perfil" && location.pathname === "/");

    return (
        <div>
            <Link
                to={direction}
                className={`w-full text-center px-3 py-5 font-semibold transition-all duration-300 ease-in-out 
                    ${isActive ? "bg-[#003F88] text-white" : "hover:text-white hover:bg-[#003F88]"}`}
            >
                {text}
            </Link>
        </div>
    );
};

export default NavItem;
