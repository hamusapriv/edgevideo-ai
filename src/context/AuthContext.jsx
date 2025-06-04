// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Constants (same as your auth.js)
const BACKEND_BASE_URL = "https://fastapi.edgevideo.ai";
const AUTH_ROUTE_BASE = `${BACKEND_BASE_URL}/auth_google`;
const USER_INFO_URL = `${AUTH_ROUTE_BASE}/details`;
const FRONTEND_URL = window.location.origin + window.location.pathname;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: fetch user details from backend
async function fetchUserDetails(token) {
  try {
    const res = await fetch(USER_INFO_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem("authToken");
      throw new Error("Session invalid. Please log in again.");
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch user details (Status: ${res.status})`);
    }

    const data = await res.json();
    const displayName = data.name || data.email || "User";
    return { ...data, displayName };
  } catch (err) {
    console.error("Error fetching user details:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Context
const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Read “token” from URL or localStorage, then fetch user info
  useEffect(() => {
    // 1. Check if URL has “?token=…”
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    const storedToken = localStorage.getItem("authToken");

    if (tokenFromUrl) {
      localStorage.setItem("authToken", tokenFromUrl);
      setToken(tokenFromUrl);
      // Remove “?token=…” from URL without reloading
      navigate(location.pathname, { replace: true });
    } else if (storedToken) {
      setToken(storedToken);
    }
  }, [location.search, location.pathname, navigate]);

  // 2. Whenever `token` changes (and is not null), fetch user details
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let isMounted = true;
    (async () => {
      const userDetails = await fetchUserDetails(token);
      if (isMounted) {
        if (userDetails) setUser(userDetails);
        else {
          localStorage.removeItem("authToken");
          setToken(null);
          setUser(null);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // ───────────────────────────────────────────────────────────────────────────
  // login(): redirect to backend’s Google OAuth endpoint
  function login() {
    const googleLoginUrl = `${AUTH_ROUTE_BASE}/google?redirectUri=${encodeURIComponent(
      FRONTEND_URL
    )}`;
    window.location.href = googleLoginUrl;
  }

  // logout(): clear token + user
  function logout() {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook to consume AuthContext
export function useAuth() {
  return useContext(AuthContext);
}
