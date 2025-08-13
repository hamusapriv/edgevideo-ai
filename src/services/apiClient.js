// API Client - Unified fetch wrapper with auth and error handling
class ApiClient {
  constructor() {
    this.baseUrls = {
      // Games endpoints disabled until live
      // eat:
      //   import.meta.env.VITE_API_BASE_EAT || "https://eat.edgevideo.com:8080",
      // eatWallet:
      //   import.meta.env.VITE_API_BASE_EAT_WALLET ||
      //   "https://eat.edgevideo.com:8081",
      referrals:
        import.meta.env.VITE_API_BASE_REFERRALS ||
        "https://referrals.edgevideo.com",
      studio:
        import.meta.env.VITE_API_BASE_STUDIO ||
        "https://studio-api.edgevideo.com",
    };
  }

  async request(endpoint, options = {}) {
    const { service = "referrals", ...fetchOptions } = options;
    const baseUrl = this.baseUrls[service];

    if (!baseUrl) {
      throw new Error(
        `Service '${service}' is not available - games endpoints disabled until live`
      );
    }

    const url = `${baseUrl}${endpoint}`;

    // Add auth headers if available
    const headers = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    };

    // Add OAuth token if available
    const authToken = this.getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    // Add wallet verification token if available
    const walletToken = this.getWalletToken();
    if (walletToken) {
      headers["X-Wallet-Token"] = walletToken;
    }

    const config = {
      ...fetchOptions,
      headers,
    };

    try {
      const response = await this.fetchWithRetry(url, config);

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint
        );
      }

      const data = await response.json();

      // Handle API-level errors
      if (data.error) {
        throw new ApiError(data.error, response.status, endpoint, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new NetworkError(
        `Network request failed: ${error.message}`,
        endpoint
      );
    }
  }

  async fetchWithRetry(url, config, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, config);

        // Retry on 5xx errors
        if (response.status >= 500 && attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }

        return response;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getAuthToken() {
    // Get OAuth token from auth service
    return window.authService?.getAccessToken();
  }

  getWalletToken() {
    // Get wallet verification token
    return localStorage.getItem("walletVerificationToken");
  }

  // Service-specific methods
  async get(endpoint, service = "referrals") {
    return this.request(endpoint, { method: "GET", service });
  }

  async post(endpoint, data, service = "referrals") {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      service,
    });
  }

  async put(endpoint, data, service = "referrals") {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      service,
    });
  }

  async delete(endpoint, service = "referrals") {
    return this.request(endpoint, { method: "DELETE", service });
  }
}

// Custom Error Classes
export class ApiError extends Error {
  constructor(message, status, endpoint, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
    this.data = data;
  }
}

export class NetworkError extends Error {
  constructor(message, endpoint) {
    super(message);
    this.name = "NetworkError";
    this.endpoint = endpoint;
  }
}

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
