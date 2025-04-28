import { defineConfig } from "cypress";
import { getOTPFromEmail } from "./cypress/support/emailHelper.js";
import { createRequire } from "module";
import webpackPreprocessor from "@cypress/webpack-preprocessor";
import mochawesome from "cypress-mochawesome-reporter/plugin.js";

const require = createRequire(import.meta.url);

export default defineConfig({
  projectId: "3ehbk9",
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    setupNodeEvents(on, config) {
      // 👇 Tus tasks personalizados (además del getOTP que ya tienes)
      on("task", {
        getOTP: async () => {
          return await getOTPFromEmail(config.env);
        },
        logSuccess(message) {
          console.log(`✅ OK: ${message}`);
          return null;
        },
        logError(message) {
          console.error(`❌ ERROR: ${message}`);
          return null;
        },
      });

      // 👇 Tu preprocesador de Webpack
      const options = {
        webpackOptions: require("./webpack.config.cjs"),
        watchOptions: {},
      };
      on("file:preprocessor", webpackPreprocessor(options));

      // 👇 Tu reporter Mochawesome
      mochawesome(on);

      return config;
    },
  },
  // 👇 Configuración del reporter
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "cypress/reports",
    overwrite: false,
    html: true,
    json: true,
  },
});
