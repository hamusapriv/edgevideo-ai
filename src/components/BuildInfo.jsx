// src/components/BuildInfo.jsx
import React from "react";

export default function BuildInfo() {
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
      }}
    >
      v0.0.6 - - 0.5721
    </div>
  );
}
