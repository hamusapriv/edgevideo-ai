// src/components/LiveShopping.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { useProducts } from "../contexts/ProductsContext";
import { useAIStatus } from "../contexts/AIStatusContext";
import { useProductAIStatus } from "../hooks/useProductAIStatus";
import FrameGallery from "./FrameGallery";
import useIsMobile from "../hooks/useIsMobile";
import AIStatusDisplay from "./AIStatusDisplay";
import { preloadImages } from "../utils/imageValidation";

export default function LiveShopping() {
  const { products, addProduct } = useProducts();
  const { setShoppingAIStatus } = useAIStatus();
  const { processProductWithAIStatus } = useProductAIStatus(
    setShoppingAIStatus
  );
  const [selectedId, setSelectedId] = useState(null);
  const [displayProducts, setDisplayProducts] = useState(() =>
    products.map((p) => ({ ...p, _status: "" }))
  );
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);
  const galleryRef = useRef(null);
  const beltRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const enterTimers = useRef({});
  const exitTimers = useRef({});

  const scheduleEnterRemoval = useCallback((id) => {
    if (enterTimers.current[id]) return;
    enterTimers.current[id] = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisplayProducts((cur) =>
          cur.map((it) => (it.id === id ? { ...it, _status: "" } : it))
        );
        delete enterTimers.current[id];
      });
    });
  }, []);

  const scheduleExitRemoval = useCallback((id) => {
    if (exitTimers.current[id]) return;
    exitTimers.current[id] = setTimeout(() => {
      setDisplayProducts((cur) => cur.filter((it) => it.id !== id));
      delete exitTimers.current[id];
    }, 500);
  }, []);

  useEffect(() => {
    async function handler(e) {
      const p = e.detail;

      // Process product with AI status logic
      const processedProduct = await processProductWithAIStatus(p);

      if (processedProduct) {
        addProduct(processedProduct);
        setSelectedId((cur) => cur || String(processedProduct.id));

        setDisplayProducts((prev) => {
          if (prev.some((it) => it.id === processedProduct.id)) return prev;
          return [{ ...processedProduct, _status: "enter" }, ...prev];
        });
        scheduleEnterRemoval(processedProduct.id);
      }
    }

    // Handle new products from React contexts
    window.addEventListener("new-product", handler);

    // Handle legacy products from screen.js WebSocket
    async function legacyHandler(e) {
      const { product } = e.detail;

      // Process product with AI status logic
      const processedProduct = await processProductWithAIStatus(product);

      if (processedProduct) {
        addProduct(processedProduct);
        setSelectedId((cur) => cur || String(processedProduct.id));

        setDisplayProducts((prev) => {
          if (prev.some((it) => it.id === processedProduct.id)) return prev;
          return [{ ...processedProduct, _status: "enter" }, ...prev];
        });
        scheduleEnterRemoval(processedProduct.id);
      }
    }

    window.addEventListener("legacy-product-update", legacyHandler);

    return () => {
      window.removeEventListener("new-product", handler);
      window.removeEventListener("legacy-product-update", legacyHandler);
    };
  }, [addProduct, scheduleEnterRemoval, processProductWithAIStatus]);

  useEffect(() => {
    const timers = exitTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // Preload upcoming product images for better performance
  useEffect(() => {
    if (products.length > 0) {
      const imageUrls = products
        .slice(0, 3)
        .map((p) => p.image)
        .filter(Boolean);
      if (imageUrls.length > 0) {
        preloadImages(imageUrls).catch((err) =>
          console.warn("Failed to preload some product images:", err)
        );
      }
    }
  }, [products]);

  // sync products with animated display list
  useEffect(() => {
    setDisplayProducts((prev) => {
      const prevIds = prev.map((p) => p.id);
      const nextIds = products.map((p) => p.id);
      const additions = products.filter((p) => !prevIds.includes(p.id));
      const removals = prev.filter((p) => !nextIds.includes(p.id));

      if (!additions.length && !removals.length) return prev;

      let updated = [...prev];
      additions.forEach((p) => {
        updated.unshift({ ...p, _status: "enter" });
      });
      removals.forEach((p) => {
        updated = updated.map((it) =>
          it.id === p.id ? { ...it, _status: "exit" } : it
        );
      });

      // Schedule animations
      additions.forEach((p) => scheduleEnterRemoval(p.id));
      removals.forEach((p) => scheduleExitRemoval(p.id));

      return updated;
    });
  }, [products, scheduleEnterRemoval, scheduleExitRemoval]);

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
        <AIStatusDisplay />
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
