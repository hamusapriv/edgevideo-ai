// src/components/PointsDisplay.jsx
import React from "react";
import { usePoints } from "../contexts/PointsContext";
import { useAuth } from "../contexts/AuthContext";
import "../styles/points.css";

export default function PointsDisplay({
  className = "",
  showLabel = true,
  size = "normal",
  onClick = null,
}) {
  const { user } = useAuth();
  const { points, loading, error, formatPoints, refreshPoints } = usePoints();

  // Don't show if user is not authenticated
  if (!user) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (!loading) {
      refreshPoints();
    }
  };

  return (
    <div
      className={`points-display ${className} points-${size} ${
        onClick || !loading ? "clickable" : ""
      }`}
      onClick={handleClick}
      title={
        onClick
          ? "Click for options"
          : loading
          ? "Loading..."
          : "Click to refresh"
      }
    >
      {showLabel && <span className="points-label">Points</span>}

      <div className="points-value-container">
        <span className="points-value">
          {loading ? "..." : formatPoints(points)}
        </span>

        {!loading && (
          <svg
            className="points-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )}
      </div>

      {error && (
        <div className="points-error" title={error}>
          ⚠️
        </div>
      )}
    </div>
  );
}
