import React from "react";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";

export default function ProductCard({ isP0, showDetails = false }) {
  const hidden = showDetails ? {} : { display: "none" };

  return (
    <div
      className={`item-container ${isP0 ? "product0" : ""} ${showDetails ? "show-details" : ""}`}
    >
      <img data-role="product-image" src={null} alt="Product Image" loading="lazy" />
      <img className="frame-image" data-role="frame-image" src={null} alt="" />
      <a data-role="product-link" href="" style={hidden}></a>
      <div className="card-details live-details" style={showDetails ? {} : { display: "none" }}>
        <div
          data-role="matchText"
          style={{ ...hidden, padding: "8px", fontSize: "1rem", fontWeight: "bold" }}
        />
        <img data-role="vendor-logo" src={null} alt="Vendor Logo" style={hidden} />
        <div
          data-role="product-name"
          style={{ ...hidden, padding: "8px", fontSize: "1rem", fontWeight: "bold" }}
        />
        <div
          data-role="product-price"
          style={{ ...hidden, padding: "4px 8px", fontSize: "0.9rem", color: "#aaf" }}
        />
        <div
          data-role="ai-description"
          className="ai-query"
          style={{ ...hidden, padding: "8px", fontSize: "0.85rem", color: "#ddd" }}
        />
        <div
          className="info-button"
          style={{
            ...hidden,
            position: "absolute",
            top: 8,
            right: 8,
            color: "#fff",
            fontSize: "1.2rem",
          }}
        >
          &#9432;
        </div>
        <div
          style={{
            ...hidden,
            flex: 1,
            justifyContent: "space-around",
            padding: "8px 0",
          }}
        >
          <LikeButton />
          <DislikeButton />
          <ShareButton />
        </div>
      </div>
    </div>
  );
}
