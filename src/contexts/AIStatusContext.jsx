// src/contexts/AIStatusContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AIStatusContext = createContext({
  shoppingAIStatus: "Searching for products...",
  setShoppingAIStatus: () => {},
});

export function AIStatusProvider({ children }) {
  const [shoppingAIStatus, setShoppingAIStatus] = useState(
    "Searching for products..."
  );

  // CONSOLIDATED: Listen for legacy AI status events to unify state management
  useEffect(() => {
    const handleAIStatusUpdate = (event) => {
      setShoppingAIStatus(event.detail.status);
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
