import React from "react";

export default function SandboxPage() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Page Title */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          color: "white",
          fontSize: "24px",
          fontWeight: "bold",
          textAlign: "center",
          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        EdgeVideo AI - 3D Frame Sandbox
      </div>

      {/* Back to Home Button */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 100,
        }}
      >
        <a
          href="/home"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            textDecoration: "none",
            borderRadius: "25px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
          }}
        >
          ← Back to Home
        </a>
      </div>

      {/* 3D Sandbox Placeholder */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "white",
          zIndex: 50,
        }}
      >
        <div
          style={{
            fontSize: "48px",
            marginBottom: "20px",
            opacity: 0.8,
          }}
        >
          🎨
        </div>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>
          3D Sandbox
        </h2>
        <p style={{ margin: 0, fontSize: "16px", opacity: 0.8 }}>
          Interactive 3D components and demos
        </p>
      </div>
    </div>
  );
}
