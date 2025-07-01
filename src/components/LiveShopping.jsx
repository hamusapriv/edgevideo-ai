// src/components/LiveShopping.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { useProducts } from "../contexts/ProductsContext";
import FrameGallery from "./FrameGallery";
import useIsMobile from "../hooks/useIsMobile";

export default function LiveShopping() {
  const { products, addProduct } = useProducts();
  const [selectedId, setSelectedId] = useState(null);
  const [displayProducts, setDisplayProducts] = useState([]);
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);
  const galleryRef = useRef(null);
  const beltRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      addProduct(e.detail);
      setSelectedId((cur) => cur || String(e.detail.id));
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

          // allow one paint with the .enter class so transitions fire
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setDisplayProducts((cur) =>
                cur.map((it) => (it.id === p.id ? { ...it, _status: "" } : it))
              );
            });
          });
        }
      });

      // handle removals
      prev.forEach((p) => {
        if (!nextIds.includes(p.id) && p._status !== "exit") {
          updated = updated.map((it) =>
            it.id === p.id ? { ...it, _status: "exit" } : it
          );

          // wait for exit transition before removing the item
          requestAnimationFrame(() => {
            setTimeout(() => {
              setDisplayProducts((cur) => cur.filter((it) => it.id !== p.id));
            }, 500);
          });
        }
      });

      return updated;
    });
  }, [products]);

  useEffect(() => {
    if (!selectedId && products.length) {
      setSelectedId(String(products[0].id));
    }
  }, [products, selectedId]);

  const handleHover = useCallback(
    (p) => {
      if (!isMobile) {
        setSelectedId(String(p.id));
      }
    },
    [isMobile]
  );

  useEffect(() => {
    const box = scrollRef.current;
    const beltEl = beltRef.current;
    if (!box || !beltEl || !isMobile) return;

    function applyFocus(card) {
      if (!card || card === lastFocusedRef.current) return;
      const id = card.getAttribute("data-product-id");
      if (displayProducts.some((pr) => String(pr.id) === String(id))) {
        lastFocusedRef.current = card;
        setSelectedId(id);
      }
    }

    function updateFocusDuringScroll() {
      // 1) measurements for mapping scroll → focusY
      const containerRect = box.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const scrollTop = box.scrollTop;
      const maxScroll = beltEl.scrollHeight - containerHeight;

      // 2) define the “focus zone” inside the container viewport
      const START = 120;
      const END = containerHeight - 120;
      const t = maxScroll > 0 ? scrollTop / maxScroll : 0;
      const focusY = containerRect.top + START + t * (END - START);

      // 3) find the card whose vertical center is closest to focusY
      const cards = Array.from(beltEl.querySelectorAll(".item-container"));
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

      // 4) update classes & selection
      cards.forEach((c) => c.classList.remove("focused"));
      if (bestCard) {
        bestCard.classList.add("focused");
        applyFocus(bestCard);
      }
    }

    box.addEventListener("scroll", updateFocusDuringScroll, { passive: true });
    // run once on mount so one is already focused
    requestAnimationFrame(updateFocusDuringScroll);

    return () => {
      box.removeEventListener("scroll", updateFocusDuringScroll);
    };
  }, [displayProducts, isMobile]);

  useEffect(() => {
    const gallery = galleryRef.current;
    const container = scrollRef.current;
    if (!gallery || !container) return;

    let lock = false;
    function syncFromContainer() {
      if (lock) return;
      lock = true;

      // 1) how far container can scroll vertically
      const maxContainerScroll =
        container.scrollHeight - container.clientHeight;
      const ratio =
        maxContainerScroll > 0 ? container.scrollTop / maxContainerScroll : 0;

      // 2) decide if gallery is horizontal (mobile) or vertical (desktop)
      const isGalleryHorizontal = gallery.scrollWidth > gallery.clientWidth;

      if (isGalleryHorizontal) {
        // mobile: map to horizontal scroll
        const maxGalleryScroll = gallery.scrollWidth - gallery.clientWidth;
        gallery.scrollLeft = ratio * maxGalleryScroll;
      } else {
        // desktop: map to vertical scroll
        const maxGalleryScroll = gallery.scrollHeight - gallery.clientHeight;
        gallery.scrollTop = ratio * maxGalleryScroll;
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
              focused={String(selectedId) === String(p.id)}
              extraClass={p._status}
              onMouseEnter={isMobile ? undefined : () => handleHover(p)}
            />
          ))}
        </div>
      </div>
      {/* details panel removed */}
    </div>
  );
}
