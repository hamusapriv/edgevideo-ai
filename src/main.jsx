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
import "./styles/FAQ.css";
import "./styles/liveShoppingDesktop.css";
import "./styles/liveShoppingTablet.css";
import "./styles/scrollBar.css";
import "./styles/HomePage.css";

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
