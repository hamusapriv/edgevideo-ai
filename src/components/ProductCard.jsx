import React, { useEffect, useState } from "react";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import SvgFrame from "./svgs/SvgFrame";

export default function ProductCard({ isP0, showDetails = false }) {
  const hidden = showDetails ? {} : { display: "none" };
  const [animateFrame, setAnimateFrame] = useState(false);

  // collapse the frame when details hide
  useEffect(() => {
    if (!showDetails) {
      setAnimateFrame(false);
    }
  }, [showDetails]);

  return (
    <div
      className={`item-container ${isP0 ? "product0" : ""} ${
        showDetails ? "show-details" : ""
      }`}
    >
      <div className="live-image-container">
        <img
          data-role="product-image"
          src={null}
          alt="Product Image"
          loading="lazy"
        />
      </div>
      <div
        className="card-details live-details"
        style={showDetails ? {} : { display: "none" }}
      >
        <div
          data-role="product-name"
          style={{
            ...hidden,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "0.95rem",
            lineHeight: "1.4",
            color: "#ddd",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#fff",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              AI{" "}
              <span
                data-role="matchText"
                style={{
                  ...hidden,
                }}
              />
            </span>
            {/* Inline toggle */}
            <button
              data-role="frame-toggle"
              onClick={() => {
                setAnimateFrame((prev) => !prev);
              }}
              style={{
                display: "inline-flex",
                padding: 0,
                marginLeft: "4px",
                border: "none",
                background: "transparent",
                color: "#4fa",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              <SvgFrame style={{ marginRight: "4px", flexShrink: 0 }} />
              <span data-role="toggle-text">
                {animateFrame ? "Hide Frame" : "Show Frame"}
              </span>
            </button>
          </div>
          <p
            data-role="ai-description"
            className="ai-query"
            style={{
              ...hidden,
              fontSize: "0.85rem",
              color: "#ddd",
              whiteSpace: "normal",
            }}
          />
        </div>
        <div
          className="live-frame-image-container"
          data-role="frame-container"
          style={{
            overflow: "hidden",
            aspectRatio: "16/9",
            maxWidth: "calc(200px * 16 / 9)",
            width: "fit-content",
            maxHeight: animateFrame ? "200px" : "0px",
            objectFit: "cover",
            borderRadius: "8px",
            opacity: animateFrame ? 1 : 0,
            transform: animateFrame ? "translateY(0)" : "translateY(-20px)",
            transition:
              "opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease",
          }}
        >
          <img
            className="live-frame-image"
            data-role="frame-image"
            src={null}
            alt=""
          />
        </div>

        <p
          data-role="product-price-container"
          style={{
            display: "none",
            fontSize: "1rem",
            color: "#fff",
            justifyContent: "flex-start",
            alignItems: "center",
            lineHeight: "1.4rem",
            gap: ".5rem",
          }}
        >
          <span
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#aaf",
            }}
          >
            Price:
          </span>
          <span
            data-role="product-price"
            style={{
              ...hidden,
              padding: "0",
              fontSize: "0.9rem",
              color: "#fff",
            }}
          />{" "}
        </p>

        {/*=========================== */}
        <div className="product-buttons-container">
          {/* Shop Now */}
          <a
            data-role="product-link"
            href=""
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...hidden,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              background: "var(--color-primary)",
              color: "#fff",
              textAlign: "center",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "0.95rem",
              fontWeight: "bold",
            }}
          >
            <p>Shop On</p>
            {/* (d) VENDOR LOGO (if present) */}
            <img
              data-role="vendor-logo"
              src={null}
              alt="Vendor Logo"
              style={{
                width: "auto",
                height: "24px",
                borderRadius: "6px",
                backgroundColor: "white",
              }}
            />
          </a>

          <div
            style={{
              ...hidden,
              display: "flex",
              gap: 16,
              justifyContent: "space-around",
            }}
          >
            <LikeButton />
            <DislikeButton />
            <ShareButton />
          </div>
        </div>

        {/*====== Below are to be implemented up */}
      </div>
    </div>
  );
}
