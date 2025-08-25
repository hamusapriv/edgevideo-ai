// src/components/LiveShopping.jsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import ProductCard from "./ProductCard";
import { useProducts } from "../contexts/ProductsContext";
import { useAIStatus } from "../contexts/AIStatusContext";
import { useProductAIStatus } from "../hooks/useProductAIStatus";
import FrameGallery from "./FrameGallery";
import useIsMobile from "../hooks/useIsMobile";
import useIsTouchDevice from "../hooks/useIsTouchDevice";
import useLayoutPreference from "../hooks/useLayoutPreference";
import AIStatusDisplay from "./AIStatusDisplay";
import SafeComponent from "./SafeComponent";
import {
  preloadImages,
  validateProductImages,
  validateImageThoroughly,
} from "../utils/imageValidation";

export default function LiveShopping() {
  const {
    products,
    addProduct,
    removeProduct,
    cachedProducts,
    cachedProductsLoading,
    hasMoreCachedProducts,
    loadMoreCachedProducts,
  } = useProducts();
  const { setShoppingAIStatus } = useAIStatus();
  const { processProductWithAIStatus } = useProductAIStatus(
    setShoppingAIStatus
  );
  const [selectedId, setSelectedId] = useState(null);
  const [displayProducts, setDisplayProducts] = useState(() =>
    products.map((p) => ({ ...p, _status: "" }))
  );

  // Pull-to-load state for cached products
  const [pullToLoadState, setPullToLoadState] = useState("hidden"); // 'hidden', 'visible', 'ready', 'loading'
  const [loadProgress, setLoadProgress] = useState(0); // 0-100% visibility progress
  const pullIndicatorRef = useRef(null);

  // Request deduplication and failure handling
  const loadRequestRef = useRef(null);
  const lastLoadAttemptRef = useRef(0);
  const loadCooldownRef = useRef(false);

  // Safe cached product loading with deduplication
  const safeLoadMoreCachedProducts = useCallback(async () => {
    const now = Date.now();

    // Prevent duplicate calls within 2 seconds
    if (loadCooldownRef.current || now - lastLoadAttemptRef.current < 2000) {
      console.log("Cached product load blocked: cooldown active");
      return Promise.resolve();
    }

    // Cancel any existing request
    if (loadRequestRef.current) {
      console.log("Cancelling existing cached product request");
      // Note: We can't actually cancel the API call, but we can ignore its result
    }

    // Set cooldown and track attempt
    loadCooldownRef.current = true;
    lastLoadAttemptRef.current = now;

    console.log("Starting cached product load...");

    // Create new request promise
    const requestPromise = loadMoreCachedProducts()
      .then((result) => {
        console.log("Cached product load successful");
        loadCooldownRef.current = false;
        loadRequestRef.current = null;
        return result;
      })
      .catch((error) => {
        console.error("Cached product load failed:", error);
        // Shorter cooldown on failure to allow retry
        setTimeout(() => {
          loadCooldownRef.current = false;
        }, 1000);
        loadRequestRef.current = null;
        throw error;
      });

    loadRequestRef.current = requestPromise;
    return requestPromise;
  }, [loadMoreCachedProducts]);

  // Combine live products and cached products for FrameGallery, ensuring no duplicates
  // Priority: live products take precedence over cached products with the same ID
  const allProducts = useMemo(() => {
    const liveProductIds = new Set(displayProducts.map((p) => p.id));
    const uniqueCachedProducts = cachedProducts.filter(
      (p) => !liveProductIds.has(p.id)
    );
    return [...displayProducts, ...uniqueCachedProducts];
  }, [displayProducts, cachedProducts]);

  // Create a ref to hold the current allProducts for stable reference in useEffect
  const allProductsRef = useRef(allProducts);
  allProductsRef.current = allProducts;

  const isMobile = useIsMobile(); // For CSS styling (hover capability)
  const isTouchDevice = useIsTouchDevice(); // For touch behavior (scroll-to-focus)
  const layoutPreference = useLayoutPreference(); // For UI layout decisions

  // Handle image errors by removing products from display
  const handleProductImageError = useCallback(
    (productId, reason) => {
      console.warn(
        `Removing product ${productId} from Live Shopping due to image error: ${reason}`
      );

      // Remove from display products
      setDisplayProducts((prev) => {
        const updated = prev.map((p) =>
          p.id === productId ? { ...p, _status: "exit" } : p
        );
        // Schedule removal after animation
        setTimeout(() => {
          setDisplayProducts((curr) => curr.filter((p) => p.id !== productId));
        }, 500);
        return updated;
      });

      // Remove from products context
      removeProduct(productId);

      // Update selected ID if the removed product was selected
      setSelectedId((currentId) => {
        if (String(currentId) === String(productId)) {
          const remainingProducts = products.filter((p) => p.id !== productId);
          return remainingProducts.length > 0
            ? String(remainingProducts[0].id)
            : null;
        }
        return currentId;
      });
    },
    [removeProduct, products]
  );

  // Debug logging
  useEffect(() => {
    console.log("🔍 Device Detection:", {
      isMobile: isMobile,
      isTouchDevice: isTouchDevice,
      layoutPreference: layoutPreference,
      userAgent: navigator.userAgent,
    });
  }, [isMobile, isTouchDevice, layoutPreference]);
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
        // Validate product image before adding to display
        const validProducts = await validateProductImages([processedProduct]);

        if (validProducts.length === 0) {
          console.warn(
            `Product ${processedProduct.id} excluded from Live Shopping due to invalid image`
          );
          return;
        }

        const validProduct = validProducts[0];
        addProduct(validProduct);
        setSelectedId((cur) => cur || String(validProduct.id));

        setDisplayProducts((prev) => {
          if (prev.some((it) => it.id === validProduct.id)) return prev;
          return [{ ...validProduct, _status: "enter" }, ...prev];
        });
        scheduleEnterRemoval(validProduct.id);
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
        // Validate product image before adding to display
        const validProducts = await validateProductImages([processedProduct]);

        if (validProducts.length === 0) {
          console.warn(
            `Product ${processedProduct.id} excluded from Live Shopping due to invalid image`
          );
          return;
        }

        const validProduct = validProducts[0];
        addProduct(validProduct);
        setSelectedId((cur) => cur || String(validProduct.id));

        setDisplayProducts((prev) => {
          if (prev.some((it) => it.id === validProduct.id)) return prev;
          return [{ ...validProduct, _status: "enter" }, ...prev];
        });
        scheduleEnterRemoval(validProduct.id);
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
      // Use hover behavior on devices that have hover capability (desktop/laptop)
      if (!isMobile) {
        setSelectedId(String(p.id));
      }
    },
    [isMobile]
  );

  useEffect(() => {
    const box = scrollRef.current;
    const beltEl = beltRef.current;
    // Only enable scroll-to-focus on touch devices (mobile phones/tablets)
    // Desktop should use hover-to-focus instead
    if (!box || !beltEl || !isTouchDevice) return;

    function applyFocus(card) {
      if (!card || card === lastFocusedRef.current) return;
      const id = card.getAttribute("data-product-id");
      if (allProductsRef.current.some((pr) => String(pr.id) === String(id))) {
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

    box.addEventListener("scroll", updateFocusDuringScroll, { passive: false });
    // run once on mount so one is already focused
    requestAnimationFrame(updateFocusDuringScroll);

    return () => {
      box.removeEventListener("scroll", updateFocusDuringScroll);
    };
  }, [displayProducts, isTouchDevice]);

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

  // Direct scroll-based pull-to-load logic
  useEffect(() => {
    const indicator = pullIndicatorRef.current;
    const container = scrollRef.current;
    if (!indicator || !container) return;

    let lastScrollTop = container.scrollTop;
    let isAutoScrolling = false;
    let scrollTimeout = null;

    const calculateProgress = () => {
      if (isAutoScrolling) return 0;

      const containerRect = container.getBoundingClientRect();
      const indicatorRect = indicator.getBoundingClientRect();

      // Calculate how much of the indicator is visible
      const containerBottom = containerRect.bottom;
      const indicatorTop = indicatorRect.top;
      const indicatorHeight = indicatorRect.height;

      let visibilityPercent = 0;

      if (indicatorTop < containerBottom) {
        const visibleHeight = Math.min(
          containerBottom - indicatorTop,
          indicatorHeight
        );
        visibilityPercent = Math.round((visibleHeight / indicatorHeight) * 100);
        visibilityPercent = Math.max(0, Math.min(100, visibilityPercent));
      }

      return visibilityPercent;
    };

    const autoScrollToLastProduct = () => {
      isAutoScrolling = true;

      // Find the last product element (excluding pull-to-load indicator and separators)
      const belt = document.getElementById("itemContent");
      const allItems = belt ? Array.from(belt.children) : [];
      const productItems = allItems.filter(
        (item) =>
          !item.classList.contains("pull-to-load-indicator") &&
          !item.classList.contains("recently-matched-separator")
      );

      if (productItems.length > 0) {
        const lastProduct = productItems[productItems.length - 1];

        // Get current scroll position
        const currentScrollTop = container.scrollTop;

        // Get actual element positions in viewport
        const containerRect = container.getBoundingClientRect();
        const lastProductRect = lastProduct.getBoundingClientRect();

        // Calculate how much we need to scroll to align bottoms
        const containerBottom = containerRect.bottom;
        const lastProductBottom = lastProductRect.bottom;

        // The difference tells us how much more we need to scroll
        const scrollAdjustment = lastProductBottom - containerBottom;

        // Calculate target scroll position
        const targetScrollTop = currentScrollTop + scrollAdjustment;

        console.log("Auto-scroll debug:", {
          currentScrollTop,
          containerBottom: containerRect.bottom,
          lastProductBottom: lastProductRect.bottom,
          scrollAdjustment,
          targetScrollTop,
        });

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });

        // Reset state immediately
        setPullToLoadState("hidden");
        setLoadProgress(0);

        // Reset auto-scroll flag after animation
        setTimeout(() => {
          isAutoScrolling = false;
        }, 300);
      }
    };

    const handleScroll = () => {
      if (isAutoScrolling) return;

      const currentScrollTop = container.scrollTop;
      const scrollDirection = currentScrollTop > lastScrollTop ? "down" : "up";
      lastScrollTop = currentScrollTop;

      if (!hasMoreCachedProducts || cachedProductsLoading) return;

      const visibilityPercent = calculateProgress();

      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }

      if (visibilityPercent > 0) {
        setLoadProgress(visibilityPercent);

        if (pullToLoadState === "hidden") {
          setPullToLoadState("visible");
        }

        // Trigger loading when 100% visible
        if (visibilityPercent >= 100 && pullToLoadState !== "loading") {
          setPullToLoadState("loading");
          setLoadProgress(100);
          safeLoadMoreCachedProducts().finally(() => {
            setPullToLoadState("hidden");
            setLoadProgress(0);
          });
          return;
        }

        // If user stops scrolling without reaching 100%, auto-scroll back after delay
        if (visibilityPercent < 100) {
          scrollTimeout = setTimeout(() => {
            autoScrollToLastProduct();
          }, 150); // 150ms delay after user stops scrolling
        }
      } else {
        // Reset when indicator not visible
        if (pullToLoadState !== "hidden") {
          setPullToLoadState("hidden");
          setLoadProgress(0);
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [
    hasMoreCachedProducts,
    cachedProductsLoading,
    safeLoadMoreCachedProducts,
    pullToLoadState,
  ]);

  return (
    <div className="liveshopping-container">
      <FrameGallery
        ref={galleryRef}
        selectedId={selectedId}
        items={allProducts}
      />
      <div id="absolute-container" ref={scrollRef}>
        {" "}
        <SafeComponent fallback="AI Status Loading...">
          <AIStatusDisplay />
        </SafeComponent>{" "}
        <div
          className="recently-matched-separator live-separator scroll-to-top-btn"
          onClick={() => {
            const container = scrollRef.current;
            if (container) {
              container.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }
          }}
        >
          <div className="separator-text">Live Now</div>
        </div>
        <div id="itemContent" ref={beltRef} style={{ display: "flex" }}>
          {/* Live Products */}
          {displayProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              showDetails
              focused={String(selectedId) === String(p.id)}
              extraClass={p._status}
              onMouseEnter={isMobile ? undefined : () => handleHover(p)}
              onImageError={handleProductImageError}
            />
          ))}
          <div>
            {/* Recently Matched Separator - only show if there are cached products and no duplicates */}
            {cachedProducts.filter(
              (p) => !displayProducts.some((live) => live.id === p.id)
            ).length > 0 && (
              <div className="recently-matched-separator">
                <div className="separator-text">Recently Matched</div>
              </div>
            )}

            {/* Cached Products (excluding duplicates of live products) */}
            {cachedProducts
              .filter((p) => !displayProducts.some((live) => live.id === p.id))
              .map((p) => (
                <ProductCard
                  key={`cached-${p.id}`}
                  product={p}
                  showDetails={true}
                  focused={String(selectedId) === String(p.id)}
                  extraClass="cached-product"
                  onMouseEnter={isMobile ? undefined : () => handleHover(p)}
                />
              ))}

            {/* Pull-to-load indicator for cached products */}
            {hasMoreCachedProducts && (
              <div
                ref={pullIndicatorRef}
                className={`pull-to-load-indicator ${pullToLoadState}`}
              >
                <div className="pull-to-load-progress">
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 60 60"
                    className="progress-circle"
                  >
                    {/* Background circle */}
                    <circle
                      cx="30"
                      cy="30"
                      r="25"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="4"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="30"
                      cy="30"
                      r="25"
                      stroke={
                        pullToLoadState === "loading"
                          ? "rgba(76, 175, 80, 1)"
                          : "rgba(76, 175, 80, 0.8)"
                      }
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 25}`}
                      strokeDashoffset={`${2 *
                        Math.PI *
                        25 *
                        (1 - loadProgress / 100)}`}
                      className={
                        pullToLoadState === "loading" ? "rotating" : ""
                      }
                      style={{
                        transition:
                          pullToLoadState === "loading"
                            ? "none"
                            : "stroke-dashoffset 0.1s ease-out",
                        transformOrigin: "50% 50%",
                        transform: "rotate(-90deg)",
                      }}
                    />
                    {/* Center icon */}
                    <text
                      x="30"
                      y="36"
                      textAnchor="middle"
                      fontSize="20"
                      fill={
                        pullToLoadState === "loading"
                          ? "rgba(76, 175, 80, 1)"
                          : "rgba(255, 255, 255, 0.8)"
                      }
                    >
                      {pullToLoadState === "loading" ? "⟳" : "↓"}
                    </text>
                  </svg>
                </div>
                <div className="pull-to-load-text">
                  {pullToLoadState === "loading"
                    ? "Loading more..."
                    : `${loadProgress}% - Scroll to load more`}
                </div>
              </div>
            )}

            {/* Legacy loading indicator - keep for other loading states */}
            {cachedProductsLoading && pullToLoadState === "hidden" && (
              <div className="item-container cached-loading">
                <div className="loading-spinner"></div>
                <div className="card-details">
                  <div className="loading-text">Loading more...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* details panel removed */}
    </div>
  );
}
