describe("Formulario de Pre-registro de Usuario", () => {
  it("Debe completar el formulario correctamente y enviarlo", () => {
    cy.visit("http://localhost:5173/preRegister"); // Ajusta la URL según tu entorno

    // Completar datos personales
    cy.get("input[name='first_name']").type("SEBASTIAN");
    cy.get("input[name='last_name']").type("JIMENEZ FIGUEROA");
    cy.get("input[name='email']").type("teobservo@yahoo.com");
    cy.get("input[name='phone']").type("3228061144");
    cy.get("input[name='address']").type("kr 5 4 29");

    // Seleccionar tipo de persona
    cy.get("select[name='person_type']").select("Natural");
    // Seleccionar tipo de documento
    cy.get("select[name='document_type']").select("Cedula de ciudadanía (CC)");
    // Ingresar número de identificación
    cy.get("input[name='document']").type("1109420278");
    // Ingresar y confirmar contraseña
    cy.get("input[name='password']").type("Cc115689*");
    cy.get("input[name='confirmPassword']").type("Cc115689*");
    // Subir archivo PDF (Debe estar en la carpeta fixtures)
    cy.get('input[type="file"]').selectFile(
      "cypress/fixtures/certificado.pdf",
      { force: true }
    );
    // Hacer clic en el botón de registro
    cy.get("button").contains("Registro").click();
    // Validar que el mensaje de error está visible
    cy.get("div.fixed.inset-0.flex.items-center.justify-center") // Buscamos el contenedor de la alerta
      .should("be.visible")
      .within(() => {
        cy.contains("Error de Pre Registro").should("be.visible");
        cy.contains(
          "Error en el envío del formulario, ya que el número de identificación ya cuenta con un pre-registro realizado."
        ).should("be.visible");
      });
  });
});
