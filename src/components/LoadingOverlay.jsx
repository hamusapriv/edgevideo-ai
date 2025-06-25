import React from "react";
import "../styles/loading.css";

export default function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  );
}
