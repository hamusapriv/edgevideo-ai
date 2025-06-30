import React from "react";
import { useProducts } from "../contexts/ProductsContext";

export default function FrameGallery() {
  const { products } = useProducts();
  return (
    <div className="ai-frame-gallery">
      {products.map((p) =>
        p.back_image ? (
          <div
            style={{
              minWidth: "160px",
              width: "160px",
              height: "90px",
              minHeight: "90px",
            }}
            key={p.id}
          >
            <img
              style={{
                width: "100%",
                height: "100%",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
              key={p.id}
              src={p.back_image}
              alt={`Frame for ${p.title}`}
            />
            <p
              style={{
                fontSize: "0.8rem",
                color: "#fff",
                textAlign: "center",
                marginTop: "4px",
              }}
            >
              {p.description || "No description available"}
            </p>
          </div>
        ) : null
      )}
    </div>
  );
}
