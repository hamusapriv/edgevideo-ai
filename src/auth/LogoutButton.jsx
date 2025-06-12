// src/auth/LogoutButton.jsx
import React from "react";
import { useAuth } from "./AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button onClick={logout} className="logout-btn btn--secondary">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon icon-logout"
        width="20"
        height="20"
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
