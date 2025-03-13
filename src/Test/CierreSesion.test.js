import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Perfil from "../app/Perfil";
import axios from "axios";

// Mock de axios
jest.mock("axios");

// Mock de useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

describe("Perfil Component", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("cierra sesión y redirige a la página de login", async () => {
    localStorage.setItem("token", "fake-token");
    axios.post.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    // Simular clic en el botón de cerrar sesión
    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("muestra mensaje de error si no hay sesión activa", async () => {
    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    // Simular clic en el botón de cerrar sesión
    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText("No hay sesión activa.")).toBeInTheDocument();
    });
  });
});
