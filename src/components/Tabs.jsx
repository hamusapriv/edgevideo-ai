// src/components/Tabs.jsx
import React from "react";

export default function Tabs({
  tabs,
  activeTab,
  onChangeTab,
  onToggleSidebar,
}) {
  return (
    <footer className="footer">
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
              src="https://api.dicebear.com/9.x/bottts/svg?seed=guest"
              alt="User avatar"
              className="avatar"
            />
          </div>
        </button>
      </nav>
    </footer>
  );
}
