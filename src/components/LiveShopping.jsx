// src/components/LiveShopping.jsx
import React, { useCallback, useEffect, useState } from "react";
import ChannelLogo from "./ChannelLogo";
import ProductCard from "./ProductCard";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import SvgFrame from "./svgs/SvgFrame";
import { useProducts } from "../contexts/ProductsContext";
import { FormatPrice } from "../legacy/modules/productsModule";

export default function LiveShopping({ channelId, onLike }) {
  const { products, addProduct } = useProducts();
  const [selected, setSelected] = useState(null);
  const deviceCanHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  const toSelectedData = useCallback((p) => {
    if (!p) return null;
    const itemTypeName = p.type === "ticket"
      ? p.link?.toLowerCase().includes("viator")
        ? "Viator Ticket"
        : "DB Ticket"
      : p.type === "deal"
      ? "Deal"
      : "DB Product";
    return {
      id: p.id,
      itemTypeName,
      name: p.title,
      price: p.price ? FormatPrice(p.price, p.currency || "USD") : "",
      description: p.explanation,
      frameImageUrl: p.back_image,
      matchText: p.matchType || "",
      vendorLogoUrl: p.domain_url
        ? `https://s2.googleusercontent.com/s2/favicons?domain=${p.domain_url}&sz=64`
        : p.logo_url || "",
      productUrl: p.link,
    };
  }, []);

  useEffect(() => {
    function handler(e) {
      addProduct(e.detail);
      setSelected((cur) => cur || toSelectedData(e.detail));
    }
    window.addEventListener("new-product", handler);
    return () => window.removeEventListener("new-product", handler);
  }, [addProduct, toSelectedData]);

  useEffect(() => {
    if (!selected && products.length) {
      setSelected(toSelectedData(products[0]));
    }
  }, [products, selected, toSelectedData]);

  const handleHover = useCallback(
    (p) => {
      setSelected(toSelectedData(p));
    },
    [toSelectedData]
  );

  return (
    <div className="liveshopping-container" style={{ width: "100%" }}>
      <ChannelLogo channelId={channelId} className="channel-logo" />
      <div id="absolute-container">
        <div id="itemContent" style={{ display: "flex", gap: 16 }}>
          {products.map((p) => (
            <div key={p.id} onMouseEnter={() => handleHover(p)}>
              <ProductCard product={p} showDetails={deviceCanHover} />
            </div>
          ))}
        </div>
      </div>
      <div
        className="live-details"
        style={{ display: deviceCanHover ? "none" : "flex" }}
      >
        {selected ? (
          <>
            <h2 className="live-product-name">{selected.name}</h2>
            <p
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "0.95rem",
                lineHeight: "1.4",
                color: "#ddd",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {selected.matchText && (
                  <span
                    style={{
                      display: "inline",
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    AI {selected.matchText}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelected((s) => ({ ...s, showFrame: !s.showFrame }));
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
                  {selected.showFrame ? "Hide Frame" : "Show Frame"}
                </button>
              </span>
              {selected.description}
            </p>
            {selected.frameImageUrl && (
              <div
                className="live-frame-image-container"
                style={{
                  overflow: "hidden",
                  aspectRatio: "16/9",
                  maxWidth: "calc(200px * 16 / 9)",
                  width: "fit-content",
                  maxHeight: selected.showFrame ? "200px" : "0px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  opacity: selected.showFrame ? 1 : 0,
                  transform: selected.showFrame
                    ? "translateY(0)"
                    : "translateY(-20px)",
                  transition:
                    "opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease",
                }}
              >
                <img
                  src={selected.frameImageUrl}
                  alt={`Frame for ${selected.name}`}
                  className="live-frame-image"
                />
              </div>
            )}
            {selected.price && (
              <p
                style={{
                  fontSize: "1rem",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  lineHeight: "1.4rem",
                  gap: "1rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#aaf",
                    marginRight: "0.15rem",
                  }}
                >
                  Price:
                </span>
                {selected.price}
              </p>
            )}
            <div className="product-buttons-container">
              {selected.productUrl && (
                <a
                  href={selected.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
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
                  <p>Shop On</p>
                  {selected.vendorLogoUrl && (
                    <img
                      src={selected.vendorLogoUrl}
                      alt="Vendor Logo"
                      style={{
                        width: "auto",
                        height: "24px",
                        borderRadius: "6px",
                        backgroundColor: "white",
                      }}
                    />
                  )}
                </a>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  justifyContent: "space-around",
                }}
              >
                <LikeButton
                  itemId={selected.id}
                  itemTypeName={selected.itemTypeName}
                  onSuccess={onLike}
                />
                <DislikeButton
                  itemId={selected.id}
                  itemTypeName={selected.itemTypeName}
                  onSuccess={onLike}
                />
                <ShareButton title={selected.name} url={selected.productUrl} />
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: "#aaa" }}>Loading products…</p>
        )}
      </div>
    </div>
  );
}
