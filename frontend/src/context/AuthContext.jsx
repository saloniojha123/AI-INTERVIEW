import { createContext, useContext, useEffect, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const STORAGE_KEY = "intervyou_auth";

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Wraps the app, keeps { user, token } in state, and mirrors it to
 * localStorage so a page refresh doesn't log the candidate out.
 * Also exposes authFetch(), a thin wrapper around fetch() that attaches
 * the Authorization header automatically — use this instead of raw fetch
 * for any call to a protected backend route.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const signup = useCallback(async ({ name, email, password }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  /**
   * authFetch — use for any call to a protected route (/api/interview/start,
   * /api/interview/history, etc). Automatically attaches the JWT.
   */
  const authFetch = useCallback(
    (path, options = {}) => {
      const headers = {
        ...(options.headers || {}),
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      };
      return fetch(`${API_BASE}${path}`, { ...options, headers });
    },
    [session]
  );

  const value = {
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: Boolean(session?.token),
    loading,
    signup,
    login,
    logout,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
