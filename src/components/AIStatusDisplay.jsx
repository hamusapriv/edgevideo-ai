// src/components/AIStatusDisplay.jsx
import React from "react";
import { useAIStatus } from "../contexts/AIStatusContext";
import { useTypingAnimation } from "../hooks/useTypingAnimation";

export default function AIStatusDisplay() {
  const { shoppingAIStatus } = useAIStatus();

  // Safety check for AI status
  const safeAIStatus = React.useMemo(() => {
    if (!shoppingAIStatus || typeof shoppingAIStatus !== "string") {
      return "Ready";
    }
    return shoppingAIStatus;
  }, [shoppingAIStatus]);

  // Fast typing animation: 1s for any status
  const typingSpeed = React.useMemo(() => {
    if (!safeAIStatus || safeAIStatus.length === 0) return 50;
    return Math.max(20, Math.floor(1000 / safeAIStatus.length));
  }, [safeAIStatus]);

  const { displayedText, isTyping } = useTypingAnimation(
    safeAIStatus,
    typingSpeed
  );

  const statusKey = React.useMemo(() => safeAIStatus, [safeAIStatus]);

  // Safe text rendering with fallback
  const renderText = React.useMemo(() => {
    try {
      if (!displayedText || typeof displayedText !== "string") {
        return "Ready";
      }
      return displayedText;
    } catch (error) {
      console.warn("AIStatusDisplay text rendering error:", error);
      return "Ready";
    }
  }, [displayedText]);

  return (
    <div className="ai-status-container">
      <div className="ai-status-dot"></div>
      <div
        style={{
          color: "#ffffff",
          fontSize: "1rem",
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: "0.05rem",
          whiteSpace: "nowrap",
        }}
      >
        AI Status
      </div>
      <div className="ai-status-indicator">
        <span
          id="aiStatusTextShopping"
          className="ai-status-text"
          key={statusKey}
        >
          {renderText}
          <span className="typing-cursor"></span>
        </span>
      </div>
    </div>
  );
}
