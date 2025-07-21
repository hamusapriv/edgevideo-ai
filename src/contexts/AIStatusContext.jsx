// src/contexts/AIStatusContext.jsx
import React, { createContext, useContext, useState } from "react";

const AIStatusContext = createContext({
  shoppingAIStatus: "Searching for products...",
  setShoppingAIStatus: () => {},
});

export function AIStatusProvider({ children }) {
  const [shoppingAIStatus, setShoppingAIStatus] = useState(
    "Searching for products..."
  );

  return (
    <AIStatusContext.Provider value={{ shoppingAIStatus, setShoppingAIStatus }}>
      {children}
    </AIStatusContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAIStatus = () => useContext(AIStatusContext);
