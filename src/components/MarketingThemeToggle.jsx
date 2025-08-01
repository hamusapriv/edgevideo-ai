// src/components/MarketingThemeToggle.jsx
import React from "react";
import { useMarketingTheme } from "../contexts/MarketingThemeContext";

const MarketingThemeToggle = () => {
  const { theme, toggleTheme, isMarketingPage } = useMarketingTheme();

  // Only render on marketing pages
  if (!isMarketingPage) {
    return null;
  }

  return (
    <button
      className="marketing-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        // Sun icon for light mode
        <div
          style={{ display: "flex", alignItems: "center", paddingLeft: "10px" }}
        >
          <p>Light</p>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34M12 6A6 6 0 1 0 12 18A6 6 0 0 0 12 6Z" />
          </svg>
        </div>
      ) : (
        // Moon icon for dark mode
        <div
          style={{ display: "flex", alignItems: "center", paddingLeft: "10px" }}
        >
          <p>Dark</p>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default MarketingThemeToggle;
