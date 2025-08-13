// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from "./contexts/WalletContext";
import { PointsProvider } from "./contexts/PointsContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { ProductsProvider } from "./contexts/ProductsContext";
import { AIStatusProvider } from "./contexts/AIStatusContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <PointsProvider>
            <FavoritesProvider>
              <SidebarProvider>
                <AIStatusProvider>
                  <ProductsProvider>
                    <App />
                  </ProductsProvider>
                </AIStatusProvider>
              </SidebarProvider>
            </FavoritesProvider>
          </PointsProvider>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </>
);
