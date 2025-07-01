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

export default function LiveShopping({ onLike }) {
  const { products, addProduct } = useProducts();
  const [selected, setSelected] = useState(null);
  const [displayProducts, setDisplayProducts] = useState([]);
  const scrollRef = useRef(null);
  const galleryRef = useRef(null);
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

  // sync products with animated display list
  useEffect(() => {
    setDisplayProducts((prev) => {
      const prevIds = prev.map((p) => p.id);
      const nextIds = products.map((p) => p.id);
      let updated = [...prev];

      // handle additions: put new items at the start so they appear first
      products.forEach((p) => {
        if (!prevIds.includes(p.id)) {
          updated.unshift({ ...p, _status: "enter" });

          const container = scrollRef.current;
          const gallery = galleryRef.current;
          const first = beltRef.current?.querySelector(".item-container");
          if (container && gallery && first) {
            const horiz = container.scrollWidth > container.clientWidth;
            const delta = horiz ? first.offsetWidth : first.offsetHeight;
            if (horiz) {
              container.scrollLeft += delta;
              const maxC = container.scrollWidth - container.clientWidth;
              const maxG = gallery.scrollWidth - gallery.clientWidth;
              const ratio = maxC ? container.scrollLeft / maxC : 0;
              gallery.scrollLeft = ratio * maxG;
            } else {
              container.scrollTop += delta;
              const maxC = container.scrollHeight - container.clientHeight;
              const maxG = gallery.scrollHeight - gallery.clientHeight;
              const ratio = maxC ? container.scrollTop / maxC : 0;
              gallery.scrollTop = ratio * maxG;
            }
          }

          requestAnimationFrame(() => {
            setDisplayProducts((cur) =>
              cur.map((it) => (it.id === p.id ? { ...it, _status: "" } : it))
            );
          });
        }
      });

      // handle removals
      prev.forEach((p) => {
        if (!nextIds.includes(p.id) && p._status !== "exit") {
          updated = updated.map((it) =>
            it.id === p.id ? { ...it, _status: "exit" } : it
          );
          setTimeout(() => {
            setDisplayProducts((cur) => cur.filter((it) => it.id !== p.id));
          }, 300);
        }
      });

      return updated;
    });
  }, [products]);

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
      const product = displayProducts.find((pr) => String(pr.id) === id);
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

      const START = 120; // start focus area
      const END = containerWidth - 120; // start focus area;
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
  }, [displayProducts, toSelectedData]);

  useEffect(() => {
    const gallery = galleryRef.current;
    const container = scrollRef.current;
    if (!gallery || !container) return;

    let lock = false;

    function syncFromContainer() {
      if (lock) return;
      lock = true;
      const horiz = container.scrollWidth > container.clientWidth;
      if (horiz) {
        const maxC = container.scrollWidth - container.clientWidth;
        const maxG = gallery.scrollWidth - gallery.clientWidth;
        const ratio = maxC ? container.scrollLeft / maxC : 0;
        gallery.scrollLeft = ratio * maxG;
      } else {
        const maxC = container.scrollHeight - container.clientHeight;
        const maxG = gallery.scrollHeight - gallery.clientHeight;
        const ratio = maxC ? container.scrollTop / maxC : 0;
        gallery.scrollTop = ratio * maxG;
      }
      lock = false;
    }

    container.addEventListener("scroll", syncFromContainer, { passive: true });
    return () => {
      container.removeEventListener("scroll", syncFromContainer);
    };
  }, []);

  return (
    <div className="liveshopping-container" style={{ width: "100%" }}>
      <FrameGallery
        ref={galleryRef}
        selectedId={selected?.id}
        items={displayProducts}
      />
      <div id="absolute-container" ref={scrollRef}>
        <div id="itemContent" ref={beltRef} style={{ display: "flex" }}>
          {displayProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              showDetails={deviceCanHover}
              focused={selected?.id === p.id}
              extraClass={p._status}
              onMouseEnter={() => handleHover(p)}
            />
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
