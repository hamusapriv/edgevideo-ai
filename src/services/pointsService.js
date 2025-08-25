// Points Service - Handle points balance and spending
// Based on legacy main.js implementation

// Configuration
const API_BASE_URL = "https://fastapi.edgevideo.ai";

class PointsService {
  constructor() {
    this.pointsBalance = 0;
    this.listeners = [];
    this.ws = null;
    this.wsOpened = false;
    this.channelId = null;
    this.userEmail = null;
    this.isCheckingIn = false; // Prevent multiple simultaneous check-ins
  }

  /**
   * Get the auth token for API calls
   * @returns {string|null} Auth token from localStorage
   */
  getAuthToken() {
    return (
      localStorage.getItem("authToken") || localStorage.getItem("access_token")
    );
  }

  // Get current points balance
  getBalance() {
    return this.pointsBalance;
  }

  // Update points from API
  async updatePoints() {
    try {
      if (!this.userEmail) {
        console.warn("No user email available for points update");
        return 0;
      }

      // Get auth token using the standard method
      const token = this.getAuthToken();
      if (!token) {
        console.warn("No auth token available for points API");
        return this.pointsBalance;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/points/get`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          if (
            errorData?.error?.includes("wallet") ||
            errorData?.error?.includes("linked")
          ) {
            console.warn(
              `Points API requires wallet linking: ${errorData.error}`
            );
            // Emit wallet requirement event
            const event = new CustomEvent("walletRequiredForPoints", {
              detail: {
                error: errorData.error,
                requiresWallet: true,
              },
            });
            window.dispatchEvent(event);
          } else {
            console.warn(`Points API failed: ${response.status}`);
          }
          return this.pointsBalance;
        }

        const data = await response.json();
        console.log("Points API response:", data);

        if (typeof data.points === "number") {
          this.pointsBalance = data.points;
          this.notifyListeners();
          console.log(`Points updated: ${this.pointsBalance}`);
          return this.pointsBalance;
        } else if (data.result && typeof data.result.points === "number") {
          this.pointsBalance = data.result.points;
          this.notifyListeners();
          console.log(`Points updated: ${this.pointsBalance}`);
          return this.pointsBalance;
        } else {
          console.warn("Invalid points response format:", data);
          return this.pointsBalance;
        }
      } catch (err) {
        console.warn("Points request failed:", err);
        return this.pointsBalance;
      }
    } catch (error) {
      console.error("Failed to update points:", error);
      return this.pointsBalance;
    }
  }

  // Get user's check-in status from server (anti-cheat validation)
  async getCheckinStatus() {
    try {
      if (!this.userEmail) {
        // Use debug log instead of warn to reduce console noise
        console.debug("No user email available for check-in status");
        return null;
      }

      const token = this.getAuthToken();
      if (!token) {
        console.debug("No auth token available for check-in status");
        return null;
      }

      // First try the points GET endpoint
      const response = await fetch(`${API_BASE_URL}/points/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        console.warn(`Check-in status API failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log("Check-in status API response:", data);

      // Log what fields are available for debugging
      console.log("Available API fields:", Object.keys(data));
      console.log("Points:", data.points);
      console.log("Streak fields:", {
        streak: data.streak,
        checkin_streak: data.checkin_streak,
        daily_streak: data.daily_streak,
        current_streak: data.current_streak,
      });
      console.log("Check-in timing fields:", {
        last_checkin_time: data.last_checkin_time,
        lastCheckinTime: data.lastCheckinTime,
        last_checkin: data.last_checkin,
        can_checkin: data.can_checkin,
        next_checkin: data.next_checkin,
        server_time: data.server_time,
      });

      // If the GET endpoint doesn't provide check-in status,
      // we'll need to test with a check-in request to determine status
      const hasCheckinData =
        data.last_checkin_time ||
        data.lastCheckinTime ||
        data.last_checkin ||
        data.can_checkin !== undefined;

      if (!hasCheckinData) {
        // API doesn't provide check-in status, so we'll rely on local storage
        // and let the actual check-in request determine server status
        console.log(
          "API doesn't provide check-in status, using local validation"
        );
        return {
          canCheckin: true, // Default to allow attempt
          streak:
            data.days ||
            data.streak ||
            data.checkin_streak ||
            data.daily_streak ||
            0,
          serverTime: new Date().toISOString(),
        };
      }

      // Handle different possible API response formats
      return {
        lastCheckinTime:
          data.last_checkin_time || data.lastCheckinTime || data.last_checkin,
        canCheckin: data.can_checkin !== false && data.canCheckin !== false, // Default to true if not specified
        serverTime:
          data.server_time || data.serverTime || new Date().toISOString(),
        nextCheckinTime:
          data.next_checkin_time || data.nextCheckinTime || data.next_checkin,
        streak:
          data.days ||
          data.streak ||
          data.checkin_streak ||
          data.daily_streak ||
          0,
      };
    } catch (error) {
      console.error("Failed to get check-in status:", error);
      return null;
    }
  }

  // Test check-in availability without actually checking in
  async testCheckinAvailability() {
    try {
      if (!this.userEmail) {
        return { canCheckin: false, reason: "No user email" };
      }

      const token = await this.getAuthToken();
      if (!token) {
        return { canCheckin: false, reason: "No auth token" };
      }

      // We'll test by making the actual check-in request
      // If it fails with "Already checked in", we know the status
      const response = await fetch(`${API_BASE_URL}/points/checkin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Check-in test response:", data, "Status:", response.status);

      // Log what fields are available in check-in response
      if (data) {
        console.log("Check-in response fields:", Object.keys(data));
        if (data.error) {
          console.log("Error response - available fields:", Object.keys(data));
        } else {
          console.log("Success response fields:", {
            points: data.points,
            reward: data.reward,
            streak: data.streak,
            days: data.days,
            total_points: data.total_points,
            message: data.message,
          });
        }
      }

      if (!response.ok) {
        if (data.error && data.error.includes("Already checked in")) {
          console.log("Already checked in response data:", data);
          return {
            canCheckin: false,
            reason: "Already checked in today",
            alreadyCheckedIn: true,
            // Since API doesn't provide streak in error response, we'll determine it elsewhere
            streak:
              data.days || data.streak || data.current_streak || undefined,
            data: data, // Include full response data
          };
        }

        // Check for wallet requirement error
        if (
          data.error &&
          (data.error.includes("wallet") || data.error.includes("linked"))
        ) {
          console.log("Wallet requirement error:", data.error);
          // Emit wallet requirement event
          const event = new CustomEvent("walletRequiredForPoints", {
            detail: {
              error: data.error,
              requiresWallet: true,
            },
          });
          window.dispatchEvent(event);

          return {
            canCheckin: false,
            reason: data.error,
            requiresWallet: true,
          };
        }

        return {
          canCheckin: false,
          reason: data.error || data.message || "Unknown error",
        };
      }

      // If successful, it means check-in was available and we just executed it
      return {
        canCheckin: true,
        checkinExecuted: true,
        data: data,
      };
    } catch (error) {
      console.error("Failed to test check-in availability:", error);
      return { canCheckin: false, reason: "Network error" };
    }
  }

  // Automatic daily check-in with server-side validation
  async performAutoCheckin() {
    try {
      if (!this.userEmail) {
        console.warn("No user email available for check-in");
        return null;
      }

      // Prevent multiple simultaneous check-in attempts
      if (this.isCheckingIn) {
        console.log("Check-in already in progress, skipping duplicate attempt");
        return null;
      }

      this.isCheckingIn = true;

      // Use the new test method instead of the old logic
      const availabilityTest = await this.testCheckinAvailability();

      if (!availabilityTest.canCheckin) {
        console.log(`Check-in not available: ${availabilityTest.reason}`);

        // If already checked in, update local state
        if (availabilityTest.alreadyCheckedIn) {
          const today = new Date().toISOString().split("T")[0];
          localStorage.setItem("lastDailyCheckin", today);

          // For streak, use existing value or default to 1 if no stored value
          let streakValue = availabilityTest.streak;
          if (streakValue === undefined) {
            const storedStreak = localStorage.getItem("dailyCheckinStreak");
            streakValue = parseInt(storedStreak) || 1; // Default to 1 if checked in today
          }

          // Store streak information
          localStorage.setItem("dailyCheckinStreak", streakValue.toString());

          // Emit status update event with streak info
          const event = new CustomEvent("checkinStatusUpdate", {
            detail: {
              isCheckedIn: true,
              streak: streakValue,
              alreadyCheckedIn: true,
            },
          });
          window.dispatchEvent(event);
        }

        return null;
      }

      // If testCheckinAvailability returned canCheckin=true and checkinExecuted=true,
      // it means the check-in was successful
      if (availabilityTest.checkinExecuted && availabilityTest.data) {
        const data = availabilityTest.data;
        const today = new Date().toISOString().split("T")[0];

        // Mark as checked in
        localStorage.setItem("lastDailyCheckin", today);

        // Store the streak from the API response (using 'days' field)
        const streakValue = data.days || data.streak || 1;
        localStorage.setItem("dailyCheckinStreak", streakValue.toString());

        // Update points
        setTimeout(() => this.updatePoints(), 500);

        // Emit event for UI components
        const event = new CustomEvent("dailyCheckinReward", {
          detail: {
            days: streakValue,
            value: data.reward || data.points || 10,
            total: data.points || data.total_points || data.total || 10,
          },
        });
        window.dispatchEvent(event);

        return data;
      }

      return null;
    } catch (error) {
      console.error("Auto check-in failed:", error);
      return null;
    } finally {
      // Always clear the checking flag
      this.isCheckingIn = false;
    }
  }

  // Set user email for points fetching
  setUserEmail(email) {
    this.userEmail = email;
    if (email) {
      // Update points when email is set
      this.updatePoints();

      // Perform automatic daily check-in
      setTimeout(() => {
        this.performAutoCheckin();
      }, 1000); // Small delay to ensure auth token is available
    }
  }

  // Set channel ID for WebSocket connection
  setChannelId(channelId) {
    this.channelId = channelId;
  }

  // Initialize WebSocket connection for real-time updates
  initializeWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Games WebSocket endpoints disabled until live
      console.log("WebSocket connections disabled - games not live yet");
      return;

      // Try different WebSocket URLs as fallback
      const wsUrls = [
        // "wss://gaimify.edgevideo.com/ws",
        // "wss://gaimify.edgevideo.com",
        // "wss://eat.edgevideo.com:8080",
      ];

      this.connectWithFallback(wsUrls, 0);
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
    }
  }

  connectWithFallback(urls, index) {
    if (index >= urls.length) {
      console.error("All WebSocket URLs failed");
      return;
    }

    const url = urls[index];
    console.log(`Attempting WebSocket connection to: ${url}`);

    this.ws = new WebSocket(url);
    this.wsOpened = false;

    this.ws.addEventListener("open", (event) => {
      console.log(`Points WebSocket connected to: ${url}`);
      this.wsOpened = true;

      // Send user email and channel info
      if (this.userEmail) {
        this.ws.send(
          JSON.stringify({
            type: "user_email",
            email: this.userEmail,
          })
        );
      }

      if (this.channelId) {
        this.ws.send(
          JSON.stringify({
            type: "channel",
            channel: this.channelId,
          })
        );
      }
    });

    this.ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    });

    this.ws.addEventListener("error", (event) => {
      console.error(`Points WebSocket error for ${url}:`, event);
      // Try next URL in the fallback list
      setTimeout(() => {
        this.connectWithFallback(urls, index + 1);
      }, 1000);
    });

    this.ws.addEventListener("close", (event) => {
      console.log(
        `Points WebSocket closed for ${url}, attempting to reconnect...`
      );
      this.wsOpened = false;
      // Reconnect after 3 seconds, starting with the first URL again
      setTimeout(() => this.connectWithFallback(urls, 0), 3000);
    });
  }

  // Handle WebSocket messages
  handleWebSocketMessage(data) {
    console.log("WebSocket message received:", data);

    switch (data.type) {
      case "command":
        if (data.command === "updatepoints") {
          this.updatePoints();
        }
        break;

      case "winloss":
        if (data.amount > 0) {
          // Win notification will be handled by the UI components
          console.log(`Points won: ${data.amount}`);
        } else {
          // Loss notification
          console.log("Points lost in game");
        }
        // Update points after win/loss
        // Referrals API disabled - skip points update
        // TODO: Re-enable when referrals endpoint is working
        // setTimeout(() => this.updatePoints(), 500);
        break;

      case "checkin":
        // Daily check-in reward received
        console.log("Daily check-in reward:", data);
        this.handleCheckinReward(data);
        break;

      default:
        // Other message types can be handled by other services
        break;
    }
  }

  // Handle daily check-in reward
  handleCheckinReward(data) {
    // Emit event for UI components to handle
    const event = new CustomEvent("dailyCheckinReward", {
      detail: {
        days: data.days,
        value: data.value,
        total: data.total,
      },
    });
    window.dispatchEvent(event);

    // Update points after check-in
    // Referrals API disabled - skip points update
    // TODO: Re-enable when referrals endpoint is working
    // this.updatePoints();
  }

  // Send WebSocket message
  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    console.warn("WebSocket not connected, cannot send message:", message);
    return false;
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.wsOpened = false;
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
        callback(this.pointsBalance);
      } catch (error) {
        console.error("Error in points listener:", error);
      }
    });
  }

  // Reset service state
  reset() {
    this.pointsBalance = 0;
    this.userEmail = null;
    this.channelId = null;
    this.disconnect();
    this.notifyListeners();
  }

  // Debug function to test API endpoints and see available data
  async debugAPIData() {
    if (!this.userEmail) {
      console.log("❌ No user email available for API testing");
      return;
    }

    const token = await this.getAuthToken();
    if (!token) {
      console.log("❌ No auth token available for API testing");
      return;
    }

    console.log("🔍 Testing EdgeVideo API endpoints...");
    console.log("User email:", this.userEmail);

    try {
      // Test GET /points
      console.log("\n📊 Testing GET /points:");
      const pointsResponse = await fetch(`${API_BASE_URL}/points/get`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        console.log("✅ GET /points response:", pointsData);
        console.log("Available fields:", Object.keys(pointsData));
      } else {
        console.log("❌ GET /points failed:", pointsResponse.status);
      }

      // Test POST /checkin (this will either work or show "already checked in")
      console.log("\n📅 Testing POST /checkin:");
      const checkinResponse = await fetch(`${API_BASE_URL}/points/checkin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const checkinData = await checkinResponse.json();
      console.log("POST /checkin response:", checkinData);
      console.log("Status:", checkinResponse.status);
      console.log("Available fields:", Object.keys(checkinData));

      if (checkinResponse.ok) {
        console.log("✅ Check-in successful! Response data:", checkinData);
        console.log("🎯 Streak (days field):", checkinData.days);
        console.log("🎯 Reward points:", checkinData.reward);
        console.log("🎯 Total points:", checkinData.points);
      } else {
        console.log(
          "ℹ️ Check-in not available (likely already checked in):",
          checkinData
        );
      }
    } catch (error) {
      console.error("❌ API testing failed:", error);
    }
  }
}

// Export singleton instance
const pointsService = new PointsService();

// Make it globally available for debugging
window.pointsService = pointsService;

export default pointsService;
