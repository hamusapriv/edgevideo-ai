import React, { useEffect, useState, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import ChannelLogo from "./ChannelLogo";
import ProductCard from "./ProductCard";
import SvgFrame from "./svgs/SvgFrame";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";

const MAX_CARDS = 20;

export default function LiveShopping({ channelId, onLike }) {
  const deviceCanHover =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(
        `https://fastapi.edgevideo.ai/product_search/recent_products/${channelId}/4`
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setProducts((prev) => {
        const merged = [...prev, ...data];
        const uniqueMap = new Map();
        merged.forEach((p) => {
          if (!uniqueMap.has(p.id)) uniqueMap.set(p.id, p);
        });
        const unique = Array.from(uniqueMap.values());
        return unique.slice(-MAX_CARDS);
      });
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }, [channelId]);

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 15000);
    return () => clearInterval(id);
  }, [fetchLatest]);

  const itemSize = deviceCanHover ? 280 : 200;
  const listHeight = deviceCanHover ? 400 : 250;
  const layout = deviceCanHover ? "vertical" : "horizontal";

  function handleSelect(product) {
    if (!product) return;
    setSelected({
      id: product.id,
      itemTypeName: product.link?.toLowerCase().includes("viator")
        ? "Viator Ticket"
        : "DB Product",
      name: product.title,
      price: product.price,
      description: product.explanation,
      frameImageUrl: product.back_image,
      matchText: product.matchType,
      vendorLogoUrl: product.logo_url,
      productUrl: product.link,
      frameVisible: false,
    });
  }

  const Row = ({ index, style }) => {
    const product = products[index];
    return (
      <div style={style}>
        <ProductCard
          product={product}
          showDetails={deviceCanHover}
          onSelect={() => handleSelect(product)}
        />
      </div>
    );
  };

  return (
    <div className="liveshopping-container" style={{ width: "100%" }}>
      <ChannelLogo channelId={channelId} className="channel-logo" />
      <List
        height={listHeight}
        width="100%"
        itemCount={products.length}
        itemSize={itemSize}
        layout={layout}
      >
        {Row}
      </List>
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
                  onClick={() =>
                    setSelected((p) =>
                      p ? { ...p, frameVisible: !p.frameVisible } : p
                    )
                  }
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
                  {selected.frameVisible ? "Hide Frame" : "Show Frame"}
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
                  maxHeight: selected.frameVisible ? "200px" : "0px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  opacity: selected.frameVisible ? 1 : 0,
                  transform: selected.frameVisible
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
