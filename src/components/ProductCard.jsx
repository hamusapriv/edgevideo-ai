import React, { useEffect, useState } from "react";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import SvgFrame from "./svgs/SvgFrame";

export default function ProductCard({ product, showDetails = false, onSelect }) {
  const hidden = showDetails ? {} : { display: "none" };
  const [animateFrame, setAnimateFrame] = useState(false);

  useEffect(() => {
    if (!showDetails) {
      setAnimateFrame(false);
    }
  }, [showDetails]);

  if (!product) return null;

  const {
    id,
    title,
    image,
    back_image: backImage,
    explanation,
    matchType,
    logo_url: logoUrl,
    price,
    currency,
    link,
  } = product;

  return (
    <div className={`item-container${showDetails ? " show-details" : ""}`} onClick={onSelect}>
      <div className="live-image-container">
        <img data-role="product-image" src={image} alt="Product" loading="lazy" />
      </div>
      <div className="card-details live-details" style={showDetails ? {} : { display: "none" }}>
        <div data-role="product-name" style={{ ...hidden }}>
          {title}
        </div>
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
              AI <span data-role="matchText" style={{ ...hidden }}>{matchType}</span>
            </span>
            <button
              data-role="frame-toggle"
              onClick={(e) => {
                e.stopPropagation();
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
            style={{ ...hidden, fontSize: "0.85rem", color: "#ddd", whiteSpace: "normal" }}
          >
            {explanation}
          </p>
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
            transition: "opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease",
          }}
        >
          <img className="live-frame-image" data-role="frame-image" src={backImage} alt="" />
        </div>
        <p
          data-role="product-price-container"
          style={{
            display: price ? "flex" : "none",
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
          <span data-role="product-price" style={{ padding: "0", fontSize: "0.9rem", color: "#fff" }}>
            {price} {currency}
          </span>{" "}
        </p>
        <div className="product-buttons-container">
          <a
            data-role="product-link"
            href={link}
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
            onClick={(e) => e.stopPropagation()}
          >
            <p>Shop On</p>
            <img
              data-role="vendor-logo"
              src={logoUrl}
              alt="Vendor Logo"
              style={{ width: "auto", height: "24px", borderRadius: "6px", backgroundColor: "white" }}
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
            <LikeButton itemId={id} />
            <DislikeButton itemId={id} />
            <ShareButton title={title} url={link} />
          </div>
        </div>
      </div>
    </div>
  );
}
