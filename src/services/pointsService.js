// Points Service - Handle points balance and spending
// Based on legacy main.js implementation

class PointsService {
  constructor() {
    this.pointsBalance = 0;
    this.listeners = [];
    this.ws = null;
    this.wsOpened = false;
    this.channelId = null;
    this.userEmail = null;
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

      console.log(`Fetching points for user: ${this.userEmail}`);

      // Try multiple API endpoints as fallback
      const apiUrls = [
        `https://referrals.edgevideo.com/get_new_points_by_email/${this.userEmail}`,
        // Games endpoints disabled until live
        // `https://eat.edgevideo.com:8080/get_new_points_by_email/${this.userEmail}`,
        `https://referrals.edgevideo.com/get_new_points/${this.userEmail}`, // fallback to original format
      ];

      for (const url of apiUrls) {
        try {
          const response = await fetch(url);

          if (!response.ok) {
            console.warn(`Points API failed for ${url}: ${response.status}`);
            continue;
          }

          const data = await response.json();

          if (data.result && typeof data.result.offchain_balance === "number") {
            this.pointsBalance = data.result.offchain_balance;
            this.notifyListeners();
            console.log(`Points updated: ${this.pointsBalance}`);
            return this.pointsBalance;
          } else if (typeof data.points === "number") {
            // Alternative response format
            this.pointsBalance = data.points;
            this.notifyListeners();
            console.log(`Points updated: ${this.pointsBalance}`);
            return this.pointsBalance;
          } else {
            console.warn("Invalid points response format:", data);
            continue;
          }
        } catch (err) {
          console.warn(`Points request failed for ${url}:`, err);
          continue;
        }
      }

      console.warn("All points API endpoints failed");
      return this.pointsBalance;
    } catch (error) {
      console.error("Failed to update points:", error);
      return this.pointsBalance;
    }
  }

  // Set user email for points fetching
  setUserEmail(email) {
    this.userEmail = email;
    if (email) {
      this.updatePoints();
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
        setTimeout(() => this.updatePoints(), 500);
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
    this.updatePoints();
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
}

// Export singleton instance
const pointsService = new PointsService();

// Make it globally available for debugging
window.pointsService = pointsService;

export default pointsService;
