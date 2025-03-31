import { defineConfig } from "cypress";
import { getOTPFromEmail } from "./cypress/support/emailHelper.js";
import { createRequire } from "module";
import webpackPreprocessor from "@cypress/webpack-preprocessor";
import mochawesome from "cypress-mochawesome-reporter/plugin";

const require = createRequire(import.meta.url);

export default defineConfig({
  projectId: "3ehbk9",
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    setupNodeEvents(on, config) {
      on("task", {
        getOTP: async () => {
          return await getOTPFromEmail(config.env);
        },
      });

      const options = {
        webpackOptions: require("./webpack.config.cjs"),
        watchOptions: {},
      };
      on("file:preprocessor", webpackPreprocessor(options));

      // ✅ Mochawesome reporter
      mochawesome(on);

      return config;
    },
  },
  // 👇 Reporter agregado
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "cypress/reports",
    overwrite: false,
    html: true,
    json: true,
  },
});
