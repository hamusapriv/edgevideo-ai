// Auth Service - OAuth authentication management
import { AuthError } from "./apiClient.js";

class AuthService {
  constructor() {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.isLoading = false;
    this.listeners = [];

    // Initialize OAuth provider
    this.initializeOAuth();
  }

  async initializeOAuth() {
    // Load Google OAuth library
    if (typeof google === "undefined") {
      await this.loadGoogleOAuth();
    }

    // Initialize Google OAuth
    try {
      await google.accounts.id.initialize({
        client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
      });
    } catch (error) {
      console.error("Failed to initialize Google OAuth:", error);
    }
  }

  loadGoogleOAuth() {
    return new Promise((resolve, reject) => {
      if (document.getElementById("google-oauth-script")) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.id = "google-oauth-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async handleCredentialResponse(response) {
    try {
      this.isLoading = true;
      this.notifyListeners();

      // Decode JWT token to get user info
      const userInfo = this.decodeJWT(response.credential);

      // Verify token with our backend
      const authResult = await this.verifyTokenWithBackend(response.credential);

      this.user = {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified: userInfo.email_verified,
      };

      this.accessToken = authResult.accessToken || response.credential;
      this.refreshToken = authResult.refreshToken;

      // Store in secure storage
      this.storeTokens();

      console.log("OAuth login successful:", this.user);
    } catch (error) {
      console.error("OAuth login failed:", error);
      throw new AuthError("Failed to authenticate with OAuth provider");
    } finally {
      this.isLoading = false;
      this.notifyListeners();
    }
  }

  async verifyTokenWithBackend(credential) {
    // Send OAuth token to backend for verification and user creation
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_EAT}/oauth/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: credential,
            provider: "google",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Backend verification failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Backend verification error:", error);
      // Continue with client-side token for now
      return { accessToken: credential };
    }
  }

  decodeJWT(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new AuthError("Invalid OAuth token format");
    }
  }

  async signIn() {
    try {
      this.isLoading = true;
      this.notifyListeners();

      // Check if already signed in
      if (this.isAuthenticated()) {
        return this.user;
      }

      // Trigger Google OAuth popup
      google.accounts.id.prompt();

      // Return promise that resolves when auth completes
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new AuthError("Authentication timeout"));
        }, 30000);

        const listener = () => {
          clearTimeout(timeout);
          this.removeListener(listener);
          if (this.isAuthenticated()) {
            resolve(this.user);
          } else {
            reject(new AuthError("Authentication cancelled"));
          }
        };

        this.addListener(listener);
      });
    } catch (error) {
      this.isLoading = false;
      this.notifyListeners();
      throw error;
    }
  }

  async signOut() {
    try {
      // Revoke Google tokens
      if (this.accessToken) {
        google.accounts.id.revoke(this.user?.email || "", () => {
          console.log("Google tokens revoked");
        });
      }

      // Clear local state
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;

      // Clear storage
      this.clearTokens();

      console.log("User signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      this.notifyListeners();
    }
  }

  isAuthenticated() {
    return !!(this.user && this.accessToken);
  }

  getUser() {
    return this.user;
  }

  getAccessToken() {
    return this.accessToken;
  }

  storeTokens() {
    try {
      // Store in localStorage for persistence (consider more secure options)
      if (this.accessToken) {
        localStorage.setItem("oauth_token", this.accessToken);
      }
      if (this.refreshToken) {
        localStorage.setItem("oauth_refresh_token", this.refreshToken);
      }
      if (this.user) {
        localStorage.setItem("user_profile", JSON.stringify(this.user));
      }
    } catch (error) {
      console.error("Failed to store auth tokens:", error);
    }
  }

  clearTokens() {
    try {
      localStorage.removeItem("oauth_token");
      localStorage.removeItem("oauth_refresh_token");
      localStorage.removeItem("user_profile");
      localStorage.removeItem("walletAddress"); // Clear old wallet
      localStorage.removeItem("walletVerificationToken");
    } catch (error) {
      console.error("Failed to clear auth tokens:", error);
    }
  }

  async restoreSession() {
    try {
      const token = localStorage.getItem("oauth_token");
      const userProfile = localStorage.getItem("user_profile");

      if (token && userProfile) {
        this.accessToken = token;
        this.refreshToken = localStorage.getItem("oauth_refresh_token");
        this.user = JSON.parse(userProfile);

        // Verify token is still valid
        await this.validateToken();

        this.notifyListeners();
        return true;
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      this.clearTokens();
    }
    return false;
  }

  async validateToken() {
    // Simple token validation - check if it's expired
    if (!this.accessToken) return false;

    try {
      const payload = this.decodeJWT(this.accessToken);
      const now = Date.now() / 1000;

      if (payload.exp && payload.exp < now) {
        throw new AuthError("Token expired");
      }

      return true;
    } catch (error) {
      console.error("Token validation failed:", error);
      await this.signOut();
      return false;
    }
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
        callback({
          user: this.user,
          isAuthenticated: this.isAuthenticated(),
          isLoading: this.isLoading,
        });
      } catch (error) {
        console.error("Listener callback error:", error);
      }
    });
  }
}

// Export singleton instance
export const authService = new AuthService();

// Make it globally available for the API client
window.authService = authService;
