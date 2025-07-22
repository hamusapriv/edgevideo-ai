import React, { useEffect, useState } from "react";
import "../styles/demoProductWidget.css";
import { downloadProduct } from "../utils/downloadProduct";

export default function DemoProductWidget({ onClose, channelName }) {
  const [liveProducts, setLiveProducts] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for new products from the productsModule
    function handleNewProduct(event) {
      const product = event.detail;
      if (!product) return;

      setLiveProducts((prev) => {
        // Check if product already exists
        if (prev.some((p) => p.id === product.id)) return prev;

        // Add new product to the beginning, keep max 10 products
        const updated = [product, ...prev].slice(0, 10);
        return updated;
      });

      // Show widget when first product arrives
      if (!isVisible) {
        setIsVisible(true);
      }
    }

    // Add event listener for new products
    window.addEventListener("new-product", handleNewProduct);

    // Show widget after a short delay for demo purposes
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => {
      window.removeEventListener("new-product", handleNewProduct);
      clearTimeout(timer);
    };
  }, [isVisible]);

  const handleDownload = async (product) => {
    await downloadProduct(product);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`demo-product-widget ${isVisible ? "visible" : ""}`}>
      <div className="widget-header"> Live Shopping Demo Experience</div>

      <div className="widget-content">
        <div className="products-list">
          {liveProducts.length > 0 ? (
            liveProducts.map((product, index) => (
              <div key={product.id || index} className="demo-product-card">
                <div className="demo-product-main">
                  <div className="demo-product-image">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title || "Product"}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span>?</span>
                        <small>No image</small>
                      </div>
                    )}
                  </div>
                  <div className="demo-product-info">
                    <h4 className="demo-product-name">
                      {product.title || product.name || "Unknown Product"}
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      {" "}
                      <button
                        className="demo-download-button"
                        title="Download product markup as JSON"
                        onClick={() => handleDownload(product)}
                      >
                        ↓
                      </button>
                      <div className="demo-product-price">
                        {product.price ? `$${product.price}` : ""}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Frame Section */}
                <div className="demo-ai-frame">
                  <img
                    alt={`AI Frame for ${product.title || "Product"}`}
                    className="demo-ai-frame-image"
                    src={
                      product.frame_url ||
                      product.back_image ||
                      "/assets/main-frame.png"
                    }
                  />
                  <div className="demo-ai-frame-content">
                    {/* Match Type */}
                    {product.matchType && (
                      <div className="demo-match-text">
                        <p>AI {product.matchType}</p>
                      </div>
                    )}

                    {/* AI Explanation */}
                    <div className="demo-ai-description">
                      <p>
                        {product.explanation ||
                          product.description ||
                          `Detected ${product.title ||
                            product.name ||
                            "product"} in video stream.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
              </div>
            ))
          ) : (
            <div className="no-products">
              <p>No products detected yet...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
