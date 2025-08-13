// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const AuthContext = createContext({
  user: null,
  isAuthLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Pull in our env vars
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Use dynamic redirect URI based on current domain
  const REDIRECT_URI = `${window.location.origin}/app/oauth2callback`;

  // For localhost, we might need to use a different approach
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const USERINFO_URL = import.meta.env.VITE_USERINFO_URL; // e.g. https://fastapi.edgevideo.ai/auth_google/details

  // Fetch user profile from our backend
  const fetchUser = useCallback(
    async (token) => {
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
      } finally {
        setIsAuthLoading(false);
      }
    },
    [USERINFO_URL]
  );

  // Called when GSI returns a credential
  const handleCredentialResponse = useCallback(
    (response) => {
      const token = response.credential;
      localStorage.setItem("authToken", token);
      fetchUser(token);
      // Clean up the URL if GSI used redirect
      window.history.replaceState({}, "", window.location.pathname);
    },
    [fetchUser]
  );

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
    } else {
      // No stored token - not logged in
      setIsAuthLoading(false);
    }

    // CONSOLIDATED: Listen for legacy auth events to unify state management
    const handleLegacyLogin = (event) => {
      const { user, token } = event.detail;
      localStorage.setItem("authToken", token);
      setUser({
        name: user.displayName || user.name || user.email,
        email: user.email,
        avatarSeed: encodeURIComponent(
          user.displayName || user.name || user.email
        ),
      });
    };

    const handleLegacyLogout = () => {
      logout();
    };

    window.addEventListener("auth-user-login", handleLegacyLogin);
    window.addEventListener("auth-user-logout", handleLegacyLogout);

    return () => {
      window.removeEventListener("auth-user-login", handleLegacyLogin);
      window.removeEventListener("auth-user-logout", handleLegacyLogout);
    };
  }, [CLIENT_ID, REDIRECT_URI, fetchUser, handleCredentialResponse]);

  // Trigger the GSI prompt (popup or redirect)
  function login() {
    console.log("Login attempt:");
    console.log("AUTH_BASE_URL:", import.meta.env.VITE_AUTH_BASE_URL);
    console.log("REDIRECT_URI:", REDIRECT_URI);
    console.log("Current origin:", window.location.origin);
    console.log("Is localhost:", isLocalhost);

    // Store the current page to redirect back to after login
    const currentPath = window.location.pathname;
    localStorage.setItem("authRedirectPath", currentPath);
    console.log("Stored redirect path:", currentPath);
    console.log("Login initiated from:", currentPath);

    // Always use the current domain's redirect URI
    // The backend needs to be configured to accept localhost redirects
    const finalRedirectUri = REDIRECT_URI;

    const loginUrl =
      `${import.meta.env.VITE_AUTH_BASE_URL}/google` +
      `?redirectUri=${encodeURIComponent(finalRedirectUri)}`;

    console.log("Final redirect URI:", finalRedirectUri);
    console.log("Final login URL:", loginUrl);

    window.location.href = loginUrl;
  }

  // Clear the session
  function logout() {
    localStorage.removeItem("authToken");
    setUser(null);
    setIsAuthLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthLoading, login, logout, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for easy access in components
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
