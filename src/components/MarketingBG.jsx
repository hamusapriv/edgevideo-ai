import React from "react";
import { useMarketingTheme } from "../contexts/MarketingThemeContext";

const MarketingBG = () => {
  const { theme } = useMarketingTheme();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        zIndex: -1,
      }}
    >
      <div
        className="marketing-bg-overlay"
        style={{
          background:
            theme === "dark"
              ? "rgba(0, 0, 0, 0.3)"
              : "rgba(255, 255, 255, 0.3)",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      ></div>
      <img
        src="/assets/bg.png"
        alt="Background"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default MarketingBG;
