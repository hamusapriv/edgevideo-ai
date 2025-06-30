import React from "react";
import { useProducts } from "../contexts/ProductsContext";

export default function FrameGallery({ selectedId }) {
  const { products } = useProducts();
  return (
    <div className="ai-frame-gallery">
      {products.map((p) =>
        p.back_image ? (
          <div
            style={{ position: "relative" }}
            key={p.id}
            className={`frame-gallery-item ${
              selectedId === p.id ? " focused" : ""
            }`}
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
                background: "rgba(0, 0, 0, 0.5)",
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
}
