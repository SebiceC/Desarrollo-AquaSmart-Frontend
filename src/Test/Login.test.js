import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import Login from "../app/auth/Login";

// Mock de axios
jest.mock("axios");

describe("Login Component - Verificar inicio de sesión", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("inicia sesión correctamente, captura el token y muestra el modal de éxito", async () => {
    // Mock de la respuesta del servidor
    axios.post.mockResolvedValueOnce({
      data: {
        token: "fake-jwt-token",
      },
    });

    // Renderizar el componente envuelto en MemoryRouter
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Simular entrada de datos en los campos de documento y contraseña
    fireEvent.change(
      screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía"),
      {
        target: { value: "123456789" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu contraseña"), {
      target: { value: "password123" },
    });

    // Simular clic en el botón de inicio de sesión
    fireEvent.click(screen.getByText("INICIAR SESIÓN"));

    // Esperar a que se muestre el modal de éxito
    await waitFor(() => {
      expect(screen.getByText("TOKEN ENVIADO")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Se ha enviado un token de 6 caracteres a tu número de teléfono registrado."
        )
      ).toBeInTheDocument();
    });
  });

  test("muestra un mensaje de error si los campos están vacíos", async () => {
    // Renderizar el componente envuelto en MemoryRouter
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Simular clic en el botón de inicio de sesión sin llenar los campos
    fireEvent.click(screen.getByText("INICIAR SESIÓN"));

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(
        screen.getByText("¡Campos vacíos, por favor completarlos!")
      ).toBeInTheDocument();
    });
  });

  test("muestra un mensaje de error si las credenciales son incorrectas", async () => {
    // Mock de la respuesta del servidor con error 401
    axios.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          error: {
            detail: "Contraseña incorrecta.",
          },
        },
      },
    });

    // Renderizar el componente envuelto en MemoryRouter
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Simular entrada de datos en los campos de documento y contraseña
    fireEvent.change(
      screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía"),
      {
        target: { value: "123456789" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu contraseña"), {
      target: { value: "wrongpassword" },
    });

    // Simular clic en el botón de inicio de sesión
    fireEvent.click(screen.getByText("INICIAR SESIÓN"));

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByText("Contraseña incorrecta.")).toBeInTheDocument();
    });
  });
});
