import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });


global.importMetaEnv = {
    VITE_APP_API_URL: "http://localhost:5000", // Define tu API de prueba
  };
  