import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/";
import axios from "axios";
import { AuthProvider } from "../app/context/AuthProvider";

// Mock de axios
jest.mock("axios");

describe("AuthProvider Component - Doble Inicio de Sesión", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("Se activa modal con: Tu sesión ha sido cerrada porque iniciaste sesión en otro dispositivo.", async () => {
    // Simulación de doble inicio de sesión
    localStorage.setItem("token", "fake-token");

    // Primera validación exitosa (sesión activa)
    axios.get.mockResolvedValueOnce({ status: 200 });

    // Luego, el servidor responde con un 401 indicando que la sesión se cerró en otro dispositivo
    axios.get.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { detail: "Session closed on another device" },
      },
    });

    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    // Esperamos que inicialmente no haya modal
    await waitFor(() => {
      expect(screen.queryByText("SESIÓN FINALIZADA")).not.toBeInTheDocument();
    });

    // Simulamos el segundo chequeo de sesión fallido
    await act(async () => {
      jest.advanceTimersByTime(1200000); // Adelantar 20 minutos para la validación periódica
    });

    // Ahora el modal debe aparecer con el mensaje correcto
    await waitFor(() => {
      expect(screen.getByText("SESIÓN FINALIZADA")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Tu sesión ha sido cerrada porque iniciaste sesión en otro dispositivo."
        )
      ).toBeInTheDocument();
    });
  });
});
