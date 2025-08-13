// src/contexts/WalletContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import walletService from "../services/walletService";
import { useAuth } from "./AuthContext";

const WalletContext = createContext({
  wallet: {
    isConnected: false,
    address: null,
    isVerified: false,
    hasMetaMask: false,
    shortAddress: "",
  },
  connectWallet: () => {},
  verifyWallet: () => {},
  disconnectWallet: () => {},
  loading: false,
  error: null,
});

export function WalletProvider({ children }) {
  const { user, isAuthLoading } = useAuth(); // Get auth loading state
  const [wallet, setWallet] = useState({
    isConnected: false,
    address: null,
    isVerified: false,
    hasMetaMask: false, // Start with false and detect properly
    shortAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update wallet state from service
  const updateWalletState = useCallback(() => {
    const status = walletService.getConnectionState();
    const hasMetaMask = walletService.hasMetaMask();

    console.log("🔄 WalletContext: Updating wallet state:", {
      hasMetaMask,
      status,
      currentWalletState: wallet,
    });

    const newWalletState = {
      isConnected: status.isConnected || false,
      address: status.account || null,
      isVerified: status.isVerified || false,
      hasMetaMask: hasMetaMask,
      shortAddress: status.account
        ? `${status.account.slice(0, 6)}...${status.account.slice(-4)}`
        : "",
    };

    console.log("🆕 WalletContext: New wallet state:", newWalletState);

    setWallet(newWalletState);
  }, []);

  // Initial MetaMask detection with retry
  useEffect(() => {
    let detectionAttempts = 0;
    const maxAttempts = 10;

    const detectMetaMask = () => {
      const hasMetaMask = walletService.hasMetaMask();
      console.log(
        `MetaMask detection attempt ${detectionAttempts + 1}:`,
        hasMetaMask
      );

      if (hasMetaMask) {
        console.log("MetaMask detected, updating wallet state");
        updateWalletState();
        return true; // Stop retrying
      }

      detectionAttempts++;
      return false;
    };

    // Check immediately
    if (detectMetaMask()) return;

    // Aggressive retry schedule
    const intervals = [100, 500, 1000, 2000, 3000, 5000];
    const timeouts = [];

    intervals.forEach((delay, index) => {
      if (index < maxAttempts) {
        timeouts.push(
          setTimeout(() => {
            if (!detectMetaMask() && index < intervals.length - 1) {
              console.log(`MetaMask not detected after ${delay}ms, will retry`);
            }
          }, delay)
        );
      }
    });

    // Also listen for ethereum object becoming available
    const handleEthereumAvailable = () => {
      console.log("Ethereum provider initialized event detected");
      detectMetaMask();
    };

    window.addEventListener("ethereum#initialized", handleEthereumAvailable);

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      window.removeEventListener(
        "ethereum#initialized",
        handleEthereumAvailable
      );
    };
  }, [updateWalletState]); // Remove wallet.hasMetaMask dependency to prevent loops

  // Restore wallet state on app initialization
  useEffect(() => {
    const restoreWallet = async () => {
      try {
        console.log("🚀 WalletContext: Starting wallet restoration...");
        const restored = await walletService.restoreWalletState();
        if (restored) {
          console.log("✅ WalletContext: Wallet state restored successfully");
          updateWalletState();
        } else {
          console.log("ℹ️ WalletContext: No previous wallet state to restore");
        }
      } catch (error) {
        console.error(
          "💥 WalletContext: Failed to restore wallet state:",
          error
        );
      }
    };

    // Only attempt restoration if we have authentication
    const authToken = localStorage.getItem("authToken");
    console.log("🔑 WalletContext: Auth token present:", !!authToken);

    if (authToken) {
      // Add a small delay to ensure MetaMask is fully loaded
      setTimeout(restoreWallet, 100);
    }
  }, []); // Run only once on mount

  // Subscribe to wallet service changes
  useEffect(() => {
    updateWalletState();

    // Subscribe to wallet changes
    walletService.addListener(updateWalletState);

    return () => {
      walletService.removeListener(updateWalletState);
    };
  }, [updateWalletState]);

  // Handle user login/logout and wallet restoration
  useEffect(() => {
    // Don't act on auth state until initial loading is complete
    if (isAuthLoading) {
      console.log("🔄 Auth still loading, skipping wallet login/logout logic");
      return;
    }

    if (!user && wallet.isConnected) {
      // User logged out - clear wallet
      console.log("🚪 User logged out - disconnecting wallet");
      disconnectWallet();
    } else if (user && !wallet.isConnected) {
      // User logged in - try to restore wallet connection
      const restoreWallet = async () => {
        try {
          console.log(
            "🔑 User logged in - attempting to restore wallet connection"
          );
          const restored = await walletService.restoreWalletState();
          if (restored) {
            console.log("✅ Wallet state restored after user login");
            updateWalletState();
          } else {
            console.log("ℹ️ No wallet state to restore after user login");
          }
        } catch (error) {
          console.error(
            "💥 Failed to restore wallet state after login:",
            error
          );
        }
      };

      // Add a small delay to ensure everything is settled
      setTimeout(restoreWallet, 200);
    }
  }, [user, wallet.isConnected, isAuthLoading]);

  const connectWallet = useCallback(async () => {
    if (!user) {
      setError("Please sign in before connecting your wallet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await walletService.connect();
      updateWalletState();
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, updateWalletState]);

  const verifyWallet = useCallback(async () => {
    if (!user) {
      setError("Please sign in before verifying your wallet");
      return;
    }

    if (!wallet.isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await walletService.verifyWallet();
      updateWalletState();
    } catch (err) {
      console.error("Wallet verification failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, wallet.isConnected, updateWalletState]);

  const disconnectWallet = useCallback(async () => {
    try {
      await walletService.disconnect();
      updateWalletState();
      setError(null);
    } catch (err) {
      console.error("Wallet disconnect failed:", err);
      setError(err.message);
    }
  }, [updateWalletState]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        verifyWallet,
        disconnectWallet,
        loading,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
