// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Pull in our env vars
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI; // e.g. http://localhost:5173/oauth2callback
  const USERINFO_URL = import.meta.env.VITE_USERINFO_URL; // e.g. https://fastapi.edgevideo.ai/auth_google/details

  // Fetch user profile from our backend
  async function fetchUser(token) {
    try {
      const res = await fetch(USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setUser({
        name: data.name || data.email,
        email: data.email,
        avatarSeed: encodeURIComponent(data.name || data.email),
      });
    } catch (err) {
      console.error("Auth fetch failed:", err);
      logout();
    }
  }

  // Called when GSI returns a credential
  function handleCredentialResponse(response) {
    const token = response.credential;
    localStorage.setItem("authToken", token);
    fetchUser(token);
    // Clean up the URL if GSI used redirect
    window.history.replaceState({}, "", window.location.pathname);
  }

  // Initialize GSI and check for existing token/credential
  useEffect(() => {
    // 1) Initialize the GSI client
    if (window.google && CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        ux_mode: "redirect",
        redirect_uri: REDIRECT_URI,
      });
    }

    // 2) Check URL for GSI redirect credential
    const params = new URLSearchParams(window.location.search);
    const credential = params.get("credential");
    const stored = localStorage.getItem("authToken");

    if (credential) {
      // GSI redirect just happened
      handleCredentialResponse({ credential });
    } else if (stored) {
      // Already have token from a previous session
      fetchUser(stored);
    }
  }, [CLIENT_ID, REDIRECT_URI, USERINFO_URL]);

  // Trigger the GSI prompt (popup or redirect)
  function login() {
    window.location.href =
      `${import.meta.env.VITE_AUTH_BASE_URL}/google` +
      `?redirectUri=${encodeURIComponent(import.meta.env.VITE_REDIRECT_URI)}`;
  }

  // Clear the session
  function logout() {
    localStorage.removeItem("authToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for easy access in components
export function useAuth() {
  return useContext(AuthContext);
}
