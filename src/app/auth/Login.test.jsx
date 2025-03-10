import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import Login from "./Login";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
const mockAxios = new MockAdapter(axios);

describe("Login Component", () => {
  beforeEach(() => {
    mockAxios.reset(); // Resetea las respuestas de la API antes de cada prueba
  });

  test("Debe renderizar correctamente el formulario de login", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText("INICIO DE SESIÓN")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ingresa tu contraseña")).toBeInTheDocument();
    expect(screen.getByText("INICIAR SESIÓN")).toBeInTheDocument();
  });

  test("Debe mostrar mensaje de error si los campos están vacíos", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("INICIAR SESIÓN"));

    await waitFor(() => {
      expect(screen.getByText("¡Campos vacíos, por favor completarlos!")).toBeInTheDocument();
    });
  });

  test("Debe permitir el ingreso de datos en los campos", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const documentInput = screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía");
    const passwordInput = screen.getByPlaceholderText("Ingresa tu contraseña");

    fireEvent.change(documentInput, { target: { value: "123456789" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(documentInput.value).toBe("123456789");
    expect(passwordInput.value).toBe("password123");
  });

  test("Debe mostrar error si la API responde con credenciales incorrectas", async () => {
    // Simula una respuesta de error 401 para login incorrecto
    mockAxios.onPost("http://localhost:5000/users/login").reply(401, {
      error: "Contraseña incorrecta",
    });


    render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.change(screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía"), {
        target: { value: "123456789" },
      });
      fireEvent.change(screen.getByPlaceholderText("Ingresa tu contraseña"), {
        target: { value: "wrongpassword" },
      });

      fireEvent.click(screen.getByText("INICIAR SESIÓN"));

      await waitFor(() => {
        expect(screen.getByText("Contraseña incorrecta")).toBeInTheDocument();
      });
    });

    test("Debe mostrar modal cuando el login es exitoso", async () => {
        // Simula una respuesta de éxito 200 con mensaje de token enviado
        mockAxios.onPost("http://localhost:5000/users/login").reply(200, {
          message: "TOKEN ENVIADO",
        });

        render(
            <MemoryRouter>
              <Login />
            </MemoryRouter>
          );

          fireEvent.change(screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía"), {
            target: { value: "123456789" },
          });
          fireEvent.change(screen.getByPlaceholderText("Ingresa tu contraseña"), {
            target: { value: "password123" },
          });
      
          fireEvent.click(screen.getByText("INICIAR SESIÓN"));
      
          await waitFor(() => {
            expect(screen.getByText("TOKEN ENVIADO")).toBeInTheDocument();
          });
        });
      });