import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/lib/node";
import { rest } from "msw";
import Perfil from "../app/Perfil";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";

// Configurar Mock Service Worker (MSW) para interceptar la API
const API_URL = process.env.VITE_APP_API_URL || "http://localhost:5173";

// Datos ficticios del usuario
const mockUserData = {
  first_name: "Oscar",
  last_name: "Perdomo",
  document: "12345678",
  person_type_name: "Administrador",
  phone: "+57 3123456789",
  email: "oscar@example.com",
};

// Mock de la API
const server = setupServer(
  rest.get(`${API_URL}/users/profile`, (req, res, ctx) => {
    return res(ctx.json(mockUserData));
  })
);

// Configurar el servidor antes y después de cada prueba
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Perfil Component", () => {
  test("Muestra el mensaje 'Cargando perfil...' antes de recibir los datos", async () => {
    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    expect(screen.getByText(/Cargando perfil.../i)).toBeInTheDocument();
  });

  test("Carga y muestra los datos personales del usuario", async () => {
    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    // Esperar a que los datos sean cargados
    await waitFor(() => screen.getByText(/Oscar Perdomo/i));

    // Verificar que los datos aparecen en pantalla
    expect(screen.getByText(/Oscar Perdomo/i)).toBeInTheDocument();
    expect(screen.getByText(/ID: 12345678/i)).toBeInTheDocument();
    expect(screen.getByText(/Persona: Administrador/i)).toBeInTheDocument();
    expect(screen.getByText(/\+57 3123456789/i)).toBeInTheDocument();
    expect(screen.getByText(/oscar@example.com/i)).toBeInTheDocument();
  });
});
