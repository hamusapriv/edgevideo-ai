// src/components/BuildInfo.jsx
import React from "react";
import pkg from "../../package.json";

export default function BuildInfo() {
  console.log("Build loaded 🎉", __COMMIT_HASH__);
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
      v{pkg.version} - {__COMMIT_HASH__} - {Math.random().toString().slice(0, 6)}
    </div>
  );
}
