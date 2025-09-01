// src/contexts/AIStatusContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AIStatusContext = createContext({
  shoppingAIStatus: "Connecting...",
  setShoppingAIStatus: () => {},
});

export function AIStatusProvider({ children }) {
  const [shoppingAIStatus, setShoppingAIStatus] = useState("Connecting...");

  // CONSOLIDATED: Listen for legacy AI status events to unify state management
  useEffect(() => {
    const handleAIStatusUpdate = (event) => {
      const newStatus = event.detail.status;
      setShoppingAIStatus(newStatus);

      // Auto-transition from "Connected!" to "Searching for products..." after 2 seconds
      if (newStatus === "Connected!") {
        setTimeout(() => {
          setShoppingAIStatus("Searching for products...");
        }, 2000);
      }
    };

    window.addEventListener("ai-status-update", handleAIStatusUpdate);

    return () => {
      window.removeEventListener("ai-status-update", handleAIStatusUpdate);
    };
  }, []);

  return (
    <AIStatusContext.Provider value={{ shoppingAIStatus, setShoppingAIStatus }}>
      {children}
    </AIStatusContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAIStatus = () => useContext(AIStatusContext);
