import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

// ─── Request interceptor ───────────────────────────────────────
// Attaches the JWT from localStorage to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("campusflow_token");

  if (token && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Response interceptor ─────────────────────────────────────
// 401 — Token expired or invalid: clear storage and redirect to login.
// 403 — Authenticated but not authorised: redirect to login so the
//        user can switch accounts. A state flag is passed so the login
//        page can optionally show "Access denied" feedback.
// Network error — Backend unreachable: reject with a clear message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("campusflow_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (status === 403) {
      // Do NOT clear the token — the user is authenticated but lacks
      // the required role. Redirect to login so they can switch accounts.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?reason=access_denied";
      }
    } else if (!error.response) {
      // Network error — backend unreachable
      console.error(
        "[CampusFlow] Network error: Cannot reach the backend API. " +
        "Ensure the backend server is running and VITE_API_URL is correct."
      );
    }

    return Promise.reject(error);
  }
);

export default api;