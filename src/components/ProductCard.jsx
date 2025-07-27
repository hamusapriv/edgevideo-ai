import React, { useEffect, useRef } from "react";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import { FormatPrice } from "../legacy/modules/productsModule";
import {
  handleImageErrorWithPlaceholder,
  isValidImageUrl,
} from "../utils/imageValidation";
import {
  applyProductTypeStyles,
  addClassToAll,
  removeClassFromAll,
} from "../utils/classUtils";
import {
  transformToGeniusLink,
  trackOutboundLink,
} from "../utils/linkTransform";

export default function ProductCard({
  product,
  showDetails = false,
  focused = false,
  extraClass = "",
  onMouseEnter,
}) {
  const itemContainerRef = useRef(null);

  if (!product) return null;

  // Apply product type styling when component mounts or product changes
  useEffect(() => {
    const itemContainer = itemContainerRef.current;

    if (!itemContainer) {
      console.error("❌ itemContainer ref is null - cannot apply styling");
      return;
    }

    if (!product || !product.type) {
      console.warn("❌ No product or product.type - cannot apply styling");
      return;
    }

    // Apply styling based on product type (to children only, since main class is handled by React)
    if ("type" in product && product.type === "ticket") {
      // Apply to all child elements only
      const children = itemContainer.querySelectorAll("*");
      children.forEach((child) => {
        child.classList.remove("coupon-style");
        child.classList.add("ticket-style");
      });
    } else if ("type" in product && product.type === "deal") {
      // Apply to all child elements only
      const children = itemContainer.querySelectorAll("*");
      children.forEach((child) => {
        child.classList.remove("ticket-style");
        child.classList.add("coupon-style");
      });
    } else {
      // Remove from all child elements
      const children = itemContainer.querySelectorAll("*");
      children.forEach((child) => {
        child.classList.remove("ticket-style");
        child.classList.remove("coupon-style");
      });
    }
  }, [product.type, product.id]);

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

  // Determine the product type class for the main container
  const getProductTypeClass = () => {
    if (product?.type === "ticket") return "ticket-style";
    if (product?.type === "deal") return "coupon-style";
    return "";
  };

  return (
    <div
      ref={itemContainerRef}
      className={`item-container ${
        focused ? "focused" : ""
      } ${getProductTypeClass()} ${extraClass}`}
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
              href={transformToGeniusLink(product.link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                // Prevent default to allow tracking before navigation
                e.preventDefault();
                const transformedLink = transformToGeniusLink(product.link);
                trackOutboundLink(transformedLink, itemTypeName);
                window.open(transformedLink, "_blank");
              }}
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
