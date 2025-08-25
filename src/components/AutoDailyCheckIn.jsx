// src/components/AutoDailyCheckIn.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePoints } from "../contexts/PointsContext";
import pointsService from "../services/pointsService";
import "../styles/dailyCheckIn.css";

export default function AutoDailyCheckIn() {
  const { user } = useAuth();
  const { refreshPoints } = usePoints();

  const [showModal, setShowModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Check if user has already checked in today
  useEffect(() => {
    const checkTodayCheckin = () => {
      const lastCheckin = localStorage.getItem("lastDailyCheckin");
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format in UTC

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

  // Listen for daily check-in rewards from automatic check-in
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

      // Mark as checked in for today using UTC date
      localStorage.setItem(
        "lastDailyCheckin",
        new Date().toISOString().split("T")[0]
      );

      // Store the streak days for the status component
      localStorage.setItem("dailyCheckinStreak", days.toString());

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
