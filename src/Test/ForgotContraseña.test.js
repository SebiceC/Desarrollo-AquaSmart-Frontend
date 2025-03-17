import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; // Importar MemoryRouter
import ForgotPassword from "../app/forgotPassword/ForgotPassword";

const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("ForgotPassword - Pruebas de Integración", () => {
  test("Renderiza el formulario de solicitud de token correctamente", () => {
    renderWithRouter(<ForgotPassword />);
    expect(screen.getByText("RECUPERACIÓN DE CONTRASEÑA")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ingresa tu teléfono")
    ).toBeInTheDocument();
    expect(screen.getByText("SOLICITAR TOKEN")).toBeInTheDocument();
  });

  test("Muestra error si los campos están vacíos", async () => {
    renderWithRouter(<ForgotPassword />);
    fireEvent.click(screen.getByText("SOLICITAR TOKEN"));

    await waitFor(() => {
      expect(
        screen.getByText(/Todos los campos son obligatorios/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Todos los campos son obligatorios./i)
      ).toBeInTheDocument();
    });
  });

  test("Permite ingresar cédula y teléfono correctamente", () => {
    renderWithRouter(<ForgotPassword />);

    const documentInput = screen.getByPlaceholderText(
      "Ingresa tu Cédula de Ciudadanía"
    );
    const phoneInput = screen.getByPlaceholderText("Ingresa tu teléfono");

    fireEvent.change(documentInput, { target: { value: "1234567890" } });
    fireEvent.change(phoneInput, { target: { value: "3201234567" } });

    expect(documentInput.value).toBe("1234567890");
    expect(phoneInput.value).toBe("3201234567");
  });

});