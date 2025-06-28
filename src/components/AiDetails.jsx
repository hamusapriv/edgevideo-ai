import React from "react";

export default function AiDetails({ data }) {
  if (!data) return null;
  return (
    <div className="ai-details-panel">
      {data.matchText && (
        <div style={{ fontSize: "1rem", fontWeight: "600", color: "#fff" }}>
          AI {data.matchText}
        </div>
      )}
      {data.description && <p style={{ color: "#ddd" }}>{data.description}</p>}
      {data.frameImageUrl && (
        <div
          className="live-frame-image-container"
          style={{
            overflow: "hidden",
            aspectRatio: "16/9",
            maxWidth: "calc(200px * 16 / 9)",
            width: "fit-content",
            maxHeight: "200px",
            objectFit: "cover",
            borderRadius: "8px",
          }}
        >
          <img
            src={data.frameImageUrl}
            alt={`Frame for ${data.name}`}
            className="live-frame-image"
          />
        </div>
      )}
    </div>
  );
}
