// src/api.js
import axios from "axios";

const api = axios.create({ baseURL: "/" }); 

api.interceptors.request.use((config) => {
  const region = (localStorage.getItem("region") ).toLowerCase();
  console.log(region,"la region est ");
  config.headers["X-Region"] = region;

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
