import React, { useEffect, useRef, useState } from "react";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import { FormatPrice } from "../legacy/modules/productsModule";
import {
  handleImageErrorWithPlaceholder,
  isValidImageUrl,
  validateImageThoroughly,
  isProblematicImageService,
  preloadImage,
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
  onImageError = null,
}) {
  const itemContainerRef = useRef(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [imageValidated, setImageValidated] = useState(false);

  if (!product) return null;

  // Validate image on component mount
  useEffect(() => {
    if (!product.image || !isValidImageUrl(product.image)) {
      setImageLoadFailed(true);
      if (onImageError) {
        onImageError(product.id, "Invalid image URL");
      }
      return;
    }

    // Use thorough validation for problematic services, regular preload for others
    const validationMethod = isProblematicImageService(product.image)
      ? validateImageThoroughly
      : preloadImage;

    validationMethod(product.image)
      .then((isValid) => {
        if (!isValid) {
          console.warn(
            `Product ${product.id} image failed validation, hiding product`
          );
          setImageLoadFailed(true);
          if (onImageError) {
            onImageError(product.id, "Image failed to load");
          }
        } else {
          setImageValidated(true);
        }
      })
      .catch((error) => {
        console.error(
          `Error validating image for product ${product.id}:`,
          error
        );
        setImageLoadFailed(true);
        if (onImageError) {
          onImageError(product.id, "Image validation error");
        }
      });
  }, [product.image, product.id, onImageError]);

  // Apply product type styling when component mounts or product changes
  useEffect(() => {
    const itemContainer = itemContainerRef.current;

    if (!itemContainer) {
      console.error("❌ itemContainer ref is null - cannot apply styling");
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

  // Handle product link clicks
  const handleProductClick = (e) => {
    if (!product.link) return;

    // Prevent default to allow tracking before navigation
    e.preventDefault();
    const transformedLink = transformToGeniusLink(product.link);
    trackOutboundLink(transformedLink, itemTypeName, product.id);
    window.open(transformedLink, "_blank");
  };

  // Image error handlers using your utility
  const handleProductImageError = (e) => {
    console.warn(`Product ${product.id} image failed to load, hiding product`);
    setImageLoadFailed(true);
    if (onImageError) {
      onImageError(product.id, "Image error in component");
    }
    // Hide the entire product card when image fails
    e.target.style.display = "none";
  };

  const handleVendorImageError = (e) => {
    e.target.style.display = "none";
  };

  // Don't render the product at all if image validation failed
  if (imageLoadFailed) {
    return null;
  }

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
          product.link ? (
            <a
              href={transformToGeniusLink(product.link)}
              onClick={handleProductClick}
              aria-label={`View product: ${product.title}`}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                cursor: "pointer",
              }}
            >
              <img
                data-role="product-image"
                src={product.image}
                alt={product.title}
                loading="lazy"
                onError={handleProductImageError}
                style={{ width: "100%", height: "100%" }}
              />
            </a>
          ) : (
            <img
              data-role="product-image"
              src={product.image}
              alt={product.title}
              loading="lazy"
              onError={handleProductImageError}
            />
          )
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
          {product.link ? (
            <a
              href={transformToGeniusLink(product.link)}
              onClick={handleProductClick}
              aria-label={`View product: ${product.title}`}
              style={{
                color: "inherit",
                textDecoration: "none",
                cursor: "pointer",
                display: "block",
              }}
            >
              {product.title}
            </a>
          ) : (
            product.title
          )}
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
                trackOutboundLink(transformedLink, itemTypeName, product.id);
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
              <p>View Product</p>
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
