// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
// cypress/support/commandsCustom.js
/* eslint-env mocha */
/* eslint-env cypress */
/* global cy */
// Ensure Cypress is globally available
// Ensure Cypress types are loaded for proper IntelliSense and type checking
// Definir un identificador único para la sesión (eliminado porque no se usa)
// Agregar un comando para definir el objeto `process` de manera consistente
// Agregamos un comando para definir el objeto process de manera consistente
// Importar funciones específicas

export const navegarAValvulas = () => {
  cy.visit("http://localhost:5173/perfil");
  cy.contains("button", "Control IoT").click();
  cy.contains("a", "Bocatoma").should("be.visible").click();
  cy.visit("http://localhost:5173/control-IoT/valvulas");
  cy.url().should("include", "/control-IoT/valvulas");
  cy.contains("h1", "Control de válvulas de riego").should("be.visible");
};

export const navegarAValvulaID = () => {
  cy.visit("http://localhost:5173/perfil");
  cy.visit("http://localhost:5173/control-IoT/valvulas/06-6501/update-flow");
  cy.contains("h1", "Ajuste de posición").should("be.visible");
};

export const navegarAFacturaGestion = () => {
  cy.visit("http://localhost:5173/perfil");
  cy.contains("button", "Facturación").click();
  cy.contains("a", "Gestión de facturas").should("be.visible").click();
  cy.visit("http://localhost:5173/facturacion/GestionFacturas");
  cy.url().should("include", "/facturacion/GestionFacturas");
  cy.contains("h1", "Gestión de Facturas").should("be.visible");
};

export const clickAperturaTotal = () => {
  cy.contains("button", "Apertura Total").click();
  cy.wait(1000);
};

export const clickCierreTotal = () => {
  cy.contains("button", "Cierre Total").click();
  cy.wait(1000);
};

export const clickAjustarCaudal = () => {
  cy.get(".fixed.inset-0").within(() => {
    cy.contains("button", "Sí, abrir!").click();
  });
  cy.wait(2000);
};

export const clickCerrarCaudal = () => {
  cy.get(".fixed.inset-0").within(() => {
    cy.contains("button", "Sí, cerrar!").click();
  });
  cy.wait(2000);
};

export const cerrarModal = () => {
  cy.get(".fixed.inset-0").within(() => {
    cy.contains("button", "Cerrar").click();
  });
};

export const clickFiltrar = () => {
  cy.contains("button", "Filtrar").click();
  cy.wait(1000);
};

export const clickGuardar = () => {
  cy.contains("button", "Guardar").click();
  cy.wait(1000);
};

export const clickAceptar = () => {
  cy.contains("button", "Aceptar").click();
  cy.wait(1000);
};

export const clickActualizar = () => {
  cy.contains("button", "ACTUALIZAR").click();
  cy.wait(1000);
};
export const limpiarCampos = () => {
  cy.get('input[placeholder="ID de válvula"]').clear();
  cy.get('input[placeholder="Nombre de válvula"]').clear();
  cy.get('input[placeholder="ID de ubicación"]').clear();
};

export const ingresarFechaHoy = (
  selector = 'input[type="date"]',
  index = 0
) => {
  const hoy = new Date().toISOString().split("T")[0];
  cy.get(selector).eq(index).type(hoy);
};

export const capturarBackFlow = () => {
  cy.wait("@updateFlow").then((interception) => {
    const { body: requestBody } = interception.request;
    const { statusCode, body: responseBody } = interception.response;

    // Consola del navegador
    console.log("📤 Payload enviado:", requestBody);
    console.log("📥 Mensaje del backend:", responseBody?.message);
    console.log("🟡 HTTP Status:", statusCode);

    // Cypress UI logs
    cy.log("📤 Payload enviado: " + JSON.stringify(requestBody));
    cy.log("📥 Mensaje del backend: " + responseBody?.message);
    cy.log("🟡 HTTP Status: " + statusCode);
  });
};
