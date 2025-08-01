// src/contexts/MarketingThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const MarketingThemeContext = createContext();

export const useMarketingTheme = () => {
  const context = useContext(MarketingThemeContext);
  if (!context) {
    throw new Error(
      "useMarketingTheme must be used within a MarketingThemeProvider"
    );
  }
  return context;
};

export const MarketingThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("marketing-theme");
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

    return "light";
  });

  const location = useLocation();

  // Only apply theme to marketing pages
  const isMarketingPage = [
    "/home",
    "/channels",
    "/brands",
    "/viewers",
  ].some((route) => location.pathname.startsWith(route));

  useEffect(() => {
    localStorage.setItem("marketing-theme", theme);

    // Only apply theme attribute if on marketing page
    if (isMarketingPage) {
      document.documentElement.setAttribute("data-marketing-theme", theme);
    } else {
      // Remove marketing theme attribute when not on marketing pages
      document.documentElement.removeAttribute("data-marketing-theme");
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
    isMarketingPage, // Expose this so components can conditionally render
  };

  return (
    <MarketingThemeContext.Provider value={value}>
      {children}
    </MarketingThemeContext.Provider>
  );
};
