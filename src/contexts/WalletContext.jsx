// src/contexts/WalletContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAccount, useDisconnect } from "wagmi";
import rainbowKitWalletService from "../services/rainbowKitWalletService";
import { useAuth } from "./AuthContext";

const WalletContext = createContext({
  wallet: {
    isConnected: false,
    address: null,
    isVerified: false,
    hasMetaMask: true,
    shortAddress: "",
  },
  connectWallet: () => {},
  verifyWallet: () => {},
  disconnectWallet: () => {},
  loading: false,
  error: null,
});

export function WalletProvider({ children }) {
  const { user, isAuthLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [wallet, setWallet] = useState({
    isConnected: false,
    address: null,
    isVerified: false,
    hasMetaMask: true,
    shortAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format short address
  const formatShortAddress = useCallback((addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Get verification status from localStorage
  const getVerificationStatus = useCallback((address) => {
    if (!address) return false;
    const verificationData = localStorage.getItem("walletVerification");
    if (verificationData) {
      try {
        const parsed = JSON.parse(verificationData);
        return parsed.isVerified || false;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Check wallet linking status from server
  const checkWalletLinkingStatus = useCallback(
    async (address) => {
      if (!user || !address) return false;

      try {
        const linkStatus = await rainbowKitWalletService.isWalletLinked();
        return linkStatus.isCurrentWalletLinked;
      } catch (error) {
        console.error("Failed to check wallet linking status:", error);
        return false;
      }
    },
    [user]
  );

  // Update wallet state when wagmi account changes
  useEffect(() => {
    if (isConnected && address) {
      const localVerificationStatus = getVerificationStatus(address);

      setWallet({
        isConnected: true,
        address: address,
        isVerified: localVerificationStatus,
        hasMetaMask: true,
        shortAddress: formatShortAddress(address),
      });

      // Sync with service
      if (rainbowKitWalletService.account !== address) {
        rainbowKitWalletService.account = address;
        rainbowKitWalletService.isConnected = true;
        rainbowKitWalletService.chainId = null; // Will be set by service
        rainbowKitWalletService.storeWalletConnection();
      }
    } else {
      setWallet({
        isConnected: false,
        address: null,
        isVerified: false,
        hasMetaMask: true,
        shortAddress: "",
      });

      // Sync with service
      rainbowKitWalletService.account = null;
      rainbowKitWalletService.isConnected = false;
      rainbowKitWalletService.isVerified = false;
    }
  }, [isConnected, address, formatShortAddress, getVerificationStatus]);

  // Check server-side wallet linking status when user and wallet are both ready
  useEffect(() => {
    const checkServerWalletStatus = async () => {
      if (user && wallet.isConnected && wallet.address && !isAuthLoading) {
        try {
          console.log("Checking wallet linking status from server...");
          const isLinked = await checkWalletLinkingStatus(wallet.address);

          if (isLinked && !wallet.isVerified) {
            console.log("✅ Wallet is linked on server, updating local state");
            setWallet((prev) => ({
              ...prev,
              isVerified: true,
            }));

            // Update localStorage to sync with server state
            localStorage.setItem(
              "walletVerification",
              JSON.stringify({
                isVerified: true,
                address: wallet.address,
                timestamp: Date.now(),
              })
            );
          } else if (!isLinked && wallet.isVerified) {
            console.log("❌ Wallet not linked on server, clearing local state");
            setWallet((prev) => ({
              ...prev,
              isVerified: false,
            }));

            // Clear localStorage as it's out of sync with server
            localStorage.removeItem("walletVerification");
          }
        } catch (error) {
          console.error("Failed to check server wallet status:", error);
        }
      }
    };

    checkServerWalletStatus();
  }, [
    user,
    wallet.isConnected,
    wallet.address,
    wallet.isVerified,
    isAuthLoading,
    checkWalletLinkingStatus,
  ]);

  // Listen for authentication events to trigger immediate wallet status check
  useEffect(() => {
    const handleUserAuthenticated = async () => {
      if (wallet.isConnected && wallet.address) {
        console.log("User authenticated, checking wallet linking status...");
        try {
          const isLinked = await checkWalletLinkingStatus(wallet.address);

          if (isLinked !== wallet.isVerified) {
            setWallet((prev) => ({
              ...prev,
              isVerified: isLinked,
            }));

            if (isLinked) {
              localStorage.setItem(
                "walletVerification",
                JSON.stringify({
                  isVerified: true,
                  address: wallet.address,
                  timestamp: Date.now(),
                })
              );
            } else {
              localStorage.removeItem("walletVerification");
            }
          }
        } catch (error) {
          console.error(
            "Failed to check wallet status after authentication:",
            error
          );
        }
      }
    };

    window.addEventListener("auth-user-authenticated", handleUserAuthenticated);

    return () => {
      window.removeEventListener(
        "auth-user-authenticated",
        handleUserAuthenticated
      );
    };
  }, [
    wallet.isConnected,
    wallet.address,
    wallet.isVerified,
    checkWalletLinkingStatus,
  ]);

  // Connect wallet function - RainbowKit handles the modal
  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated first
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please sign in with OAuth first");
      }

      // Connection is handled by RainbowKit ConnectButton
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify wallet
  const verifyWallet = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error("No wallet connected");
    }

    try {
      setLoading(true);
      setError(null);

      const result = await rainbowKitWalletService.verifyWallet();

      if (result.verified) {
        setWallet((prev) => ({
          ...prev,
          isVerified: true,
        }));
      }

      return result;
    } catch (err) {
      console.error("Wallet verification error:", err);
      setError(err.message || "Failed to verify wallet");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet.isConnected, wallet.address]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use wagmi disconnect
      await disconnect();

      // Clear stored data
      rainbowKitWalletService.clearWalletData();
    } catch (err) {
      console.error("Wallet disconnect error:", err);
      setError(err.message || "Failed to disconnect wallet");
    } finally {
      setLoading(false);
    }
  }, [disconnect]);

  // Handle user login/logout
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user && wallet.isConnected) {
      disconnectWallet();
    }
  }, [user, wallet.isConnected, disconnectWallet, isAuthLoading]);

  // Listen for logout events to clear wallet verification state
  useEffect(() => {
    const handleUserLogout = () => {
      console.log("User logged out, clearing wallet verification state");
      setWallet((prev) => ({
        ...prev,
        isVerified: false,
      }));
      localStorage.removeItem("walletVerification");
    };

    window.addEventListener("auth-user-logout", handleUserLogout);

    return () => {
      window.removeEventListener("auth-user-logout", handleUserLogout);
    };
  }, []);

  const value = {
    wallet,
    connectWallet,
    verifyWallet,
    disconnectWallet,
    loading,
    error,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
