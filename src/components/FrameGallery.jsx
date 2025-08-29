import React, { forwardRef } from "react";
import { useProducts } from "../contexts/ProductsContext";
import { handleImageErrorWithPlaceholder } from "../utils/imageValidation";

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
        p.back_image ? (
          <div
            className={`frame-gallery-item frame-gallery-container${
              String(selectedId) === String(p.id) ? " focused" : ""
            }${p._status ? ` ${p._status}` : ""}`}
            key={p.id}
          >
            <img
              className="frame-gallery-image"
              src={p.back_image}
              alt={`Frame for ${p.title}`}
              onError={(e) => handleFrameImageError(e, p.back_image)}
            />
            <div className="frame-gallery-overlay">
              {p.matchType && (
                <p className="frame-gallery-match-type">AI {p.matchType}</p>
              )}
              {p.explanation && (
                <p className="frame-gallery-explanation">{p.explanation}</p>
              )}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
});

export default FrameGallery;
