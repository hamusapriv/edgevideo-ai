// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";



import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { SidebarProvider } from "./contexts/SidebarContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <SidebarProvider>
            <App />
          </SidebarProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </>
);
