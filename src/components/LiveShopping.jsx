// src/components/LiveShopping.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import ChannelLogo from "./ChannelLogo";
import ProductCard from "./ProductCard";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import { useProducts } from "../contexts/ProductsContext";
import { FormatPrice } from "../legacy/modules/productsModule";
import FrameGallery from "./FrameGallery";

export default function LiveShopping({ channelId, onLike }) {
  const { products, addProduct } = useProducts();
  const [selected, setSelected] = useState(null);
  const scrollRef = useRef(null);
  const beltRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const deviceCanHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  const toSelectedData = useCallback((p) => {
    if (!p) return null;
    const itemTypeName =
      p.type === "ticket"
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

  useEffect(() => {
    const box = scrollRef.current;
    const belt = beltRef.current;
    if (!box || !belt) return;

    function applyFocus(card) {
      if (!card || card === lastFocusedRef.current) return;
      const id = card.getAttribute("data-product-id");
      const product = products.find((pr) => String(pr.id) === id);
      if (product) {
        lastFocusedRef.current = card;
        setSelected(toSelectedData(product));
      }
    }

    function updateFocusDuringScroll() {
      const containerRect = box.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const scrollLeft = box.scrollLeft;
      const maxScroll = belt.scrollWidth - containerWidth;

      const START = 190;
      const END = containerWidth - 190;
      const t = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      const focusX = containerRect.left + (START + t * (END - START));

      const cards = Array.from(belt.querySelectorAll(".item-container"));
      let bestCard = null;
      let smallestDelta = Infinity;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const delta = Math.abs(centerX - focusX);
        if (delta < smallestDelta) {
          smallestDelta = delta;
          bestCard = card;
        }
      });

      applyFocus(bestCard);
    }

    box.addEventListener("scroll", updateFocusDuringScroll, { passive: true });
    requestAnimationFrame(updateFocusDuringScroll);
    return () => box.removeEventListener("scroll", updateFocusDuringScroll);
  }, [products, toSelectedData]);

  return (
    <div className="liveshopping-container" style={{ width: "100%" }}>
      <FrameGallery selectedId={selected?.id} />
      <ChannelLogo channelId={channelId} className="channel-logo" />
      <div id="absolute-container" ref={scrollRef}>
        <div id="itemContent" ref={beltRef} style={{ display: "flex", gap: 16 }}>
          {products.map((p) => (
            <div key={p.id} onMouseEnter={() => handleHover(p)}>
              <ProductCard
                product={p}
                showDetails={deviceCanHover}
                focused={selected?.id === p.id}
              />
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
