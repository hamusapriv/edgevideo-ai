import React from "react";
import { useProducts } from "../contexts/ProductsContext";

export default function FrameGallery() {
  const { products } = useProducts();
  return (
    <div className="ai-frame-gallery">
      {products.map((p) =>
        p.back_image ? (
          <img key={p.id} src={p.back_image} alt={`Frame for ${p.title}`} />
        ) : null
      )}
    </div>
  );
}
