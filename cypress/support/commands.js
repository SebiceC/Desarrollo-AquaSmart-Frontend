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
// <reference types="cypress" />
//<reference types="cypress/types" />
/* eslint-env mocha */
/* global , Cypress */
/* eslint-env cypress */
/* global , , cy */
// Ensure Cypress is globally available
// Ensure Cypress types are loaded for proper IntelliSense and type checking
// Definir un identificador único para la sesión (eliminado porque no se usa)
// Agregar un comando para definir el objeto `process` de manera consistente
// Agregamos un comando para definir el objeto process de manera consistente

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

export const navegarAHistorialFacturacion = () => {
  cy.visit("http://localhost:5173/perfil");
  cy.contains("button", "Facturación").click();
  cy.contains("a", "Historial de factura").should("be.visible").click();
  cy.visit("http://localhost:5173/facturacion/historial-facturas-lote");
  cy.url().should("include", "/facturacion/historial-facturas-lote");
  cy.contains("h1", "Historial de facturas").should("be.visible");
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

// Cerrar modal de confirmación (click en Cancelar)
export const cerrarModalFacturas = () => {
  cy.get(".bg-white.p-6.rounded-lg.shadow-lg.text-center").within(() => {
    cy.contains("button", "Cancelar").click();
  });
};
// Aceptar en el modal de confirmación
export const aceptarModalFacturas = () => {
  cy.get(".bg-white.p-6.rounded-lg.shadow-lg.text-center").within(() => {
    cy.contains("button", "Aceptar").click();
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
export const limpiarCAmposFactura = () => {
  cy.wait(1000);
  cy.get('input[placeholder="Tarifa fija piscicultura"]')
    .clear()
    .type(" ", { force: true }) // Dispara onChange en React
    .type("{backspace}");
  cy.wait(1000);

  cy.get('input[placeholder="Tarifa volumétrica piscicultura"]')
    .clear()
    .type(" ", { force: true }) // Dispara onChange en React
    .type("{backspace}");
  cy.get('input[placeholder="Tarifa fija agrícola común"]')
    .clear()
    .type(" ", { force: true }) // Dispara onChange en React
    .type("{backspace}");
  cy.get('input[placeholder="Tarifa volumétrica agrícola común"]').type(
    "{selectall}{backspace}"
  );
  cy.get('input[placeholder="Tarifa volumétrica agrícola común"]').clear();
  cy.get('input[placeholder="IVA"]').clear();
  cy.get('input[placeholder="ICA"]').clear();
  cy.get('input[placeholder="Nombre o razón social"]').clear();
  cy.get('input[placeholder="NIT"]').clear();
  cy.get('input[placeholder="Teléfono"]').clear();
  cy.get('input[placeholder="Dirección"]').clear();
  cy.get('input[placeholder="Correo electrónico"]').clear();
};
export const caracteresInvalidosEnCamposFactura = () => {
  const placeholders = [
    "Tarifa fija piscicultura",
    "Tarifa volumétrica piscicultura",
    "Tarifa fija agrícola común",
    "Tarifa volumétrica agrícola común",
    "IVA",
    "ICA",
    "Nombre o razón social",
    "NIT",
    "Teléfono",
    "Dirección",
    "Correo electrónico",
  ];
  cy.wait(1000);
  placeholders.forEach((placeholder) => {
    cy.get(`input[placeholder="${placeholder}"]`).clear().type("|");
    cy.wait(1000);
  });
};
export const validarMensaje = (textoEsperado) => {
  let falloDetectado = false;

  Cypress.on("fail", (error) => {
    falloDetectado = true;
    cy.log(`❌ ERROR: ${textoEsperado}`);
    throw error; // Lanza el error real para no taparlo
  });

  cy.contains(textoEsperado)
    .should("be.visible")
    .then(() => {
      if (!falloDetectado) {
        cy.log(`✅ OK: ${textoEsperado}`);
      }
    });
};
const direccionesHuila = [
  "Calle 21 #6-42, Neiva (USCO)",
  "Carrera 5 #10-50, Parque Industrial de Neiva",
  "Calle 8 #12-34, Centro Comercial Industrial de Neiva",
  "Kilómetro 2 vía Neiva - Rivera (Ceagrodex)",
  "Carrera 1 #15-85, Universidad Surcolombiana",
];
export const ingresarDireccionHuila = () => {
  const direccion =
    direccionesHuila[Math.floor(Math.random() * direccionesHuila.length)];

  cy.get('input[placeholder="Dirección"]')
    .clear()
    .type(direccion, { delay: 50 }); // simulamos tipeo humano
};

export const ingresarTelefonoAleatorio = () => {
  const random = Math.floor(1000000 + Math.random() * 9000000); // 7 dígitos aleatorios
  const telefono = `313${random}`; // Total: 10 dígitos

  cy.get('input[placeholder="Teléfono"]').clear().type(telefono);
};

export const validarEmail = () => {
  cy.get('input[placeholder="Correo electrónico"]')
    .clear()
    .type("aguainteligentes@gmail.com");
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

export const cambiarActivosInactivos = () => {
  const opciones = ["activa", "inactiva"];
  const seleccion = opciones[Math.floor(Math.random() * opciones.length)];

  cy.get("select").select(seleccion);
  clickFiltrar();
  cy.wait(3000);
  cy.get("body").then(($body) => {
    if ($body.find('button:contains("Ajustar caudal")').length > 0) {
      cy.log("✅ OK - Botón 'Ajustar caudal' disponible.");
    } else if (
      $body
        .text()
        .includes(
          "No se encontraron válvulas que coincidan con los criterios de búsqueda. Por favor, intente con otros filtros."
        )
    ) {
      cy.log("❌ ERROR - No se encontraron válvulas según filtro de estado.");
    } else {
      cy.log("⚠️ Advertencia - No se detectó respuesta esperada.");
    }
  });
};
