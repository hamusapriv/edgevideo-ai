// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from "./contexts/WalletContext";
import { PointsProvider } from "./contexts/PointsContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { ProductsProvider } from "./contexts/ProductsContext";
import { AIStatusProvider } from "./contexts/AIStatusContext";
import { wagmiConfig } from "./services/rainbowKitWalletService";

// Import RainbowKit styles
import "@rainbow-me/rainbowkit/styles.css";
// Fix RainbowKit layout issues
import "./styles/rainbowkit-fix.css";

// Create a QueryClient instance for React Query
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#007bff",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
          modalSize="compact"
        >
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
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </>
);
