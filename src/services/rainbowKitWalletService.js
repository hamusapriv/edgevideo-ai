import { getDefaultWallets, getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  createConfig,
  http,
  watchAccount,
  getAccount,
  disconnect,
  signMessage,
  reconnect,
} from "@wagmi/core";
import { mainnet, polygon, arbitrum } from "viem/chains";

// RainbowKit configuration
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

// Get default wallets
const { wallets } = getDefaultWallets({
  appName: "EdgeVideo AI",
  projectId,
});

// Create wagmi config
export const wagmiConfig = getDefaultConfig({
  appName: "EdgeVideo AI",
  projectId: projectId,
  wallets: wallets,
  chains: [mainnet, polygon, arbitrum],
  ssr: false,
});

// Reconnect on init
if (typeof window !== "undefined") {
  reconnect(wagmiConfig);
}

class RainbowKitWalletService {
  constructor() {
    this.listeners = new Map();
    this.setupWatchers();
  }

  setupWatchers() {
    // Watch for account changes
    watchAccount(wagmiConfig, {
      onChange: (account) => {
        if (account.address) {
          this.handleAccountChange([account.address]);
        } else {
          this.handleDisconnect();
        }
      },
    });
  }

  // Get current connection status
  getStatus() {
    const account = getAccount(wagmiConfig);
    const isConnected = !!account.address;
    const address = account.address || null;
    const chainId = account.chainId || null;

    return {
      isConnected,
      account: address,
      chainId: chainId ? `0x${chainId.toString(16)}` : null,
      hasMetaMask: true, // RainbowKit handles all wallets
      isVerified: this.getVerificationStatus(address),
      verificationStatus: "unverified",
    };
  }

  // Check if MetaMask is available (RainbowKit handles this)
  async detectMetaMask() {
    return {
      hasMetaMask: true, // RainbowKit provides wallet detection
      isConnected: !!getAccount(wagmiConfig).address,
    };
  }

  // Connect wallet - RainbowKit modal will handle this
  async connect() {
    // RainbowKit ConnectButton handles the connection
    // This method is called after connection is successful
    const account = getAccount(wagmiConfig);
    if (account.address) {
      const chainId = account.chainId
        ? `0x${account.chainId.toString(16)}`
        : null;
      localStorage.setItem("walletAddress", account.address);
      localStorage.setItem("walletChainId", chainId);
      localStorage.setItem("walletConnected", "true");

      this.notifyListeners("connect", {
        account: account.address,
        chainId,
      });

      return account.address;
    }
    throw new Error("No account connected");
  }

  // Store wallet connection
  storeWalletConnection() {
    const account = getAccount(wagmiConfig);
    if (account.address) {
      localStorage.setItem("walletAddress", account.address);
      localStorage.setItem("walletConnected", "true");
      const chainId = account.chainId
        ? `0x${account.chainId.toString(16)}`
        : null;
      localStorage.setItem("walletChainId", chainId || "");
    }
  }

  // Disconnect wallet
  async disconnect() {
    await disconnect(wagmiConfig);
    this.clearWalletData();
    this.notifyListeners("disconnect");
  }

  // Verify wallet (sign message)
  async verifyWallet() {
    const account = getAccount(wagmiConfig);
    if (!account.address) {
      throw new Error("No wallet connected");
    }

    const message = `Verify wallet ownership for EdgeVideo AI\nAddress: ${
      account.address
    }\nTimestamp: ${new Date().toISOString()}`;

    try {
      const signature = await signMessage(wagmiConfig, {
        message,
        account: account.address,
      });

      // Store verification
      localStorage.setItem("walletVerified", "true");
      localStorage.setItem("walletVerificationSig", signature);

      this.notifyListeners("verified", {
        address: account.address,
        signature,
      });

      return { verified: true, signature };
    } catch (error) {
      console.error("Wallet verification failed:", error);
      throw error;
    }
  }

  // Get verification status
  getVerificationStatus(address) {
    if (!address) return false;
    const storedAddress = localStorage.getItem("walletAddress");
    const isVerified = localStorage.getItem("walletVerified") === "true";
    return storedAddress === address && isVerified;
  }

  // Restore wallet state
  async restoreWalletState() {
    const account = getAccount(wagmiConfig);
    if (account.address) {
      return {
        success: true,
        account: account.address,
        isConnected: true,
        isVerified: this.getVerificationStatus(account.address),
      };
    }

    const storedAddress = localStorage.getItem("walletAddress");
    const wasConnected = localStorage.getItem("walletConnected") === "true";

    if (!storedAddress || !wasConnected) {
      return { success: false };
    }

    // RainbowKit will handle auto-reconnection
    return { success: false };
  }

  // Clear stored data
  clearWalletData() {
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("walletChainId");
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletVerified");
    localStorage.removeItem("walletVerificationSig");
  }

  // Event handling
  handleAccountChange(accounts) {
    if (accounts.length === 0) {
      this.handleDisconnect();
    } else {
      this.notifyListeners("accountsChanged", accounts);
    }
  }

  handleDisconnect() {
    this.clearWalletData();
    this.notifyListeners("disconnect");
  }

  handleChainChange(chainId) {
    localStorage.setItem("walletChainId", chainId);
    this.notifyListeners("chainChanged", chainId);
  }

  // Listener management
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Export singleton instance
const rainbowKitWalletService = new RainbowKitWalletService();
export default rainbowKitWalletService;
