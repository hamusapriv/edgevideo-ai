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
import useIsMobilePortrait from "../hooks/useIsMobilePortrait";
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
  const isMobilePortrait = useIsMobilePortrait(); // For frame gallery order and scroll sync
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

  // Function to trigger frame gallery sync with minimal scroll disruption
  const scrollContainerAfterAddition = useCallback(() => {
    const container = scrollRef.current;
    if (container && isMobilePortrait) {
      // Store the initial scroll position
      const initialScroll = container.scrollTop;

      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        // Check if we're still at the same position
        const currentScroll = container.scrollTop;

        // Only proceed if scroll position hasn't changed significantly
        if (Math.abs(currentScroll - initialScroll) < 5) {
          // Small instantaneous scroll to trigger sync
          container.scrollTop = currentScroll + 1;

          // Immediately return to original position
          requestAnimationFrame(() => {
            container.scrollTop = initialScroll;
          });
        }
      });
    }
  }, [isMobilePortrait]);

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

        // Trigger scroll alignment for mobile portrait mode
        scrollContainerAfterAddition();
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

        // Trigger scroll alignment for mobile portrait mode
        scrollContainerAfterAddition();
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

      // Trigger scroll alignment if products were added
      if (additions.length > 0) {
        setTimeout(() => scrollContainerAfterAddition(), 0);
      }

      return updated;
    });
  }, [
    products,
    scheduleEnterRemoval,
    scheduleExitRemoval,
    scrollContainerAfterAddition,
  ]);

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
    let smoothScrolling = false;

    function syncFromContainer() {
      if (lock || smoothScrolling) return;
      lock = true;

      // 1) how far container can scroll vertically
      const maxContainerScroll =
        container.scrollHeight - container.clientHeight;
      let ratio =
        maxContainerScroll > 0 ? container.scrollTop / maxContainerScroll : 0;

      // 2) For mobile portrait, we always want to sync horizontally regardless of whether gallery is scrollable
      if (isMobilePortrait) {
        // Mobile portrait: map vertical products scroll to horizontal gallery scroll
        const maxGalleryScroll = gallery.scrollWidth - gallery.clientWidth;

        if (maxGalleryScroll > 0) {
          // Gallery is scrollable - use inverted ratio since frames are reversed
          const scrollRatio = 1 - ratio;
          gallery.scrollLeft = scrollRatio * maxGalleryScroll;
        } else {
          // Gallery is not scrollable yet, but position based on scroll ratio to show relevant frames
          // Since frames are reversed, we need to decide which frames to show based on product position
          if (gallery.children.length > 0) {
            const galleryWidth = gallery.clientWidth;
            const totalWidth = gallery.scrollWidth;

            // If gallery is wider than container, we can still position it
            if (totalWidth > galleryWidth) {
              // We can scroll a bit even if maxGalleryScroll was <= 0 due to rounding
              const actualMaxScroll = totalWidth - galleryWidth;
              const scrollRatio = 1 - ratio; // Inverted for mobile portrait
              gallery.scrollLeft = scrollRatio * actualMaxScroll;
            } else {
              // Gallery fits entirely, position based on scroll state
              if (ratio <= 0.3) {
                // Near top of products - show newest frames (right side for reversed)
                gallery.scrollLeft = Math.max(0, totalWidth - galleryWidth);
              } else if (ratio >= 0.7) {
                // Near bottom of products - show oldest frames (left side for reversed)
                gallery.scrollLeft = 0;
              } else {
                // Middle area - show middle frames
                gallery.scrollLeft = Math.max(
                  0,
                  (totalWidth - galleryWidth) * 0.5
                );
              }
            }
          }
        }
      } else {
        // Desktop or mobile landscape: decide if gallery is horizontal or vertical
        const isGalleryHorizontal = gallery.scrollWidth > gallery.clientWidth;

        if (isGalleryHorizontal) {
          // mobile landscape: map to horizontal scroll
          const maxGalleryScroll = gallery.scrollWidth - gallery.clientWidth;
          if (maxGalleryScroll > 0) {
            gallery.scrollLeft = ratio * maxGalleryScroll;
          }
        } else {
          // desktop: map to vertical scroll
          const maxGalleryScroll = gallery.scrollHeight - gallery.clientHeight;
          if (maxGalleryScroll > 0) {
            gallery.scrollTop = ratio * maxGalleryScroll;
          }
        }
      }

      lock = false;
    }

    // Smooth scroll function for frame gallery adjustments
    function smoothSyncFromContainer(targetRatio = null) {
      if (lock || smoothScrolling) return;

      smoothScrolling = true;

      // Use current ratio if not provided
      const maxContainerScroll =
        container.scrollHeight - container.clientHeight;
      const ratio =
        targetRatio !== null
          ? targetRatio
          : maxContainerScroll > 0
          ? container.scrollTop / maxContainerScroll
          : 0;

      const isGalleryHorizontal = gallery.scrollWidth > gallery.clientWidth;

      if (isGalleryHorizontal) {
        const maxGalleryScroll = gallery.scrollWidth - gallery.clientWidth;

        if (maxGalleryScroll > 0) {
          // Gallery is scrollable
          const scrollRatio = isMobilePortrait ? 1 - ratio : ratio;
          const targetScrollLeft = scrollRatio * maxGalleryScroll;

          // Use smooth scrolling
          gallery.scrollTo({
            left: targetScrollLeft,
            behavior: "smooth",
          });
        } else if (isMobilePortrait) {
          // Gallery not scrollable yet, but position based on scroll ratio for mobile portrait
          if (gallery.children.length > 0) {
            const galleryWidth = gallery.clientWidth;
            const totalWidth = gallery.scrollWidth;

            if (totalWidth > galleryWidth) {
              // We can scroll a bit even if maxGalleryScroll was <= 0
              const actualMaxScroll = totalWidth - galleryWidth;
              const scrollRatio = 1 - ratio; // Inverted for mobile portrait
              const targetScrollLeft = scrollRatio * actualMaxScroll;

              gallery.scrollTo({
                left: targetScrollLeft,
                behavior: "smooth",
              });
            } else {
              // Gallery fits entirely, position based on scroll state
              let targetPosition;
              if (ratio <= 0.3) {
                // Near top - show newest frames (right side for reversed)
                targetPosition = Math.max(0, totalWidth - galleryWidth);
              } else if (ratio >= 0.7) {
                // Near bottom - show oldest frames (left side for reversed)
                targetPosition = 0;
              } else {
                // Middle - show middle frames
                targetPosition = Math.max(0, (totalWidth - galleryWidth) * 0.5);
              }

              gallery.scrollTo({
                left: targetPosition,
                behavior: "smooth",
              });
            }
          }
        }

        // Reset smoothScrolling flag after animation completes
        setTimeout(() => {
          smoothScrolling = false;
        }, 300); // Typical smooth scroll duration
      } else {
        const maxGalleryScroll = gallery.scrollHeight - gallery.clientHeight;

        if (maxGalleryScroll > 0) {
          const targetScrollTop = ratio * maxGalleryScroll;

          gallery.scrollTo({
            top: targetScrollTop,
            behavior: "smooth",
          });
        }

        setTimeout(() => {
          smoothScrolling = false;
        }, 300);
      }
    }

    // Initial sync when component mounts
    syncFromContainer();

    container.addEventListener("scroll", syncFromContainer, { passive: true });

    // Store the smooth sync function on the gallery element for external access
    gallery._smoothSync = smoothSyncFromContainer;

    return () => {
      container.removeEventListener("scroll", syncFromContainer);
      if (gallery._smoothSync) {
        delete gallery._smoothSync;
      }
    };
  }, [isMobilePortrait]);

  // Handle smooth scroll adjustment when products are added in mobile portrait mode
  useEffect(() => {
    if (!isMobilePortrait) return;

    const gallery = galleryRef.current;
    const container = scrollRef.current;
    if (!gallery || !container) return;

    // For mobile portrait, when a new product is added, we want to maintain visual alignment
    // Check if the products container has enough content to scroll
    const maxContainerScroll = container.scrollHeight - container.clientHeight;

    // We need the products container to be scrollable, but frame gallery might not be scrollable yet
    // when there are fewer products - that's okay, we'll still position it correctly
    if (maxContainerScroll <= 0) return;

    const maxGalleryScroll = gallery.scrollWidth - gallery.clientWidth;
    const isGalleryScrollable = maxGalleryScroll > 0;

    // Calculate what the scroll position should be based on current product position
    const currentRatio = container.scrollTop / maxContainerScroll;

    if (isGalleryScrollable) {
      // Gallery is scrollable - use smooth sync
      const targetScrollRatio = 1 - currentRatio; // Inverted for mobile portrait
      const targetGalleryScroll = targetScrollRatio * maxGalleryScroll;

      // If the gallery scroll is significantly off from where it should be, smooth scroll to correct position
      const currentGalleryScroll = gallery.scrollLeft;
      const scrollDifference = Math.abs(
        currentGalleryScroll - targetGalleryScroll
      );

      // Only adjust if the difference is significant (more than 10% of a frame width)
      const frameWidth =
        gallery.children.length > 0 ? gallery.children[0].offsetWidth : 100;
      if (scrollDifference > frameWidth * 0.1) {
        if (gallery._smoothSync) {
          setTimeout(() => {
            gallery._smoothSync(currentRatio);
          }, 100);
        }
      }
    } else {
      // Gallery is not scrollable yet (not enough frames), but we should still position it
      // For mobile portrait with non-scrollable gallery, we need to position frames to align with products
      // Since frames are reversed and products are not, we need to calculate the visual alignment

      if (gallery.children.length > 0) {
        // Calculate which frame should be "visually aligned" with the current product position
        // currentRatio = 0 means top product (index 0) should align with leftmost visible frame
        // currentRatio = 1 means bottom product (last index) should align with rightmost visible frame

        // Since frames are reversed in mobile portrait, the first frame (index 0) is actually the newest
        // We want to position the gallery so the appropriate frame is in view
        const totalFrames = gallery.children.length;
        const galleryWidth = gallery.clientWidth;
        const frameWidth = gallery.children[0].offsetWidth;
        const framesVisible = Math.floor(galleryWidth / frameWidth);

        // Calculate which frame index should be at the left edge of the visible area
        // Since frames are reversed, frame 0 is the newest (rightmost in original order)
        const targetFrameIndex = Math.floor(currentRatio * (totalFrames - 1));

        // Position gallery to show the target frame
        // For a non-scrollable gallery, we can't scroll, but we can at least ensure
        // we're positioned to show the most relevant frames
        const maxVisiblePosition = Math.max(
          0,
          gallery.scrollWidth - gallery.clientWidth
        );

        if (currentRatio <= 0.5) {
          // Show newer frames (start of reversed array = right side of original)
          gallery.scrollLeft = maxVisiblePosition;
        } else {
          // Show older frames (end of reversed array = left side of original)
          gallery.scrollLeft = 0;
        }
      }
    }
  }, [allProducts.length, isMobilePortrait]); // Direct scroll-based pull-to-load logic
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
        <div id="itemContent" ref={beltRef} style={{ display: "flex" }}>
          {/* Live Products (including the first 5 cached products that were added immediately) */}
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

          <div style={{ maxWidth: "100%" }}>
            {/* Recently Matched Separator - only show if there are cached products */}
            {cachedProducts.filter(
              (p) => !displayProducts.some((live) => live.id === p.id)
            ).length > 0 && (
              <div className="recently-matched-separator">
                <div className="separator-text">Recently Matched</div>
              </div>
            )}

            {/* Additional Cached Products (loaded through scroll, excluding duplicates) */}
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
