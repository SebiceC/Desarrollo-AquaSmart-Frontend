import React from "react"; // <-- Asegúrate de importar React
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import PreRegistrosList from "../app/gestionDatos/Users/PreRegistrosList";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// Inicializamos el mock de Axios
let mock = new MockAdapter(axios);

beforeEach(() => {
  mock.resetHandlers(); // Resetea solo los handlers sin eliminar la instancia del mock
});

afterAll(() => {
  mock.restore(); // Restaura Axios a su estado original después de todas las pruebas
});

test("Debe renderizar correctamente el componente", async () => {
  mock.onGet("/api/preregistros").reply(200, [
    {
      document: "12345",
      date_joined: "2024-03-10T12:00:00Z",
      is_active: true,
      is_registered: true,
    },
  ]);

  await act(async () => {
    render(
      <MemoryRouter>
        <PreRegistrosList />
      </MemoryRouter>
    );
  });

  expect(screen.getByText("Aprobación de Pre Registro")).toBeInTheDocument();
});

test("Debe realizar una llamada a la API al montarse", async () => {
  mock.onGet("/api/preregistros").reply(200, [
    {
      document: "12345",
      date_joined: "2024-03-10T12:00:00Z",
      is_active: true,
      is_registered: true,
    },
  ]);

  await act(async () => {
    render(
      <MemoryRouter>
        <PreRegistrosList />
      </MemoryRouter>
    );
  });

  await waitFor(() => {
    expect(mock.history.get.length).toBe(1);
  });
});
