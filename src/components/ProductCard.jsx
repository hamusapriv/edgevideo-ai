import React from "react";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import { FormatPrice } from "../legacy/modules/productsModule";
import {
  handleImageErrorWithPlaceholder,
  isValidImageUrl,
} from "../utils/imageValidation";

export default function ProductCard({
  product,
  showDetails = false,
  focused = false,
  extraClass = "",
  onMouseEnter,
}) {
  if (!product) return null;

  const hidden = showDetails ? {} : { display: "none" };
  const itemTypeName =
    product.type === "ticket"
      ? product.link?.toLowerCase().includes("viator")
        ? "Viator Ticket"
        : "DB Ticket"
      : product.type === "deal"
      ? "Deal"
      : "DB Product";
  const price = product.price
    ? FormatPrice(product.price, product.currency || "USD")
    : "";
  const vendorLogo = product.domain_url
    ? `https://s2.googleusercontent.com/s2/favicons?domain=${product.domain_url}&sz=64`
    : product.logo_url || "";

  // Image error handlers using your utility
  const handleProductImageError = (e) => {
    handleImageErrorWithPlaceholder(
      e,
      product.image,
      "https://via.placeholder.com/150x150?text=No+Image"
    );
  };

  const handleVendorImageError = (e) => {
    e.target.style.display = "none";
  };

  return (
    <div
      className={`item-container ${focused ? "focused" : ""} ${extraClass}`}
      data-product-id={product.id}
      onMouseEnter={onMouseEnter}
    >
      <div className="live-image-container">
        {isValidImageUrl(product.image) ? (
          <img
            data-role="product-image"
            src={product.image}
            alt={product.title}
            loading="lazy"
            onError={handleProductImageError}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
              color: "#666",
              fontSize: "12px",
            }}
          >
            No Image Available
          </div>
        )}
        {vendorLogo && (
          <img
            data-role="vendor-logo"
            src={vendorLogo}
            alt="Vendor Logo"
            onError={handleVendorImageError}
            style={{
              position: "absolute",
              top: "4px",
              left: "4px",

              width: "auto",
              height: "24px",
              borderRadius: "6px",
              backgroundColor: "white",
            }}
          />
        )}
      </div>
      <div
        className="card-details"
        style={showDetails ? {} : { display: "none" }}
      >
        <div data-role="product-name" style={hidden}>
          {product.title}
        </div>
        {price && (
          <p
            data-role="product-price-container"
            style={{
              display: "flex",
              fontSize: "1rem",
              color: "#fff",
              justifyContent: "flex-start",
              alignItems: "center",
              lineHeight: "1.4rem",
              gap: ".5rem",
            }}
          >
            <span
              style={{ fontSize: "1rem", fontWeight: "600", color: "#aaf" }}
            >
              Price:
            </span>
            <span
              data-role="product-price"
              style={{ padding: "0", fontSize: "0.9rem", color: "#fff" }}
            >
              {price}
            </span>
          </p>
        )}
        <div className="product-buttons-container">
          {product.link && (
            <a
              data-role="product-link"
              href={product.link}
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
              <p>Buy Now</p>
            </a>
          )}
          <div
            style={{
              ...hidden,
              display: "flex",
              gap: 16,
              justifyContent: "space-around",
            }}
          >
            <LikeButton itemId={product.id} itemTypeName={itemTypeName} />
            <DislikeButton itemId={product.id} itemTypeName={itemTypeName} />
            <ShareButton title={product.title} url={product.link} />
          </div>
        </div>
      </div>
    </div>
  );
}
