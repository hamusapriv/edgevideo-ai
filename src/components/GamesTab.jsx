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
    <div className="tab-content-container games-tab">
      "Games Are Coming Soon!"
    </div>
  );
}
