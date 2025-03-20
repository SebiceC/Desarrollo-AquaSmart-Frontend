// Removed unused React import
// Removed unused fireEvent import
import "@testing-library/jest-dom";
import { describe, test, expect } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import PreRegister from "../app/auth/PreRegister";

describe("Validaciones del formulario", () => {
  function validateForm(fields) {
    let newErrors = {};
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/;
    const numberRegex = /^\d+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[._!@#$%^&*])(?=.{8,})/;

    const {
      first_name,
      last_name,
      address,
      phone,
      document,
      email,
      password,
      confirmPassword,
      person_type,
      document_type,
      attachments,
    } = fields;

    if (!first_name) newErrors.first_name = "ERROR, campo vacío";
    else if (!nameRegex.test(first_name))
      newErrors.first_name = "Solo se permiten letras y espacios";
    else if (first_name.length > 20)
      newErrors.first_name = "Máximo 20 caracteres";

    if (!last_name) newErrors.last_name = "ERROR, campo vacío";
    else if (!nameRegex.test())
      newErrors.last_name = "Solo se permiten letras y espacios";
    else if (last_name.length > 20)
      newErrors.last_name = "Máximo 20 caracteres";

    if (!address) newErrors.address = "ERROR, campo vacío";

    if (!phone) newErrors.phone = "ERROR, campo vacío";
    else if (!numberRegex.test(phone))
      newErrors.phone = "Solo se permiten números";
    else if (phone.length > 13) newErrors.phone = "Máximo 13 caracteres";

    if (!document) newErrors.document = "ERROR, campo vacío";
    else if (!numberRegex.test(document))
      newErrors.document = "Solo se permiten números";
    else if (document.length > 15) newErrors.document = "Máximo 15 caracteres";

    if (!email) newErrors.email = "ERROR, campo vacío";
    else if (!emailRegex.test(email))
      newErrors.email = "Formato de correo electrónico inválido";
    else if (email.length > 50) newErrors.email = "Máximo 50 caracteres";

    if (!password) newErrors.password = "ERROR, campo vacío";
    else if (!passwordRegex.test(password))
      newErrors.password =
        "La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial";
    else if (password.length > 20) newErrors.password = "Máximo 20 caracteres";

    if (!person_type) newErrors.person_type = "ERROR, campo vacío";
    if (!document_type) newErrors.document_type = "ERROR, campo vacío";

    if (!confirmPassword) newErrors.confirmPassword = "ERROR, campo vacío";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
    else if (confirmPassword.length > 20)
      newErrors.confirmPassword = "Máximo 20 caracteres";

    if (!attachments || attachments.length === 0)
      newErrors.attachments = "Debe adjuntar al menos un archivo";

    return newErrors;
  }

  test("Debe devolver un error cuando los campos están vacíos", () => {
    const errors = validateForm({});
    expect(errors).toHaveProperty("first_name", "ERROR, campo vacío");
    expect(errors).toHaveProperty("last_name", "ERROR, campo vacío");
    expect(errors).toHaveProperty("address", "ERROR, campo vacío");
    expect(errors).toHaveProperty("phone", "ERROR, campo vacío");
    expect(errors).toHaveProperty("document", "ERROR, campo vacío");
    expect(errors).toHaveProperty("email", "ERROR, campo vacío");
    expect(errors).toHaveProperty("password", "ERROR, campo vacío");
    expect(errors).toHaveProperty("confirmPassword", "ERROR, campo vacío");
    expect(errors).toHaveProperty("person_type", "ERROR, campo vacío");
    expect(errors).toHaveProperty("document_type", "ERROR, campo vacío");
    expect(errors).toHaveProperty(
      "attachments",
      "Debe adjuntar al menos un archivo"
    );
  });

  test("Debe devolver un error si los nombres contienen caracteres inválidos", () => {
    const errors = validateForm({ first_name: "123", last_name: "@#$" });
    expect(errors).toHaveProperty(
      "first_name",
      "Solo se permiten letras y espacios"
    );
    expect(errors).toHaveProperty(
      "last_name",
      "Solo se permiten letras y espacios"
    );
  });

  test("Debe devolver un error si el teléfono o documento contienen caracteres no numéricos", () => {
    const errors = validateForm({ phone: "x123", document: "123-45" });
    expect(errors).toHaveProperty("phone", "Solo se permiten números");
    expect(errors).toHaveProperty("document", "Solo se permiten números");
  });

  test("Debe devolver un error si el correo tiene un formato inválido", () => {
    const errors = validateForm({ email: "invalid-email" });
    expect(errors).toHaveProperty(
      "email",
      "Formato de correo electrónico inválido"
    );
  });

  test("Debe devolver un error si la contraseña no cumple con los requisitos", () => {
    const errors = validateForm({ password: "abc123" });
    expect(errors).toHaveProperty(
      "password",
      "La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial"
    );
  });
  // Test para verificar que no se devuelva un error si la contraseña cumple con los requisitos
  test("Debe devolver un error si las contraseñas no coinciden", () => {
    const errors = validateForm({
      password: "Passw0rd!",
      confirmPassword: "Passw0rd123!",
    });

    expect(errors).toHaveProperty(
      "confirmPassword",
      "Las contraseñas no coinciden."
    );
  });
  // Test para verificar que no se devuelva un error si las contraseñas coinciden
  test("No debe devolver un error si las contraseñas coinciden", () => {
    const errors = validateForm({
      password: "Passw0rd!",
      confirmPassword: "Passw0rd!",
    });
    expect(errors).not.toHaveProperty("confirmPassword");
  });

  test("Debe devolver un error si no se adjuntan archivos", () => {
    const errors = validateForm({ attachments: [] });
    expect(errors).toHaveProperty(
      "attachments",
      "Debe adjuntar al menos un archivo"
    );
  });

  test("Debe devolver un objeto vacío si todos los campos son válidos", () => {
    const errors = validateForm({
      first_name: "Juan",
      last_name: "Pérez",
      address: "Calle 123",
      phone: "1234567890",
      document: "987654321",
      email: "correo@example.com",
      password: "Passw0rd!",
      confirmPassword: "Passw0rd!",
      person_type: "Natural",
      document_type: "Cédula",
      attachments: ["archivo.pdf"],
    });
    expect(errors).toEqual({});
  });

  test("Debe devolver un error si el teléfono o documento contienen caracteres no numéricos", () => {
    const errors = validateForm({ phone: "123ABC", document: "9876-543" });
    expect(errors).toHaveProperty("phone", "Solo se permiten números");
    expect(errors).toHaveProperty("document", "Solo se permiten números");
  });

  test("No debe devolver errores si el teléfono y el documento son completamente numéricos", () => {
    const errors = validateForm({
      phone: "123456789012",
      document: "987654321",
    });
    expect(errors).not.toHaveProperty("phone");
    expect(errors).not.toHaveProperty("document");
  });
});
