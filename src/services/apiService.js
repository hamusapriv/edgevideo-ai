// src/services/apiService.js
// CONSOLIDATED: Centralized API service to eliminate duplicate API calls

const BASE_URL = "https://fastapi.edgevideo.ai";

const API_ENDPOINTS = {
  // Authentication
  AUTH_BASE: `${BASE_URL}/auth_google`,
  AUTH_DETAILS: `${BASE_URL}/auth_google/details`,

  // Tracking
  TRACKING_BASE: `${BASE_URL}/tracking`,
  TRACKING_CLICK: `${BASE_URL}/tracking/click`,
  TRACKING_VOTE_UP: `${BASE_URL}/tracking/vote/up`,
  TRACKING_VOTE_DOWN: `${BASE_URL}/tracking/vote/down`,

  // Products
  PRODUCTS_RECENT: (channelId) =>
    `${BASE_URL}/product_search/recent_products/${channelId}/1`,
  PRODUCTS_MOST_LIKED: `${BASE_URL}/tracking/products/most-liked`,
  PRODUCTS_MOST_CLICKED: `${BASE_URL}/tracking/products/most-clicked`,

  // Votes
  VOTES_PRODUCTS: `${BASE_URL}/tracking/votes/products`,
  VOTES_VIATOR: `${BASE_URL}/tracking/votes/viator`,

  // Other
  IP_INFO: "https://ipapi.co/json/",
};

class ApiService {
  constructor() {
    // No need for request caching to avoid "body stream already read" errors
  }

  // Get auth token from storage
  getAuthToken() {
    return localStorage.getItem("authToken");
  }

  // Get default headers
  getHeaders(includeAuth = false) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Simple request method without deduplication to avoid "body stream already read" errors
  async makeRequest(url, options = {}) {
    return fetch(url, options);
  }

  // Retry utility with exponential backoff
  async makeRequestWithRetry(url, options = {}, maxRetries = 3) {
    const baseDelay = 1000; // 1 second base delay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(url, options);

        // If response is successful or it's a client error (4xx), don't retry
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        // If this is the last attempt, return the failed response
        if (attempt === maxRetries) {
          console.warn(`Max retries (${maxRetries}) reached for ${url}`);
          return response;
        }

        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Request failed for ${url}, attempt ${attempt + 1}/${maxRetries +
            1}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          console.error(
            `Network error after ${maxRetries + 1} attempts for ${url}:`,
            error
          );
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Network error for ${url}, attempt ${attempt + 1}/${maxRetries +
            1}. Retrying in ${delay}ms...`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Authentication APIs
  async fetchUserDetails(token) {
    const response = await this.makeRequest(API_ENDPOINTS.AUTH_DETAILS, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        throw new Error("Session invalid. Please log in again.");
      }
      throw new Error(
        `Failed to fetch user details (Status: ${response.status})`
      );
    }

    return response.json();
  }

  // Vote APIs
  async submitVote(productId, voteType, productData) {
    const url =
      voteType === 1
        ? API_ENDPOINTS.TRACKING_VOTE_UP
        : API_ENDPOINTS.TRACKING_VOTE_DOWN;

    // Use the correct request body format expected by the API
    const requestBody = {
      itemId: productId,
      itemTypeName: productData.itemTypeName || "DB Product",
    };

    const response = await this.makeRequest(url, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Vote failed: ${response.status}`);
    }

    return response.json();
  }

  // Fetch voted products (consolidated from multiple endpoints)
  async fetchVotedProducts() {
    const token = this.getAuthToken();
    if (!token) return [];

    try {
      const [productsRes, viatorRes] = await Promise.allSettled([
        this.makeRequest(API_ENDPOINTS.VOTES_PRODUCTS, {
          headers: this.getHeaders(true),
        }),
        this.makeRequest(API_ENDPOINTS.VOTES_VIATOR, {
          headers: this.getHeaders(true),
        }),
      ]);

      let combinedVotes = [];

      if (productsRes.status === "fulfilled" && productsRes.value.ok) {
        try {
          const data = await productsRes.value.json();
          combinedVotes = [...combinedVotes, ...(data || [])];
        } catch (jsonError) {
          console.warn("Failed to parse products votes JSON:", jsonError);
        }
      }

      if (viatorRes.status === "fulfilled" && viatorRes.value.ok) {
        try {
          const data = await viatorRes.value.json();
          combinedVotes = [...combinedVotes, ...(data || [])];
        } catch (jsonError) {
          console.warn("Failed to parse viator votes JSON:", jsonError);
        }
      }

      return combinedVotes;
    } catch (error) {
      console.error("Error fetching voted products:", error);
      return [];
    }
  }

  // Products APIs
  async fetchRecentProducts(channelId) {
    const response = await this.makeRequest(
      API_ENDPOINTS.PRODUCTS_RECENT(channelId)
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch recent products: ${response.status}`);
    }

    return response.json();
  }

  async fetchMostLiked() {
    const response = await this.makeRequestWithRetry(
      API_ENDPOINTS.PRODUCTS_MOST_LIKED,
      {}, // default GET options
      3 // retry up to 3 times
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch most liked products: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async fetchMostClicked() {
    const response = await this.makeRequestWithRetry(
      API_ENDPOINTS.PRODUCTS_MOST_CLICKED,
      {}, // default GET options
      3 // retry up to 3 times
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch most clicked products: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Click tracking
  async trackClick(productData, source = "unknown") {
    try {
      const response = await this.makeRequest(API_ENDPOINTS.TRACKING_CLICK, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...productData,
          source,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn(
          `Click tracking failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.warn("Click tracking error:", error);
    }
  }

  // IP geolocation
  async fetchIPInfo() {
    const response = await this.makeRequest(API_ENDPOINTS.IP_INFO);

    if (!response.ok) {
      throw new Error(`Failed to fetch IP info: ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export endpoints for backward compatibility
export { API_ENDPOINTS };
