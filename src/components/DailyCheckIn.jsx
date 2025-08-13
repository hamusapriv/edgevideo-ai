// src/components/DailyCheckIn.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePoints } from "../contexts/PointsContext";
import pointsService from "../services/pointsService";
import "../styles/dailyCheckIn.css";

export default function DailyCheckIn() {
  const { user } = useAuth();
  const { refreshPoints } = usePoints();

  const [showModal, setShowModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Check if user has already checked in today
  useEffect(() => {
    const checkTodayCheckin = () => {
      const lastCheckin = localStorage.getItem("lastDailyCheckin");
      const today = new Date().toDateString();

      if (lastCheckin === today) {
        setIsCheckedIn(true);
      } else {
        setIsCheckedIn(false);
      }
    };

    checkTodayCheckin();

    // Check every minute in case date changes
    const interval = setInterval(checkTodayCheckin, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen for daily check-in rewards from WebSocket
  useEffect(() => {
    const handleCheckinReward = (event) => {
      const { days, value, total } = event.detail;

      setRewardData({
        days,
        value,
        total,
      });

      setShowModal(true);
      setIsCheckedIn(true);

      // Mark as checked in for today
      localStorage.setItem("lastDailyCheckin", new Date().toDateString());

      // Refresh points after reward
      setTimeout(() => {
        refreshPoints();
      }, 1000);
    };

    window.addEventListener("dailyCheckinReward", handleCheckinReward);

    return () => {
      window.removeEventListener("dailyCheckinReward", handleCheckinReward);
    };
  }, [refreshPoints]);

  // Handle manual check-in button click
  const handleCheckIn = () => {
    if (!user || isCheckedIn) {
      return;
    }

    // Send check-in request via WebSocket using user's email instead of wallet
    const success = pointsService.sendMessage({
      type: "checkin",
      user_email: user.email,
    });

    if (!success) {
      // If WebSocket is not available, try API endpoint
      performApiCheckin();
    }
  };

  // Fallback API check-in
  const performApiCheckin = async () => {
    try {
      // Games endpoints disabled until live
      console.log("Daily check-in API disabled - games not live yet");
      setError("Daily check-in feature will be available when games go live");
      setIsLoading(false);
      return;

      // Try multiple API endpoints as fallback
      const apiUrls = [
        // "https://eat.edgevideo.com:8080/checkin",
        // "https://gaimify.edgevideo.com/checkin",
      ];

      for (const url of apiUrls) {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_email: user.email,
            }),
          });

          if (response.ok) {
            const data = await response.json();

            if (data.success) {
              setRewardData({
                days: data.days || 1,
                value: data.value || 10,
                total: data.total || data.value || 10,
              });

              setShowModal(true);
              setIsCheckedIn(true);
              localStorage.setItem(
                "lastDailyCheckin",
                new Date().toDateString()
              );

              setTimeout(() => {
                refreshPoints();
              }, 1000);
              return; // Success, exit the function
            }
          }
        } catch (err) {
          console.warn(`Check-in failed for ${url}:`, err);
          continue; // Try next URL
        }
      }

      throw new Error("All check-in endpoints failed");
    } catch (error) {
      console.error("Daily check-in failed:", error);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setRewardData(null);
  };

  // Don't show if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Check-in Button */}
      <button
        className={`daily-checkin-btn ${isCheckedIn ? "checked-in" : ""}`}
        onClick={handleCheckIn}
        disabled={isCheckedIn}
        title={
          isCheckedIn ? "Already checked in today" : "Claim your daily reward"
        }
      >
        <svg
          className="checkin-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {isCheckedIn ? (
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          ) : (
            <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-5 14l-5-5 1.41-1.41L14 15.17l7.59-7.59L23 9l-9 9z" />
          )}
        </svg>

        <span className="checkin-text">
          {isCheckedIn ? "Checked In!" : "Daily Check-In"}
        </span>
      </button>

      {/* Reward Modal */}
      {showModal && rewardData && (
        <div className="checkin-modal-overlay" onClick={closeModal}>
          <div className="checkin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkin-modal-header">
              <h3>Daily Check-In Reward! 🎉</h3>
              <button className="checkin-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="checkin-modal-content">
              <div className="checkin-reward-info">
                <div className="checkin-days">
                  <span className="checkin-label">Days in a row:</span>
                  <span className="checkin-value">{rewardData.days}</span>
                </div>

                <div className="checkin-earned">
                  <span className="checkin-label">Points earned:</span>
                  <span className="checkin-value">+{rewardData.value}</span>
                </div>

                <div className="checkin-total">
                  <span className="checkin-label">Total earned:</span>
                  <span className="checkin-value">{rewardData.total}</span>
                </div>
              </div>

              <div className="checkin-message">
                Come back tomorrow for another reward!
              </div>

              <button className="checkin-modal-btn" onClick={closeModal}>
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
