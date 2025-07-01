// src/components/LiveShopping.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { useProducts } from "../contexts/ProductsContext";
import FrameGallery from "./FrameGallery";

export default function LiveShopping() {
  const { products, addProduct } = useProducts();
  const [selectedId, setSelectedId] = useState(null);
  const [displayProducts, setDisplayProducts] = useState([]);
  const scrollRef = useRef(null);
  const galleryRef = useRef(null);
  const beltRef = useRef(null);
  const lastFocusedRef = useRef(null);


  useEffect(() => {
    function handler(e) {
      addProduct(e.detail);
      setSelectedId((cur) => cur || e.detail.id);
    }
    window.addEventListener("new-product", handler);
    return () => window.removeEventListener("new-product", handler);
  }, [addProduct]);

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
    if (!selectedId && products.length) {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId]);

  const handleHover = useCallback((p) => {
    setSelectedId(p.id);
  }, []);

  useEffect(() => {
    const box = scrollRef.current;
    const belt = beltRef.current;
    if (!box || !belt) return;

    function applyFocus(card) {
      if (!card || card === lastFocusedRef.current) return;
      const id = Number(card.getAttribute("data-product-id"));
      if (displayProducts.some((pr) => pr.id === id)) {
        lastFocusedRef.current = card;
        setSelectedId(id);
      }
    }

    function updateFocusDuringScroll() {
      const containerRect = box.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const scrollTop = box.scrollTop;
      const maxScroll = belt.scrollHeight - containerHeight;

      const START = 120;
      const END = containerHeight - 120;
      const t = maxScroll > 0 ? scrollTop / maxScroll : 0;
      const focusY = containerRect.top + (START + t * (END - START));

      const cards = Array.from(belt.querySelectorAll(".item-container"));
      let bestCard = null;
      let smallestDelta = Infinity;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const delta = Math.abs(centerY - focusY);
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
  }, [displayProducts]);

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
        selectedId={selectedId}
        items={displayProducts}
      />
      <div id="absolute-container" ref={scrollRef}>
        <div id="itemContent" ref={beltRef} style={{ display: "flex" }}>
          {displayProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              showDetails
              focused={selectedId === p.id}
              extraClass={p._status}
              onMouseEnter={() => handleHover(p)}
            />
          ))}
        </div>
      </div>
      {/* details panel removed */}
    </div>
  );
}
