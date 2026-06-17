import axios from "axios";

const productionApiBaseUrl = "https://actionscribe.onrender.com/api";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? productionApiBaseUrl : "http://localhost:5000/api")
});

API.interceptors.request.use((req) => {

  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;