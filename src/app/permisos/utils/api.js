import axios from "axios"

// Configuración de axios
export const setupAxios = () => {
  const token = localStorage.getItem("token")
  const API_URL = import.meta.env.VITE_APP_API_URL

  return {
    instance: axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Token ${token}` },
    }),
    API_URL,
  }
}

