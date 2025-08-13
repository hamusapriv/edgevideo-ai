// WalletConnect Service - Multi-wallet connection and verification
// Integrates with existing AuthContext OAuth implementation

import { appKit } from "../config/walletConfig";
import {
  getAccount,
  getChainId,
  disconnect as wagmiDisconnect,
} from "wagmi/actions";
import { wagmiAdapter } from "../config/walletConfig";

class WalletConnectService {
  constructor() {
    this.account = null;
    this.provider = null;
    this.chainId = null;
    this.isConnected = false;
    this.isVerified = false;
    this.verificationToken = null;
    this.listeners = [];
    this.walletInfo = null; // Store connected wallet info

    // Initialize wallet listeners
    this.initializeWalletListeners();
  }

  async initializeWalletListeners() {
    // Subscribe to account changes
    appKit.subscribeAccount((account) => {
      console.log("🔄 WalletConnect account changed:", account);

      if (account.isConnected && account.address) {
        this.handleAccountChange(account.address);
      } else {
        this.handleDisconnect();
      }
    });

    // Subscribe to chain changes
    appKit.subscribeChainId((chainId) => {
      console.log("🔗 Chain changed to:", chainId);
      this.chainId = chainId;
      this.notifyListeners();
    });

    // Subscribe to connection state
    appKit.subscribeState((state) => {
      console.log("🔌 WalletConnect state changed:", state);

      if (!state.open && this.isConnected) {
        // Modal closed while connected - this is normal
        return;
      }
    });
  }

  async connect() {
    try {
      // Check if user is authenticated with OAuth first
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please sign in with OAuth first");
      }

      console.log("🔄 Opening WalletConnect modal...");

      // Open the wallet selection modal
      await appKit.open();

      // Wait for connection to be established
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 60000); // 60 second timeout

        const unsubscribe = appKit.subscribeAccount((account) => {
          if (account.isConnected && account.address) {
            clearTimeout(timeout);
            unsubscribe();

            this.account = account.address;
            this.chainId = account.chainId;
            this.provider = wagmiAdapter;
            this.isConnected = true;
            this.isVerified = false; // Reset verification status

            // Store connection
            this.storeWalletConnection();

            console.log("✅ Wallet connected:", this.account);
            this.notifyListeners();

            resolve(this.account);
          } else if (account.status === "disconnected") {
            clearTimeout(timeout);
            unsubscribe();
            reject(new Error("Connection cancelled by user"));
          }
        });
      });
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      // Disconnect using wagmi
      await wagmiDisconnect(wagmiAdapter.wagmiConfig);

      this.account = null;
      this.provider = null;
      this.chainId = null;
      this.isConnected = false;
      this.isVerified = false;
      this.verificationToken = null;
      this.walletInfo = null;

      // Clear stored data
      this.clearWalletData();

      console.log("Wallet disconnected");
      this.notifyListeners();
    } catch (error) {
      console.error("Disconnect failed:", error);
      // Force local disconnect even if remote disconnect fails
      this.handleDisconnect();
    }
  }

  // Clear UI state only, preserve localStorage for restoration
  clearUIState() {
    this.account = null;
    this.provider = null;
    this.chainId = null;
    this.isConnected = false;
    this.isVerified = false;
    this.verificationToken = null;
    this.walletInfo = null;

    console.log("Wallet UI state cleared (localStorage preserved)");
    this.notifyListeners();
  }

  async verifyWallet() {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error("Wallet not connected");
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("User not authenticated");
      }

      // Step 1: Get nonce from backend
      const nonce = await this.getNonce();

      // Step 2: Create message to sign
      const message = this.createSignatureMessage(nonce);

      // Step 3: Request signature from user using WalletConnect
      const signature = await this.requestSignature(message);

      // Step 4: Verify signature with backend
      const verificationResult = await this.verifySignatureWithBackend(
        signature,
        message,
        this.account
      );

      if (verificationResult.success) {
        this.isVerified = true;
        this.verificationToken = verificationResult.token;

        // Store verification
        this.storeVerification();

        console.log("Wallet verified successfully");
        this.notifyListeners();

        return verificationResult;
      } else {
        throw new Error(verificationResult.message || "Verification failed");
      }
    } catch (error) {
      console.error("Wallet verification failed:", error);
      throw error;
    }
  }

  async requestSignature(message) {
    try {
      // Use wagmi to sign the message
      const { signMessage } = await import("wagmi/actions");

      const signature = await signMessage(wagmiAdapter.wagmiConfig, {
        message: message,
      });

      return signature;
    } catch (error) {
      console.error("Signature request failed:", error);
      throw new Error("Signature cancelled or failed");
    }
  }

  async getNonce() {
    const authToken = localStorage.getItem("authToken");
    const response = await fetch("/api/wallet/nonce", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get nonce");
    }

    const data = await response.json();
    return data.nonce;
  }

  createSignatureMessage(nonce) {
    return `Please sign this message to verify your wallet ownership.\n\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
  }

  async verifySignatureWithBackend(signature, message, address) {
    const authToken = localStorage.getItem("authToken");

    const response = await fetch("/api/wallet/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signature,
        message,
        address,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Verification failed");
    }

    return await response.json();
  }

  // Handle account changes (when user switches account in wallet)
  handleAccountChange(newAccount) {
    console.log("Account changed:", {
      from: this.account,
      to: newAccount,
    });

    this.account = newAccount;
    this.isVerified = false; // Reset verification for new account
    this.verificationToken = null;

    // Update stored connection
    this.storeWalletConnection();

    this.notifyListeners();
  }

  // Handle disconnection events
  async handleDisconnect() {
    // Check if there are still connected accounts
    try {
      const account = getAccount(wagmiAdapter.wagmiConfig);
      if (account.isConnected) {
        console.log("✅ Account still connected, ignoring disconnect event");
        return;
      }
    } catch (error) {
      console.log("📭 No accounts available - proceeding with disconnect");
    }

    this.account = null;
    this.provider = null;
    this.chainId = null;
    this.isConnected = false;
    this.isVerified = false;
    this.verificationToken = null;
    this.walletInfo = null;

    // Clear stored data
    this.clearWalletData();

    console.log("Wallet disconnected");
    this.notifyListeners();
  }

  // Storage methods
  storeWalletConnection() {
    const walletData = {
      account: this.account,
      chainId: this.chainId,
      isConnected: this.isConnected,
      connectedAt: Date.now(),
    };

    localStorage.setItem("walletConnection", JSON.stringify(walletData));
    console.log("Wallet connection stored");
  }

  storeVerification() {
    const verificationData = {
      isVerified: this.isVerified,
      verificationToken: this.verificationToken,
      verifiedAt: Date.now(),
    };

    localStorage.setItem(
      "walletVerification",
      JSON.stringify(verificationData)
    );
    console.log("Wallet verification stored");
  }

  clearWalletData() {
    localStorage.removeItem("walletConnection");
    localStorage.removeItem("walletVerification");
    console.log("Wallet data cleared");
  }

  // Restore wallet state from localStorage
  async restoreWalletState() {
    try {
      console.log("🔄 Attempting to restore wallet state...");

      // Check current connection state from wagmi
      const account = getAccount(wagmiAdapter.wagmiConfig);
      const chainId = getChainId(wagmiAdapter.wagmiConfig);

      if (account.isConnected && account.address) {
        console.log("✅ Found active wallet connection:", account.address);

        this.account = account.address;
        this.chainId = chainId;
        this.provider = wagmiAdapter;
        this.isConnected = true;

        // Try to restore verification status
        const verificationData = localStorage.getItem("walletVerification");
        if (verificationData) {
          const parsed = JSON.parse(verificationData);
          this.isVerified = parsed.isVerified || false;
          this.verificationToken = parsed.verificationToken || null;
        }

        this.notifyListeners();
        return true;
      } else {
        console.log("📭 No active wallet connection found");
        return false;
      }
    } catch (error) {
      console.error("Failed to restore wallet state:", error);
      return false;
    }
  }

  // Getter methods (maintaining compatibility with original interface)
  getAccount() {
    return this.account;
  }

  getChainId() {
    return this.chainId;
  }

  getProvider() {
    return this.provider;
  }

  getVerificationToken() {
    return this.verificationToken;
  }

  getConnectionState() {
    return {
      isConnected: this.isConnected,
      address: this.account,
      isVerified: this.isVerified,
      shortAddress: this.account ? this.formatAddress(this.account) : "",
    };
  }

  getWalletStatus() {
    return this.isConnected;
  }

  hasMetaMask() {
    // WalletConnect supports all wallets, so this is always true
    return true;
  }

  // Utility methods
  formatAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  getChainName(chainId = this.chainId) {
    const chains = {
      1: "Ethereum",
      137: "Polygon",
      42161: "Arbitrum",
    };
    return chains[parseInt(chainId)] || "Unknown";
  }

  // Listener management
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Listener callback error:", error);
      }
    });
  }
}

// Create singleton instance
const walletConnectService = new WalletConnectService();

export default walletConnectService;
