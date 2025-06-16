import React from "react";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";

export default function ProductCard({ isP0 }) {
  return (
    <div className={`item-container ${isP0 ? "product0" : ""}`}> 
      <img data-role="product-image" src="" alt="Product Image" loading="lazy" />
      <img className="frame-image" data-role="frame-image" src="" alt="" />
      <a data-role="product-link" href="" style={{ display: "none" }} />
      <div
        data-role="matchText"
        style={{ display: "none", padding: "8px", fontSize: "1rem", fontWeight: "bold" }}
      />
      <img
        data-role="vendor-logo"
        src=""
        alt="Vendor Logo"
        style={{ display: "none" }}
      />
      <div
        data-role="product-name"
        style={{ display: "none", padding: "8px", fontSize: "1rem", fontWeight: "bold" }}
      />
      <div
        data-role="product-price"
        style={{ display: "none", padding: "4px 8px", fontSize: "0.9rem", color: "#aaf" }}
      />
      <div
        data-role="ai-description"
        className="ai-query"
        style={{ display: "none", padding: "8px", fontSize: "0.85rem", color: "#ddd" }}
      />
      <div
        className="info-button"
        style={{ display: "none", position: "absolute", top: 8, right: 8, color: "#fff", fontSize: "1.2rem" }}
      >
        &#9432;
      </div>
      <div style={{ display: "none", flex: 1, justifyContent: "space-around", padding: "8px 0" }}>
        <LikeButton />
        <DislikeButton />
        <ShareButton />
      </div>
    </div>
  );
}
