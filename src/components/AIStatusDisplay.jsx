// src/components/AIStatusDisplay.jsx
import React from "react";
import { useAIStatus } from "../contexts/AIStatusContext";
import { useTypingAnimation } from "../hooks/useTypingAnimation";

export default function AIStatusDisplay() {
  const { shoppingAIStatus } = useAIStatus();
  // Fast typing animation: 1s for any status
  const typingSpeed = React.useMemo(() => {
    if (!shoppingAIStatus || shoppingAIStatus.length === 0) return 50;
    return Math.max(20, Math.floor(1000 / shoppingAIStatus.length));
  }, [shoppingAIStatus]);
  const { displayedText, isTyping } = useTypingAnimation(
    shoppingAIStatus,
    typingSpeed
  );
  const statusKey = React.useMemo(() => shoppingAIStatus, [shoppingAIStatus]);

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
          <React.Fragment>{displayedText}</React.Fragment>
          <span className="typing-cursor"></span>
        </span>
      </div>
    </div>
  );
}
