global.importMetaEnv = {
  VITE_APP_API_URL: "http://localhost:3000",
};

Object.defineProperty(global, "import.meta", {
  value: { env: global.importMetaEnv },
});
