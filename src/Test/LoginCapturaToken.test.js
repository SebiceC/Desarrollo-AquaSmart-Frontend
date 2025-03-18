import axios from "axios";

describe("Login API - Llamado real", () => {
  test("realiza un login con credenciales reales y verifica el mensaje de OTP", async () => {
    const API_URL =
      "https://desarrollo-aquasmart-backend-yhde.onrender.com/api/users/login"; // URL real de tu API
    const credentials = {
      document: "1109420278", // Credenciales válidas
      password: "Cc115689*", // Credenciales válidas
    };

    try {
      const response = await axios.post(API_URL, credentials);

      // Verificar que la respuesta tenga el estado 200
      expect(response.status).toBe(200);

      // Verificar que la respuesta contenga el mensaje esperado
      expect(response.data).toHaveProperty("message");
      expect(response.data.message).toBe(
        "Se ha enviado el código OTP de iniciar sesión."
      );

      // Mostrar el mensaje en la consola
      console.log("Mensaje recibido:", response.data.message);
    } catch (error) {
      console.error(
        "Error en el login:",
        error.response?.data || error.message
      );
      throw error; // Fallar el test si ocurre un error
    }
  });
});
