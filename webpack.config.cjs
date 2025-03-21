const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  // Externalizamos los módulos que se usan solo en Node
  externals: {
    imap: "commonjs imap",
    mailparser: "commonjs mailparser",
    mailsplit: "commonjs mailsplit",
  },
  resolve: {
    fallback: {
      // Fallbacks para módulos sin y con prefijo "node:"
      buffer: require.resolve("buffer/"),
      "node:buffer": require.resolve("buffer/"),
      stream: require.resolve("stream-browserify"),
      "node:stream": require.resolve("stream-browserify"),
      util: require.resolve("util/"),
      crypto: require.resolve("crypto-browserify"),
      "node:crypto": require.resolve("crypto-browserify"),
      path: require.resolve("path-browserify"),
      "node:path": require.resolve("path-browserify"),
      // Estos módulos no existen en el navegador
      net: false,
      "node:net": false,
      tls: false,
      "node:tls": false,
      module: false,
      "node:module": false,
    },
  },
  plugins: [
    new NodePolyfillPlugin(), // Añade polyfills para módulos de Node
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          // Permite importar sin tener que especificar la extensión completa
          fullySpecified: false,
        },
      },
    ],
  },
};
