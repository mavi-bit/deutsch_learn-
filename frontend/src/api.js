import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", timeout: 90000 });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token"); // auth token only; all learning data lives in the database
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !e.config.url.includes("/auth/login") && !e.config.url.includes("/auth/register")) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(e);
  }
);

export function errMsg(e) {
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x) => x.msg?.replace("Value error, ", "")).join(". ");
  if (typeof d === "string") return d;
  if (e?.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (!e?.response) return "Cannot reach the server. Is the backend running?";
  return "Something went wrong. Please try again.";
}

export default api;
