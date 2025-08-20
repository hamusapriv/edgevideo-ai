import { getDefaultWallets, getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  createConfig,
  http,
  watchAccount,
  getAccount,
  disconnect,
  signMessage,
  reconnect,
  switchChain,
} from "@wagmi/core";
import { mainnet, polygon, arbitrum } from "viem/chains";
import { SiweMessage } from "siwe";

// RainbowKit configuration
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

// API Base URL - use production server for all environments
const API_BASE_URL = "https://fastapi.edgevideo.ai";

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

  // Test wallet endpoints availability
  async testWalletEndpoints() {
    const authToken = localStorage.getItem("authToken");
    const results = {
      authToken: authToken ? "Found" : "Not found",
      endpoints: {},
    };

    const endpointsToTest = [
      {
        name: "nonce",
        url: `${API_BASE_URL}/wallet/wallet/nonce`,
        method: "POST",
      },
      { name: "link", url: `${API_BASE_URL}/wallet/link`, method: "POST" },
      {
        name: "get_linked",
        url: `${API_BASE_URL}/wallet/get_linked`,
        method: "GET",
      },
    ];

    for (const endpoint of endpointsToTest) {
      try {
        const options = {
          method: endpoint.method,
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (authToken) {
          options.headers["Authorization"] = `Bearer ${authToken}`;
        }

        if (endpoint.method === "POST") {
          options.body = JSON.stringify({});
        }

        const response = await fetch(endpoint.url, options);

        results.endpoints[endpoint.name] = {
          status: response.status,
          statusText: response.statusText,
          available: response.status !== 404,
          url: endpoint.url,
        };

        if (response.ok) {
          try {
            const data = await response.json();
            results.endpoints[endpoint.name].sampleResponse = data;
          } catch (e) {
            const text = await response.text();
            results.endpoints[endpoint.name].sampleResponse = text;
          }
        } else {
          const errorText = await response.text();
          results.endpoints[endpoint.name].error = errorText;
        }
      } catch (error) {
        results.endpoints[endpoint.name] = {
          status: "NETWORK_ERROR",
          error: error.message,
          url: endpoint.url,
        };
      }
    }

    return results;
  }

  // Get nonce for SIWE
  async getNonce() {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("User must be authenticated to get nonce");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wallet/nonce`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get nonce: ${response.status} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Link wallet with SIWE signature
  async linkWallet(nonceId, message, signature, walletAddress) {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("User must be authenticated to link wallet");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wallet/link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nonceId,
          message,
          signature,
          walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Wallet linking failed: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Check linked wallet status
  async getLinkedWallet() {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      return { walletAddress: null };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wallet/get_linked`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get linked wallet: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get linked wallet:", error);
      return { walletAddress: null };
    }
  }

  // Complete SIWE wallet verification flow
  async verifyWalletOwnership() {
    const account = getAccount(wagmiConfig);
    if (!account.address) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    // Check if we're on Polygon (chainId 137)
    if (account.chainId !== polygon.id) {
      try {
        console.log("Switching to Polygon network...");
        await switchChain(wagmiConfig, { chainId: polygon.id });
      } catch (error) {
        throw new Error(
          "Please switch to Polygon network (chainId 137) to verify wallet ownership."
        );
      }
    }

    try {
      // Step 1: Get nonce from backend
      console.log("Getting nonce for SIWE verification...");
      const nonceData = await this.getNonce();

      // Step 2: Create SIWE message
      const siweMessage = new SiweMessage({
        domain: nonceData.domain,
        address: account.address,
        statement: nonceData.statement,
        uri: nonceData.uri,
        version: "1",
        chainId: nonceData.chainId,
        nonce: nonceData.nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: nonceData.expiresAt,
        resources: nonceData.resources,
      });

      // Step 3: Prepare message string
      const messageString = siweMessage.prepareMessage();
      console.log("SIWE message prepared:", messageString);

      // Step 4: Sign the message
      console.log("Requesting wallet signature...");
      const signature = await signMessage(wagmiConfig, {
        message: messageString,
        account: account.address,
      });

      // Step 5: Submit to backend for verification
      console.log("Submitting signature to backend...");
      const result = await this.linkWallet(
        nonceData.nonceId,
        messageString,
        signature,
        account.address
      );

      // Step 6: Update local state
      localStorage.setItem("walletLinked", "true");
      localStorage.setItem("linkedWalletAddress", account.address);

      this.notifyListeners("walletLinked", {
        address: account.address,
        result,
      });

      return {
        success: true,
        walletAddress: account.address,
        result,
      };
    } catch (error) {
      console.error("Wallet verification failed:", error);

      // Provide user-friendly error messages
      let userMessage = error.message;
      if (error.message.includes("User rejected")) {
        userMessage = "Wallet signature was cancelled. Please try again.";
      } else if (error.message.includes("Signature verification failed")) {
        userMessage = "Signature verification failed. Please try again.";
      } else if (error.message.includes("expired")) {
        userMessage = "Verification expired. Please try again.";
      } else if (error.message.includes("Invalid chain")) {
        userMessage = "Please switch to Polygon network and try again.";
      }

      throw new Error(userMessage);
    }
  }

  // Check if wallet is linked and verified
  async isWalletLinked() {
    try {
      const linkedWallet = await this.getLinkedWallet();
      const account = getAccount(wagmiConfig);

      return {
        isLinked: !!linkedWallet.walletAddress,
        linkedAddress: linkedWallet.walletAddress,
        currentAddress: account.address,
        isCurrentWalletLinked: linkedWallet.walletAddress === account.address,
        blockReason: linkedWallet.blockReason || null,
      };
    } catch (error) {
      console.error("Failed to check wallet link status:", error);
      return {
        isLinked: false,
        linkedAddress: null,
        currentAddress: getAccount(wagmiConfig).address,
        isCurrentWalletLinked: false,
        blockReason: null,
      };
    }
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

// Make available for testing in development
if (typeof window !== "undefined") {
  window.rainbowKitWalletService = rainbowKitWalletService;
}

export default rainbowKitWalletService;
