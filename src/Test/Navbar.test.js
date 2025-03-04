import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NavBar from "../components/NavBar"; // Asegúrate de que la ruta sea correcta

describe("NavBar Component", () => {
    test("renders logo and notification icon", () => {
        render(
            <MemoryRouter>
                <NavBar />
            </MemoryRouter>
        );

        // Verifica que el logo se renderiza
        const logo = screen.getByAltText("Logo");
        expect(logo).toBeInTheDocument();

        // Verifica que la campana de notificaciones se renderiza
        const bellIcon = screen.getByTestId("bell-icon");
        expect(bellIcon).toBeInTheDocument();
    });

    test("renders desktop navigation links", () => {
        render(
            <MemoryRouter>
                <NavBar />
            </MemoryRouter>
        );

        // Verificar que los enlaces existen
        const links = [
            "Perfil",
            "Control IoT",
            "Gestión de datos",
            "Facturación",
            "Historial de consumo",
            "Predicciones",
            "Permisos"
        ];

        links.forEach((linkText) => {
            expect(screen.getAllByText(linkText).length).toBeGreaterThan(0);        

        });
    });

    test("toggles mobile menu when clicking the menu button", () => {
        render(
            <MemoryRouter>
                <NavBar />
            </MemoryRouter>
        );

        const menuButton = screen.getByRole("button", { name: /Abrir menú de navegación/i });
        expect(menuButton).toBeInTheDocument();

        // Antes de hacer clic, el menú debe estar oculto
        const mobileMenu = screen.getByTestId("mobile-menu");
        expect(mobileMenu).toHaveClass("translate-x-full");

        // Simula clic en el botón de menú
        fireEvent.click(menuButton);

        // Ahora el menú debería estar visible
        expect(mobileMenu).toHaveClass("translate-x-0");

        // Cerrar el menú
        const closeButton = screen.getByRole("button", { name: /Cerrar menú/i });
        fireEvent.click(closeButton);

        // El menú vuelve a estar oculto
        expect(mobileMenu).toHaveClass("translate-x-full");
    });

    test("renders logout and help options", () => {
        render(
            <MemoryRouter>
                <NavBar />
            </MemoryRouter>
        );

        // Verifica que la opción de "Cerrar sesión" existe
        const logoutButton = screen.getByText(/Cerrar sesión/i);
        expect(logoutButton).toBeInTheDocument();

        // Verifica que la opción de "Manual de usuario y soporte" existe
        const helpLink = screen.getByText(/Manual de usuario y soporte/i);
        expect(helpLink).toBeInTheDocument();
    });
});
