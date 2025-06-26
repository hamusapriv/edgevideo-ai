// src/components/LoadingOverlay.jsx
import React from "react";
import "../styles/loading.css";

export default function LoadingOverlay({ message = "" }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
}
