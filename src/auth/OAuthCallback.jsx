// src/auth/OAuthCallback.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingOverlay from "../components/LoadingOverlay";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth(); // expose a fetchUser helper

  useEffect(() => {
    // 1) pull the token out of URL
    const params = new URLSearchParams(window.location.search);
    const tok = params.get("token");

    // Get the stored redirect path, default to /app if none
    const storedPath = localStorage.getItem("authRedirectPath");
    let redirectPath = storedPath || "/app";

    // Validate redirect path - ensure it's a safe internal path
    const validPaths = [
      "/",
      "/home",
      "/app",
      "/channels",
      "/brands",
      "/viewers",
      "/demo",
      "/privacy",
      "/terms",
    ];
    const isValidPath =
      validPaths.includes(redirectPath) ||
      redirectPath.startsWith("/app/") ||
      redirectPath.startsWith("/channels/") ||
      redirectPath.startsWith("/brands/");

    // Special handling for root path
    if (redirectPath === "/") {
      redirectPath = "/home";
    }

    if (!isValidPath) {
      console.warn(
        `Invalid redirect path: ${redirectPath}, defaulting to /app`
      );
      redirectPath = "/app";
    }

    if (tok) {
      localStorage.setItem("authToken", tok);
      // Clean up the stored redirect path
      localStorage.removeItem("authRedirectPath");
      // optional: cleanup the URL
      window.history.replaceState({}, "", redirectPath);
      // tell your context to load the profile now
      fetchUser(tok).finally(() => {
        navigate(redirectPath, { replace: true });
      });
    } else {
      // no token? just send them back to where they came from
      localStorage.removeItem("authRedirectPath");
      navigate(redirectPath, { replace: true });
    }
  }, [fetchUser, navigate]);

  return (
    <div style={{ padding: 20, color: "#fff" }}>
      <LoadingOverlay message="Signing In..." />
    </div>
  );
}
