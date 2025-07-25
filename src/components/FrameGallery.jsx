import React, { forwardRef } from "react";
import { useProducts } from "../contexts/ProductsContext";
import {
  handleImageErrorWithPlaceholder,
  isValidImageUrl,
} from "../utils/imageValidation";

const FrameGallery = forwardRef(function FrameGallery(
  { selectedId, items },
  ref
) {
  const { products } = useProducts();
  const frames = items || products;

  const handleFrameImageError = (e, imageUrl) => {
    handleImageErrorWithPlaceholder(e, imageUrl, null);
    // Hide frame when image fails
    e.target.parentElement.style.display = "none";
  };

  return (
    <div className="ai-frame-gallery" ref={ref}>
      {frames.map((p) =>
        p.back_image && isValidImageUrl(p.back_image) ? (
          <div
            style={{ position: "relative" }}
            key={p.id}
            className={`frame-gallery-item${
              String(selectedId) === String(p.id) ? " focused" : ""
            }${p._status ? ` ${p._status}` : ""}`}
          >
            <img
              style={{
                width: "160px",
                minWidth: "160px",
                maxHeight: "90px",
                minHeight: "90px",
                maxWidth: "100%",
                height: "90px",
                objectFit: "contain",
              }}
              key={p.id}
              src={p.back_image}
              alt={`Frame for ${p.title}`}
              onError={(e) => handleFrameImageError(e, p.back_image)}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                padding: "4px",
                left: 0,
                right: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-start",
                background: "rgba(0, 0, 0, 0.3)",
              }}
            >
              {p.matchType && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#fff",
                    marginTop: "4px",
                    maxWidth: "160px",
                    whiteSpace: "normal",
                  }}
                >
                  AI {p.matchType}
                </p>
              )}
              {p.explanation && (
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "#fff",
                    textAlign: "left",
                    marginTop: "4px",

                    maxWidth: "160px",
                    whiteSpace: "normal",
                  }}
                >
                  {p.explanation}
                </p>
              )}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
});

export default FrameGallery;
