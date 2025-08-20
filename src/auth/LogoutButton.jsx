// src/auth/LogoutButton.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();

  function handleClick() {
    // Get current page to determine where to redirect after logout
    const currentPath = window.location.pathname;

    // Determine redirect path based on current location
    let redirectPath = "/app"; // default fallback

    if (currentPath === "/" || currentPath === "/home") {
      redirectPath = "/home";
    } else if (currentPath.startsWith("/app")) {
      redirectPath = "/app";
    } else {
      // For other pages (channels, brands, etc.), stay on the same page
      // These pages should work fine without authentication
      redirectPath = currentPath;
    }

    console.log("Logout from:", currentPath, "redirecting to:", redirectPath);

    logout();
    window.location.assign(redirectPath);
  }

  return (
    <button onClick={handleClick} className="logout-btn ">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon icon-logout"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Door/frame */}
        <path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9" />
        {/* Exit arrow */}
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span style={{ marginLeft: "8px" }}>Log Out</span>
    </button>
  );
}
