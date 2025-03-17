// Usa import en lugar de require
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", // Ajusta según tu configuración
    setupNodeEvents(on, config) {
      // Configuración de eventos si es necesario
    },
  },
});
