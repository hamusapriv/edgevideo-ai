// src/components/GamesTab.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePoints } from "../contexts/PointsContext";
import PointsDisplay from "./PointsDisplay";
import DailyCheckIn from "./DailyCheckIn";
import styles from "../styles/GamesTab.module.css";

export default function GamesTab() {
  const { user } = useAuth();
  const { points } = usePoints();

  return (
    <div className="tab-content-container">
      <div className={styles.gamesHeader}>
        <h2>Games & Rewards</h2>
        {user && (
          <div className="games-points-display">
            <PointsDisplay size="large" showLabel={true} />
          </div>
        )}
      </div>

      {!user ? (
        <div className={styles.gamesMessage}>
          <h3>🎮 Welcome to EdgeVideo Games!</h3>
          <p>Sign in to start earning points and playing games.</p>
        </div>
      ) : (
        <div className={styles.gamesContent}>
          <div className={styles.rewardsSection}>
            <h3>Daily Rewards</h3>
            <p>Don't forget to claim your daily check-in bonus!</p>
            <DailyCheckIn />
          </div>

          <div className={styles.gamesSection}>
            <h3>🎲 Interactive Games</h3>
            <p style={{ marginBottom: "1rem" }}>
              Games will appear here when live streams are active. Watch for
              polls and predictions during live events!
            </p>

            <div className={styles.gamePlaceholder}>
              <div className={styles.gameCard}>
                <h4>🔮 Live Predictions</h4>
                <p>Predict outcomes during live events and win points!</p>
                <div className={styles.gameStatus}>
                  Waiting for live stream...
                </div>
              </div>

              <div className={styles.gameCard}>
                <h4>📊 Live Polls</h4>
                <p>Participate in viewer polls and share your opinion!</p>
                <div className={styles.gameStatus}>
                  Waiting for live stream...
                </div>
              </div>
            </div>

            <div className={styles.pointsInfo}>
              <h4>💰 How to Earn Points</h4>
              <ul>
                <li>Daily check-in: Get points just for visiting!</li>
                <li>Live predictions: Bet points on outcomes</li>
                <li>Poll participation: Share your opinions</li>
                <li>Winning predictions: Earn bonus points</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
