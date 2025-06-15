// src/auth/OAuthCallback.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth(); // expose a fetchUser helper

  useEffect(() => {
    // 1) pull the token out of URL
    const params = new URLSearchParams(window.location.search);
    const tok = params.get("token");
    if (tok) {
      localStorage.setItem("authToken", tok);
      // optional: cleanup the URL
      window.history.replaceState({}, "", "/app");
      // tell your context to load the profile now
      fetchUser(tok).finally(() => {
        navigate("/app", { replace: true });
      });
    } else {
      // no token? just send them back
      navigate("/app", { replace: true });
    }
  }, [fetchUser, navigate]);

  return <p style={{ padding: 20, color: "#fff" }}>Logging you in…</p>;
}
