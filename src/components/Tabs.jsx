// src/components/Tabs.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Tabs({
  tabs,
  activeTab,
  onChangeTab,
  onToggleSidebar,
}) {
  const { user } = useAuth();
  const avatarSeed = user ? user.avatarSeed : "guest";
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${avatarSeed}`;
  return (
    <footer className="app-footer">
      {/* (j) AFFILIATE FOOTER */}

      <nav className="tabs">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`tab${activeTab === key ? " active" : ""}`}
            data-target={key}
            onClick={() => onChangeTab(key)}
            aria-label={`${key} tab`}
          >
            {label}
          </button>
        ))}

        {/* Sidebar‐toggle button inside the tabs row */}
        <button
          className="tab sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle profile sidebar"
        >
          <div className="avatar-wrapper small">
            <img
              loading="lazy"
              src={avatarUrl}
              alt={user ? `${user.name} avatar` : "Guest avatar"}
              className="avatar"
            />
          </div>
        </button>
      </nav>
    </footer>
  );
}
