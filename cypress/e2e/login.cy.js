/// <reference types="cypress" />
beforeEach(() => {
  cy.viewport(1920, 1080); // Adjust these values to a desktop screen size
});
describe("Prueba de inicio de sesión con OTP en Cypress", () => {
  const cedula = "1109420278"; // Ajusta con un valor válido
  const password = "Cc115689*"; // Ajusta con un valor válido
  const otpCode = "743178"; // OTP preajustado

  beforeEach(() => {
    cy.visit("http://localhost:5173/login"); // Ajusta con la URL correcta
  });

  it("Debe completar el inicio de sesión con OTP", () => {
    // Llenar el campo de cédula
    cy.get("input#document").type(cedula);

    // Llenar el campo de contraseña
    cy.get("input#password").type(password);

    // Hacer clic en el botón de iniciar sesión
    cy.contains("INICIAR SESIÓN").click();

    // Esperar el mensaje de confirmación del envío del token
    cy.contains("TOKEN ENVIADO").should("be.visible");
    // Temporizador de 2 segundos antes de clic"
    cy.log("Esperando 2 segundos antes de cerrar aviso...");
    cy.wait(2000);
    // Hacer clic en el botón de confirmar
    cy.contains("CONFIRMAR").click();

    // Llenar los campos del token con el OTP preajustado
    cy.get('input[type="tel"]').each(($el, index) => {
      cy.wrap($el).type(otpCode[index]);
    });

    // Temporizador de 20 segundos antes de hacer clic en "ENVIAR"
    cy.log("Esperando 20 segundos antes de enviar el OTP...");
    cy.wait(20000); // Espera de 20 segundos para que el usuario pueda verificar

    // Aquí Cypress NO hará clic automáticamente en "ENVIAR",
    // el usuario deberá hacerlo manualmente
    // Temporizador de 2 segundos antes de clic"
    cy.log("Esperando 2 segundos antes de cerrar aviso...");
    cy.wait(2000);
    cy.log("Ahora haz clic manualmente en 'ENVIAR'");
    cy.log("Esperando 2 segundos antes de cerrar aviso...");
    cy.wait(2000);
    // Verificar que el inicio de sesión fue exitoso después de que el usuario haga clic
    cy.contains("INICIO DE SESIÓN EXITOSO", { timeout: 30000 }).should(
      "be.visible"
    );
    cy.log("Esperando 2 segundos antes de cerrar aviso...");
    cy.wait(2000);
    // Hacer clic en continuar
    cy.contains("CONTINUAR").click();
  });
});
