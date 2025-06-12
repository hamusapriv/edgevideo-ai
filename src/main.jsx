// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/style.css";
import "./styles/google.css";
import "./styles/favorites.css";

import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { FavoritesProvider } from "./favorites/FavoritesContext";
import { SidebarProvider } from "./ui/SidebarContext";

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
