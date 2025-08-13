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

  // Update wallet state when wagmi account changes
  useEffect(() => {
    if (isConnected && address) {
      const isVerified = getVerificationStatus(address);

      setWallet({
        isConnected: true,
        address: address,
        isVerified: isVerified,
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
      console.log("🔄 Wallet connection initiated through RainbowKit");
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
      console.log("🔄 Auth still loading, skipping wallet login/logout logic");
      return;
    }

    if (!user && wallet.isConnected) {
      console.log("🚪 User logged out - disconnecting wallet");
      disconnectWallet();
    }
  }, [user, wallet.isConnected, disconnectWallet, isAuthLoading]);

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
