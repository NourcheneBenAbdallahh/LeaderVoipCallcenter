import axios from "axios";

const api = axios.create({ baseURL: "/" });

export function getStoredToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}
export function getStoredRegion() {
  return (
    localStorage.getItem("region") ||
    sessionStorage.getItem("region") ||
    ""
  );
}

// Attache systématiquement Authorization + X-Region
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  const region = getStoredRegion();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  if (region) {
    config.headers["X-Region"] = region.toLowerCase?.() || region;
  } else {
    delete config.headers["X-Region"];
  }
  return config;
});

// Utilitaires pour mettre à jour immédiatement les headers par défaut
export function setAuthToken(token, { persist = "session" } = {}) {
  if (persist === "local") {
    if (token) localStorage.setItem("token", token);
    sessionStorage.removeItem("token");
  } else {
    // par défaut : session
    if (token) sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
  }
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function clearAuthToken() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  delete api.defaults.headers.common.Authorization;
}

export function setRegion(region, { persist = "session" } = {}) {
  if (persist === "local") {
    if (region) localStorage.setItem("region", region);
    sessionStorage.removeItem("region");
  } else {
    if (region) sessionStorage.setItem("region", region);
    localStorage.removeItem("region");
  }
  if (region) {
    api.defaults.headers.common["X-Region"] = region.toLowerCase?.() || region;
  } else {
    delete api.defaults.headers.common["X-Region"];
  }
}

export default api;
