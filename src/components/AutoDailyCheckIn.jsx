// src/components/AutoDailyCheckIn.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePoints } from "../contexts/PointsContext";
import pointsService from "../services/pointsService";
import "../styles/dailyCheckIn.css";
import "../utils/checkinDebug"; // Import debug utilities

export default function AutoDailyCheckIn() {
  const { user } = useAuth();
  const { refreshPoints } = usePoints();

  const [showModal, setShowModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  // Listen for daily check-in rewards from automatic check-in
  useEffect(() => {
    const handleCheckinReward = (event) => {
      console.log(
        "🎉 AutoDailyCheckIn: Received dailyCheckinReward event",
        event.detail
      );

      const { days, value, total } = event.detail;

      setRewardData({
        days: days || 1,
        value: value || 100,
        total: total || value || 100,
      });

      setShowModal(true);

      // Mark as checked in for today using UTC date
      localStorage.setItem(
        "lastDailyCheckin",
        new Date().toISOString().split("T")[0]
      );

      // Store the streak days for the status component
      localStorage.setItem("dailyCheckinStreak", (days || 1).toString());

      // Refresh points after reward
      setTimeout(() => {
        refreshPoints();
      }, 1000);
    };

    // Only add listener if user is authenticated
    if (user) {
      window.addEventListener("dailyCheckinReward", handleCheckinReward);
      console.log(
        "AutoDailyCheckIn: Event listener registered for dailyCheckinReward"
      );
    }

    return () => {
      if (user) {
        window.removeEventListener("dailyCheckinReward", handleCheckinReward);
        console.log("AutoDailyCheckIn: Event listener removed");
      }
    };
  }, [refreshPoints, user]); // Added user as dependency to prevent multiple registrations

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setRewardData(null);
  };

  // Auto-close modal after 10 seconds
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        closeModal();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showModal]);

  // Don't render anything if user is not authenticated (component is invisible)
  if (!user) {
    return null;
  }

  // Only render the reward modal when needed - no visible UI otherwise
  return (
    <>
      {/* Reward Modal - only shows when check-in reward is received */}
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
