// src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light"; // Default to light mode
  });

  const location = useLocation();

  // Check if current route should have theming applied
  const isMarketingPage = [
    "/home",
    "/channels",
    "/brands",
    "/viewers",
    "/demo",
    "/privacy",
    "/terms",
    "/cookies",
  ].some((route) => location.pathname.startsWith(route));

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem("theme", theme);

    // Only apply theme to document root if we're on a marketing page
    if (isMarketingPage) {
      document.documentElement.setAttribute("data-theme", theme);
      document.body.className = document.body.className.replace(
        /theme-\w+/g,
        ""
      );
      document.body.classList.add(`theme-${theme}`);
    } else {
      // Remove theme attributes when not on marketing pages
      document.documentElement.removeAttribute("data-theme");
      document.body.className = document.body.className.replace(
        /theme-\w+/g,
        ""
      );
    }
  }, [theme, isMarketingPage]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
