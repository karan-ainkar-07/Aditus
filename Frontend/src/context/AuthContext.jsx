import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // session = { user, globalRoles, memberships } | null
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const data = await api.get("/auth/me");
      setSession(data);
      return data;
    } catch {
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const onExpired = () => setSession(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = useCallback(
    async (phone, password) => {
      await api.post("/auth/login", { phone, password });
      return loadSession();
    },
    [loadSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setSession(null);
    }
  }, []);

  const value = useMemo(
    () => ({ session, loading, login, logout, refreshSession: loadSession }),
    [session, loading, login, logout, loadSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};