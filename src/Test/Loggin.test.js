import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/";
import Login from "../app/auth/Login";
import { MemoryRouter } from "react-router-dom";

describe("Login Component", () => {
  test("validates document and password fields", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Obtener los campos de cédula y contraseña
    const documentInput = screen.getByPlaceholderText(
      "Ingresa tu Cédula de Ciudadanía"
    );
    const passwordInput = screen.getByPlaceholderText("Ingresa tu contraseña");
    const submitButton = screen.getByText("INICIAR SESIÓN");

    // Probar campos vacíos
    fireEvent.change(documentInput, { target: { value: "" } });
    fireEvent.change(passwordInput, { target: { value: "" } });
    fireEvent.click(submitButton);

    expect(
      screen.getByText("¡Campos vacíos, por favor completarlos!")
    ).toBeInTheDocument();

    // Probar campo de cédula con caracteres inválidos
    fireEvent.change(documentInput, { target: { value: "awaw1212" } });
    fireEvent.change(passwordInput, { target: { value: "asadsa21212" } });
    fireEvent.click(submitButton);

    expect(
      screen.getByText("¡Campos vacíos, por favor completarlos!")
    ).toBeInTheDocument();

    // Probar campo de cédula con caracteres válidos
    fireEvent.change(documentInput, { target: { value: "1109420278" } });
    fireEvent.change(passwordInput, { target: { value: "Cc115689*" } });
    fireEvent.click(submitButton);

    expect(
      screen.queryByText("¡Campos vacíos, o datos incorrectos!")
    ).not.toBeInTheDocument();
  });
});
