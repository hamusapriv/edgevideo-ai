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

  // Fetch server status for anti-cheat validation
  const fetchServerStatus = async () => {
    if (!user?.email) {
      console.log(
        "CheckInStatus: No authenticated user, skipping server status fetch"
      );
      return;
    }

    try {
      const status = await pointsService.getCheckinStatus();
      setServerStatus(status);

      if (status) {
        // If server doesn't provide explicit canCheckin status,
        // check local storage against server time if available
        let canCheckin = status.canCheckin;

        if (canCheckin === undefined || canCheckin === true) {
          // Server doesn't explicitly say no, check local storage
          const lastCheckin = localStorage.getItem("lastDailyCheckin");
          const today = new Date().toISOString().split("T")[0];
          canCheckin = lastCheckin !== today;
        }

        setIsCheckedIn(!canCheckin);
        setStreakDays(status.streak || 0);

        // If user is checked in but streak is 0, assume at least 1 day
        if (!canCheckin && (status.streak || 0) === 0) {
          setStreakDays(1);
          localStorage.setItem("dailyCheckinStreak", "1");
        } else {
          // Store server-validated streak
          localStorage.setItem(
            "dailyCheckinStreak",
            (status.streak || 0).toString()
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch server status:", error);
      // Fallback to local status check
      updateLocalStatus();
    }
  };

  // Fallback local status check
  const updateLocalStatus = () => {
    const lastCheckin = localStorage.getItem("lastDailyCheckin");
    const today = new Date().toISOString().split("T")[0];

    const isCheckedInToday = lastCheckin === today;
    setIsCheckedIn(isCheckedInToday);

    // Get local streak
    const storedStreak = localStorage.getItem("dailyCheckinStreak");
    const streakValue = parseInt(storedStreak) || 0;

    // If checked in today but streak is 0, assume at least 1
    if (isCheckedInToday && streakValue === 0) {
      setStreakDays(1);
      localStorage.setItem("dailyCheckinStreak", "1");
    } else {
      setStreakDays(streakValue);
    }
  }; // Check check-in status and calculate streak
  useEffect(() => {
    if (user?.email) {
      fetchServerStatus();

      // Refresh server status every 5 minutes
      const interval = setInterval(fetchServerStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      // When user logs out, reset to local status
      updateLocalStatus();
    }
  }, [user?.email]); // Only trigger when email changes // Calculate time remaining until next check-in
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
      setStreakDays(days);
      localStorage.setItem("dailyCheckinStreak", days.toString());
      setIsCheckedIn(true);

      // Refresh server status after check-in
      setTimeout(() => {
        fetchServerStatus();
      }, 1000);
    };

    const handleStatusUpdate = (event) => {
      const { isCheckedIn, streak, alreadyCheckedIn } = event.detail;
      setIsCheckedIn(isCheckedIn);

      // Update streak if provided
      if (streak !== undefined) {
        setStreakDays(streak);
        localStorage.setItem("dailyCheckinStreak", streak.toString());
      }

      // If this was triggered by "already checked in", don't refresh server status
      // to avoid infinite loops
      if (!alreadyCheckedIn) {
        setTimeout(() => {
          fetchServerStatus();
        }, 500);
      }
    };

    const handleWalletRequired = (event) => {
      const { error, requiresWallet } = event.detail;
      setWalletRequired(requiresWallet);
      setWalletErrorMessage(error);
      console.log("Wallet required for points:", error);
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
          <span className="status-label">Current Streak:</span>
          <span className="status-value">{streakDays} days</span>
        </div>

        <div className="status-item">
          <span className="status-label">Next check-in:</span>
          <span className="status-value">{timeRemaining}</span>
        </div>

        {serverStatus && (
          <div className="status-item">
            <span className="status-label">Server sync:</span>
            <span className="status-value server-validated">✓ Verified</span>
          </div>
        )}

        {isCheckedIn && (
          <div className="status-message">
            ✨ You've checked in today! Come back tomorrow for your next reward.
            {serverStatus && (
              <small>
                <br />
                Status verified by server
              </small>
            )}
          </div>
        )}

        {!isCheckedIn && !walletRequired && (
          <div className="status-message available">
            🎁 Check-in available! Refresh the page to claim your daily reward.
            {serverStatus && (
              <small>
                <br />
                Server confirms availability
              </small>
            )}
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
