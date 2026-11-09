import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

function applyTheme(t) {
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));

  useEffect(() => applyTheme(localStorage.getItem("theme") || "light"), []);

  const adopt = useCallback((u) => {
    setUser(u);
    localStorage.setItem("theme", u.settings.theme);
    applyTheme(u.settings.theme);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    api.get("/auth/me").then((r) => adopt(r.data)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
  }, [adopt]);

  useEffect(() => {
    const out = () => setUser(null);
    window.addEventListener("auth:logout", out);
    return () => window.removeEventListener("auth:logout", out);
  }, []);

  const authenticate = async (path, body) => {
    const r = await api.post(path, body);
    localStorage.setItem("token", r.data.access_token);
    adopt(r.data.user);
  };

  const value = {
    user, loading,
    login: (email, password) => authenticate("/auth/login", { email, password }),
    register: (email, name, password) => authenticate("/auth/register", { email, name, password }),
    logout: async () => {
      try { await api.post("/auth/logout"); } catch { /* token is discarded either way */ }
      localStorage.removeItem("token");
      setUser(null);
    },
    saveSettings: async (patch) => { const r = await api.put("/settings", patch); adopt(r.data); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
