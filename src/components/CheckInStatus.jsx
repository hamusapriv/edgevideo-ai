// src/components/CheckInStatus.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import pointsService from "../services/pointsService";
import "../styles/checkInStatus.css";

export default function CheckInStatus() {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [serverStatus, setServerStatus] = useState(null);
  const [walletRequired, setWalletRequired] = useState(false);
  const [walletErrorMessage, setWalletErrorMessage] = useState("");

  // Simplified streak logic - just use local storage or server data
  const updateStatus = () => {
    if (!user?.email) {
      setIsCheckedIn(false);
      setStreakDays(0);
      return;
    }

    // Check if user has checked in today
    const lastCheckin = localStorage.getItem("lastDailyCheckin");
    const today = new Date().toISOString().split("T")[0];
    const isCheckedInToday = lastCheckin === today;

    setIsCheckedIn(isCheckedInToday);

    // Get streak from localStorage (simpler approach)
    const localStreak =
      parseInt(localStorage.getItem("dailyCheckinStreak")) || 0;

    // If checked in today but no streak recorded, assume at least 1 day
    if (isCheckedInToday && localStreak === 0) {
      setStreakDays(1);
      localStorage.setItem("dailyCheckinStreak", "1");
    } else {
      setStreakDays(localStreak);
    }
  };

  // Reset streak if it becomes unreliable (debug function)
  const resetStreak = () => {
    localStorage.removeItem("dailyCheckinStreak");
    setStreakDays(0);
    console.log("Streak reset");
  };

  // Fetch server status for verification (optional enhancement)
  const fetchServerStatus = async () => {
    if (!user?.email) return;

    try {
      const status = await pointsService.getCheckinStatus();
      if (status) {
        setServerStatus(status);

        // Use server streak if available and more reliable
        if (status.streak !== undefined && status.streak >= 0) {
          setStreakDays(status.streak);
          localStorage.setItem("dailyCheckinStreak", status.streak.toString());
        }
      }
    } catch (error) {
      console.warn("Server status check failed:", error);
    }
  }; // Initialize status when user changes
  useEffect(() => {
    updateStatus();

    if (user?.email) {
      // Optionally fetch server status for verification
      fetchServerStatus();

      // Refresh server status every 5 minutes
      const interval = setInterval(fetchServerStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.email]); // Calculate time remaining until next check-in
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (isCheckedIn) {
        // Use server-provided next check-in time if available
        if (serverStatus?.nextCheckinTime) {
          try {
            const nextCheckin = new Date(serverStatus.nextCheckinTime);
            const now = serverStatus.serverTime
              ? new Date(serverStatus.serverTime)
              : new Date();
            const timeDiff = nextCheckin.getTime() - now.getTime();

            if (timeDiff > 0) {
              const hours = Math.floor(timeDiff / (1000 * 60 * 60));
              const minutes = Math.floor(
                (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
              );
              setTimeRemaining(`${hours}h ${minutes}m`);
              return;
            }
          } catch (error) {
            console.warn("Error parsing server time:", error);
          }
        }

        // Fallback: Calculate time until midnight UTC (next day)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);

        const timeDiff = tomorrow.getTime() - now.getTime();

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining("Available now");
      }
    };

    updateTimeRemaining();

    // Update every minute
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [isCheckedIn, serverStatus]);

  // Listen for check-in updates and status changes
  useEffect(() => {
    const handleCheckinUpdate = (event) => {
      const { days } = event.detail;
      if (days) {
        setStreakDays(days);
        localStorage.setItem("dailyCheckinStreak", days.toString());
      }
      setIsCheckedIn(true);

      // Update today's check-in date
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem("lastDailyCheckin", today);

      // Refresh status after a delay
      setTimeout(updateStatus, 1000);
    };

    const handleStatusUpdate = () => {
      updateStatus();
    };

    const handleWalletRequired = (event) => {
      const { error, requiresWallet } = event.detail;
      setWalletRequired(requiresWallet);
      setWalletErrorMessage(error);
    };

    window.addEventListener("dailyCheckinReward", handleCheckinUpdate);
    window.addEventListener("checkinStatusUpdate", handleStatusUpdate);
    window.addEventListener("walletRequiredForPoints", handleWalletRequired);

    return () => {
      window.removeEventListener("dailyCheckinReward", handleCheckinUpdate);
      window.removeEventListener("checkinStatusUpdate", handleStatusUpdate);
      window.removeEventListener(
        "walletRequiredForPoints",
        handleWalletRequired
      );
    };
  }, []);

  // Don't show if user is not authenticated
  if (!user) {
    return (
      <div className="checkin-status">
        <div className="checkin-status-header">
          <h4>Daily Check-In</h4>
          <div className="checkin-indicator unavailable">🔒</div>
        </div>
        <div className="checkin-status-info">
          <div className="status-message unavailable">
            Please sign in to earn daily rewards!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-status">
      <div className="checkin-status-header">
        <h4>Daily Check-In</h4>
        <div
          className={`checkin-indicator ${
            isCheckedIn
              ? "checked-in"
              : walletRequired
              ? "unavailable"
              : "available"
          }`}
        >
          {isCheckedIn ? "✓" : walletRequired ? "🔗" : "○"}
        </div>
      </div>

      <div className="checkin-status-info">
        <div className="status-item">
          <span className="status-label">Next check-in:</span>
          <span className="status-value">{timeRemaining}</span>
        </div>

        {isCheckedIn && <div className="status-message">Checked in ✓</div>}

        {!isCheckedIn && !walletRequired && (
          <div className="status-message available">
            Check-in available! Refresh the page to claim your daily reward.
          </div>
        )}

        {!isCheckedIn && walletRequired && (
          <div className="status-message unavailable">
            🔗 Wallet linking required to earn points.
            <small>
              <br />
              Server message: {walletErrorMessage}
              <br />
              Please link your wallet in the profile section to start earning
              daily rewards.
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
