// src/components/BuildInfo.jsx
import React from "react";

export default function BuildInfo() {
  // Access build-time constants injected by Vite with safe fallbacks
  const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0";
  const commitHash =
    typeof __COMMIT_HASH__ !== "undefined" ? __COMMIT_HASH__ : "dev";
  const branch = typeof __BRANCH__ !== "undefined" ? __BRANCH__ : "main";
  const buildTime =
    typeof __BUILD_TIME__ !== "undefined"
      ? __BUILD_TIME__
      : new Date().toISOString();

  // Format build time to show relative time or short format
  const formatBuildTime = (isoString) => {
    try {
      const buildDate = new Date(isoString);
      const now = new Date();
      const diffMs = now - buildDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays}d ago`;
      } else if (diffHours > 0) {
        return `${diffHours}h ago`;
      } else {
        return "now";
      }
    } catch {
      return "unknown";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        fontSize: "10px",
        padding: "2px 4px",
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "#fff",
        zIndex: 9999,
        fontFamily: "monospace",
      }}
      title={`Build: ${buildTime}\nBranch: ${branch}\nCommit: ${commitHash}`}
    >
      v{version} - {commitHash} - {formatBuildTime(buildTime)}
    </div>
  );
}
