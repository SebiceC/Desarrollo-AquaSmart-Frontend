module.exports = {
  // Configura el entorno de pruebas en Node.js
  testEnvironment: "node",

  // Archivos de configuración adicionales
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],

  // Transformaciones para archivos JS/JSX
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // Ignorar transformaciones en node_modules, excepto módulos específicos
  transformIgnorePatterns: ["node_modules/(?!(your-module-to-transform)/)"],

  // Mapeo de módulos para evitar errores con archivos de estilo
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  // Configuración de reportes
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "Reporte de Pruebas",
        outputPath: "./test-report.html",
        includeFailureMsg: true,
        includeConsoleLog: true,
      },
    ],
  ],
};
