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

  /////////////////////////////////////////////////////////////////////////////////////

  test("Muestra error cuando el teléfono ingresado no coincide con el registrado", async () => {
    renderWithRouter(<ForgotPassword />);

    const documentInput = screen.getByPlaceholderText(
      "Ingresa tu Cédula de Ciudadanía"
    );
    const phoneInput = screen.getByPlaceholderText("Ingresa tu teléfono");
    const submitButton = screen.getByText("SOLICITAR TOKEN");

    fireEvent.change(documentInput, { target: { value: "1109420278" } });
    fireEvent.change(phoneInput, { target: { value: "3228061111" } }); // Teléfono incorrecto
    fireEvent.click(submitButton);

    // Espera a que el mensaje de error se muestre en pantalla
    await waitFor(() => {
      expect(
        screen.getByText("El número de teléfono no coincide con el registrado.")
      ).toBeInTheDocument();
    });
  });

  /////////////////////////////////////////////////////////////////////////////////////
  test("Cambia a formulario de ingreso de token después de solicitar", async () => {
    renderWithRouter(<ForgotPassword />);

    fireEvent.change(
      screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía"),
      {
        target: { value: "1234567890" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu teléfono"), {
      target: { value: "3201234567" },
    });
    fireEvent.click(screen.getByText("SOLICITAR TOKEN"));

    await waitFor(() => {
      expect(screen.getByText("INGRESO DE TOKEN")).toBeInTheDocument();
    });
  });

  test("Muestra error si el token ingresado es incorrecto", async () => {
    renderWithRouter(<ForgotPassword />);

    fireEvent.change(
      screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía"),
      {
        target: { value: "1234567890" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu teléfono"), {
      target: { value: "3201234567" },
    });
    fireEvent.click(screen.getByText("SOLICITAR TOKEN"));

    await waitFor(() => {
      expect(screen.getByText("INGRESO DE TOKEN")).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input, index) =>
      fireEvent.change(input, { target: { value: String(index + 1) } })
    );

    fireEvent.click(screen.getByText("ENVIAR"));

    await waitFor(() => {
      expect(screen.getByText(/token inválido/i)).toBeInTheDocument();
    });
  });

  test("Permite ingresar el token correctamente", async () => {
    renderWithRouter(<ForgotPassword />);

    fireEvent.change(
      screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía"),
      {
        target: { value: "1234567890" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu teléfono"), {
      target: { value: "3201234567" },
    });
    fireEvent.click(screen.getByText("SOLICITAR TOKEN"));

    await waitFor(() => {
      expect(screen.getByText("INGRESO DE TOKEN")).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("textbox");
    const correctToken = ["1", "2", "3", "4", "5", "6"];
    inputs.forEach((input, index) =>
      fireEvent.change(input, { target: { value: correctToken[index] } })
    );

    fireEvent.click(screen.getByText("ENVIAR"));

    await waitFor(() => {
      expect(screen.getByText(/Contraseña restablecida/i)).toBeInTheDocument();
    });
  });

  test("Muestra botón de reenvío de token cuando expira el tiempo", async () => {
    jest.useFakeTimers(); // Activar temporizador simulado
    renderWithRouter(<ForgotPassword />);

    fireEvent.change(
      screen.getByPlaceholderText("Ingresa tu Cédula de Ciudadanía"),
      {
        target: { value: "1234567890" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu teléfono"), {
      target: { value: "3201234567" },
    });
    fireEvent.click(screen.getByText("SOLICITAR TOKEN"));

    await waitFor(() => {
      expect(screen.getByText("INGRESO DE TOKEN")).toBeInTheDocument();
    });

    jest.advanceTimersByTime(61000); // Simular que pasa el tiempo

    await waitFor(() => {
      expect(
        screen.getByText(/Puedes solicitar un nuevo token/i)
      ).toBeInTheDocument();
      expect(screen.getByText("SOLICITAR NUEVO TOKEN")).not.toBeDisabled();
    });

    jest.useRealTimers(); // Restaurar temporizadores reales
  });
});
