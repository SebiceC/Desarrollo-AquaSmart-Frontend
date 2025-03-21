import { defineConfig } from "cypress";
import { getOTPFromEmail } from "./cypress/support/emailHelper.js";
import { createRequire } from "module";
import webpackPreprocessor from "@cypress/webpack-preprocessor";

const require = createRequire(import.meta.url);

export default defineConfig({
  projectId: "3ehbk9",
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    setupNodeEvents(on, config) {
      on("task", {
        getOTP: async () => {
          // Pasa el objeto de entorno de Cypress (config.env) a la función
          return await getOTPFromEmail(config.env);
        },
      });
      const options = {
        webpackOptions: require("./webpack.config.cjs"),
        watchOptions: {},
      };
      on("file:preprocessor", webpackPreprocessor(options));
      return config;
    },
  },
});
