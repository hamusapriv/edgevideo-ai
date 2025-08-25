// src/services/authTokenService.js
// Service to exchange Google tokens for backend-compatible tokens

const API_BASE_URL = "https://fastapi.edgevideo.ai";

class AuthTokenService {
  /**
   * Exchange Google JWT token for backend-compatible viewerId token
   * @param {string} googleToken - The Google JWT token from authentication
   * @returns {Promise<string>} Backend-compatible JWT token
   */
  async exchangeToken(googleToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/exchange-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${googleToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      return data.token; // New viewerId-based token
    } catch (error) {
      console.error("Token exchange error:", error);
      throw error;
    }
  }

  /**
   * Get or create a backend-compatible token
   * @param {string} googleToken - The Google JWT token
   * @returns {Promise<string>} Backend-compatible token
   */
  async getBackendToken(googleToken) {
    const backendToken = localStorage.getItem("backendAuthToken");

    if (backendToken) {
      // Check if token is still valid
      try {
        const payload = JSON.parse(atob(backendToken.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          return backendToken; // Token still valid
        }
      } catch (e) {
        // Token invalid, need to exchange
      }
    }

    // Exchange Google token for backend token
    const newBackendToken = await this.exchangeToken(googleToken);
    localStorage.setItem("backendAuthToken", newBackendToken);
    return newBackendToken;
  }
}

export default new AuthTokenService();
