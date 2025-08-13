// Wallet Service - EVM wallet connection and verification
// Integrates with existing AuthContext OAuth implementation

class WalletService {
  constructor() {
    this.account = null;
    this.provider = null;
    this.chainId = null;
    this.isConnected = false;
    this.isVerified = false;
    this.verificationToken = null;
    this.listeners = [];

    // Initialize wallet listeners
    this.initializeWalletListeners();
  }

  async initializeWalletListeners() {
    if (typeof window !== "undefined" && window.ethereum) {
      // Listen for account changes
      window.ethereum.on("accountsChanged", async (accounts) => {
        console.log("🔄 MetaMask accounts changed:", accounts);

        if (accounts.length === 0) {
          console.log("📭 No accounts available - calling handleDisconnect");
          await this.handleDisconnect();
        } else if (accounts[0] !== this.account) {
          console.log("🔄 Account changed:", {
            from: this.account,
            to: accounts[0],
          });
          this.handleAccountChange(accounts[0]);
        } else {
          console.log("✅ Same account, no action needed");
        }
      });

      // Listen for chain changes
      window.ethereum.on("chainChanged", (chainId) => {
        console.log("🔗 Chain changed to:", chainId);
        this.chainId = chainId;
        this.notifyListeners();
      });

      // Listen for disconnect
      window.ethereum.on("disconnect", async (error) => {
        console.log("🔌 MetaMask disconnect event:", error);
        await this.handleDisconnect();
      });
    }
  }

  async connect() {
    try {
      // Check if user is authenticated with OAuth first
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please sign in with OAuth first");
      }

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error(
          "MetaMask not detected. Please install MetaMask to continue."
        );
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask.");
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      this.account = accounts[0];
      this.chainId = chainId;
      this.provider = window.ethereum;
      this.isConnected = true;
      this.isVerified = false; // Reset verification status

      // Store connection
      this.storeWalletConnection();

      console.log("Wallet connected:", this.account);
      this.notifyListeners();

      return this.account;
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    this.account = null;
    this.provider = null;
    this.chainId = null;
    this.isConnected = false;
    this.isVerified = false;
    this.verificationToken = null;

    // Clear stored data
    this.clearWalletData();

    console.log("Wallet disconnected");
    this.notifyListeners();
  }

  // Clear UI state only, preserve localStorage for restoration
  clearUIState() {
    this.account = null;
    this.provider = null;
    this.chainId = null;
    this.isConnected = false;
    this.isVerified = false;
    this.verificationToken = null;

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

      // Step 3: Request signature from user
      const signature = await this.requestSignature(message);

      // Step 4: Verify signature with backend
      const verificationResult = await this.verifySignatureWithBackend(
        signature,
        message,
        nonce
      );

      if (verificationResult.success) {
        this.isVerified = true;
        this.verificationToken = verificationResult.token;

        // Store verification
        this.storeWalletVerification();

        console.log("Wallet verified successfully");
        this.notifyListeners();

        return verificationResult;
      } else {
        throw new Error("Wallet verification failed");
      }
    } catch (error) {
      console.error("Wallet verification error:", error);
      throw error;
    }
  }

  async getNonce() {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("User must be authenticated to verify wallet");
    }

    const response = await fetch(
      `${import.meta.env.VITE_USERINFO_URL.replace(
        "/auth_google/details",
        ""
      )}/wallet/nonce`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: this.account,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get nonce: ${response.status}`);
    }

    const data = await response.json();
    return data.nonce;
  }

  createSignatureMessage(nonce) {
    const domain = window.location.hostname;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const timestamp = Math.floor(Date.now() / 1000);

    return `Welcome to EdgeVideo AI!

Please sign this message to verify your wallet ownership.

Domain: ${domain}
Wallet: ${this.account}
User: ${user.email}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;
  }

  async requestSignature(message) {
    try {
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, this.account],
      });

      return signature;
    } catch (error) {
      if (error.code === 4001) {
        throw new Error("User rejected the signature request");
      }
      throw error;
    }
  }

  async verifySignatureWithBackend(signature, message, nonce) {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("User must be authenticated to verify wallet");
    }

    const response = await fetch(
      `${import.meta.env.VITE_USERINFO_URL.replace(
        "/auth_google/details",
        ""
      )}/wallet/verify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: this.account,
          signature: signature,
          message: message,
          nonce: nonce,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Verification failed: ${response.status}`
      );
    }

    return await response.json();
  }

  handleAccountChange(newAccount) {
    console.log("Account changed from", this.account, "to", newAccount);
    this.account = newAccount;
    this.isVerified = false; // Reset verification on account change
    this.verificationToken = null;

    this.storeWalletConnection();
    this.clearWalletVerification();
    this.notifyListeners();
  }

  async handleDisconnect() {
    console.log(
      "🔄 MetaMask disconnect event received, checking actual connection status..."
    );

    try {
      if (window.ethereum) {
        // Check if MetaMask still has accounts
        const currentAccounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        console.log(
          "📋 Current accounts after disconnect event:",
          currentAccounts
        );

        if (currentAccounts.length === 0) {
          // Actually disconnected
          console.log(
            "❌ MetaMask actually disconnected - clearing wallet state"
          );
          this.disconnect();
        } else {
          // False alarm - MetaMask still has connected accounts
          console.log(
            "✅ MetaMask still connected - ignoring disconnect event"
          );

          // If we had a stored connection to the same account, restore it
          const storedAddress = localStorage.getItem("walletAddress");
          if (storedAddress && currentAccounts.includes(storedAddress)) {
            console.log("🔄 Restoring connection after false disconnect event");
            this.account = storedAddress;
            this.isConnected = true;
            this.notifyListeners();
          }
        }
      } else {
        // No ethereum object - definitely disconnected
        console.log("❌ No ethereum object - MetaMask removed or disabled");
        this.disconnect();
      }
    } catch (error) {
      console.error("💥 Error checking disconnect status:", error);
      // On error, assume disconnected for safety
      this.disconnect();
    }
  }

  // Storage methods
  storeWalletConnection() {
    try {
      if (this.account) {
        localStorage.setItem("walletAddress", this.account);
        localStorage.setItem("walletChainId", this.chainId);
        localStorage.setItem("walletConnected", "true");
      }
    } catch (error) {
      console.error("Failed to store wallet connection:", error);
    }
  }

  storeWalletVerification() {
    try {
      if (this.verificationToken) {
        localStorage.setItem("walletVerificationToken", this.verificationToken);
        localStorage.setItem("walletVerified", "true");
      }
    } catch (error) {
      console.error("Failed to store wallet verification:", error);
    }
  }

  clearWalletData() {
    try {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletChainId");
      localStorage.removeItem("walletConnected");
      this.clearWalletVerification();
    } catch (error) {
      console.error("Failed to clear wallet data:", error);
    }
  }

  clearWalletVerification() {
    try {
      localStorage.removeItem("walletVerificationToken");
      localStorage.removeItem("walletVerified");
    } catch (error) {
      console.error("Failed to clear wallet verification:", error);
    }
  }

  async restoreWalletState() {
    try {
      console.log("🔄 Starting wallet state restoration...");

      const storedAddress = localStorage.getItem("walletAddress");
      const storedChainId = localStorage.getItem("walletChainId");
      const wasConnected = localStorage.getItem("walletConnected") === "true";
      const wasVerified = localStorage.getItem("walletVerified") === "true";
      const verificationToken = localStorage.getItem("walletVerificationToken");

      console.log("📦 Stored wallet data:", {
        storedAddress,
        storedChainId,
        wasConnected,
        wasVerified,
        hasVerificationToken: !!verificationToken,
        hasEthereum: !!window.ethereum,
      });

      if (storedAddress && wasConnected && window.ethereum) {
        console.log("🔍 Checking current MetaMask accounts...");

        // Check if the wallet is still connected to the same account
        const currentAccounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        console.log("🏦 Current MetaMask accounts:", currentAccounts);

        if (currentAccounts.includes(storedAddress)) {
          console.log("✅ Account match found! Restoring wallet state...");

          this.account = storedAddress;
          this.chainId = storedChainId;
          this.provider = window.ethereum;
          this.isConnected = true;

          if (wasVerified && verificationToken) {
            this.isVerified = true;
            this.verificationToken = verificationToken;
            console.log("🔐 Verification status also restored");
          }

          console.log("🎉 Wallet state fully restored:", {
            account: this.account,
            isConnected: this.isConnected,
            isVerified: this.isVerified,
          });

          this.notifyListeners();
          return true;
        } else {
          // Wallet state mismatch, clear stored data
          console.log(
            "❌ Account mismatch! Stored:",
            storedAddress,
            "Current:",
            currentAccounts
          );
          this.clearWalletData();
        }
      } else {
        console.log("❌ Cannot restore wallet state:", {
          hasStoredAddress: !!storedAddress,
          wasConnected,
          hasEthereum: !!window.ethereum,
        });
      }
    } catch (error) {
      console.error("💥 Failed to restore wallet state:", error);
      this.clearWalletData();
    }
    return false;
  }

  // Getters
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
      account: this.account,
      chainId: this.chainId,
      isConnected: this.isConnected,
      isVerified: this.isVerified,
      verificationToken: this.verificationToken,
    };
  }

  // Alias for compatibility
  getWalletStatus() {
    return this.getConnectionState();
  }

  // Check if MetaMask is available
  hasMetaMask() {
    // More robust MetaMask detection
    if (typeof window === "undefined") {
      console.log("MetaMask detection: No window object");
      return false;
    }

    // Check for ethereum object
    if (!window.ethereum) {
      console.log("MetaMask detection: No window.ethereum");
      return false;
    }

    console.log("MetaMask detection: ethereum object found", {
      isMetaMask: window.ethereum.isMetaMask,
      hasProviders: !!window.ethereum.providers,
      providersLength: window.ethereum.providers?.length,
      hasMetamaskProperty: !!window.ethereum._metamask,
    });

    // Primary check: window.ethereum.isMetaMask
    if (window.ethereum.isMetaMask) {
      console.log("MetaMask detection: SUCCESS via isMetaMask property");
      return true;
    }

    // Secondary check for multiple wallet extensions (providers array)
    if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
      const hasMetaMaskProvider = window.ethereum.providers.some(
        (provider) => provider && provider.isMetaMask
      );
      if (hasMetaMaskProvider) {
        console.log("MetaMask detection: SUCCESS via providers array");
        return true;
      }
    }

    // Fallback check for user agent or other MetaMask signatures
    if (typeof navigator !== "undefined" && navigator.userAgent) {
      // Some versions of MetaMask inject differently
      if (window.ethereum._metamask !== undefined) {
        console.log("MetaMask detection: SUCCESS via _metamask property");
        return true;
      }
    }

    console.log("MetaMask detection: FAILED - no valid detection method");
    return false;
  }

  // Utility methods
  shortenAddress(address = this.account) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getChainName(chainId = this.chainId) {
    const chains = {
      "0x1": "Ethereum Mainnet",
      "0x89": "Polygon",
      "0xa": "Optimism",
      "0xa4b1": "Arbitrum One",
      "0x38": "BSC",
      "0x2105": "Base",
    };
    return chains[chainId] || `Chain ${chainId}`;
  }

  // Event listener management
  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.getConnectionState());
      } catch (error) {
        console.error("Wallet listener callback error:", error);
      }
    });
  }
}

// Export singleton instance
const walletService = new WalletService();

// Make it globally available
window.walletService = walletService;

export default walletService;
