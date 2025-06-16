// src/components/LiveShopping.jsx
import React, { useEffect, useRef } from "react";
import ChannelLogo from "./ChannelLogo";

export default function LiveShopping({ channelId, onLike }) {
  // ───────── Refs ─────────
  const scrollBoxRef = useRef(null);
  const beltRef = useRef(null);
  const liveObsRef = useRef(null);

  // ───────── New: throttle flag for requestAnimationFrame ─────────
  const pendingRAF = useRef(false);

  // ───────── add at top of your useEffect ─────────
  const lastBestRef = useRef(null);


  // ───────── Detect hover (desktop vs mobile) ─────────
  const deviceCanHover = window.matchMedia("(any-hover:hover)").matches;

  useEffect(() => {
    // placeholder for any dynamically inserted scripts
    let injectedScript = null;

    //
    // ────────────────────────────────────────────────────────────────────────
    // (A) No additional styles needed now that card details are always visible
    // ────────────────────────────────────────────────────────────────────────

    // ────────────────────────────────────────────────────────────────────────
    // (C) Grab DOM nodes & bail if missing
    // ────────────────────────────────────────────────────────────────────────
    const scrollBox = scrollBoxRef.current;
    const belt = beltRef.current;
    if (!scrollBox || !belt) {
      console.error(
        "[LiveShopping] Could not find #absolute-container or #itemContent"
      );
      return;
    }

    //
    // ────────────────────────────────────────────────────────────────────────
    // (D) Helper to append a fresh “product0” placeholder whenever the current one’s <img> changes
    // ────────────────────────────────────────────────────────────────────────
    function smoothAppend() {
      const liveCard = belt.querySelector(".product0");
      if (!liveCard) return;

      // Remove “product0” from the old card so it becomes a “static” card
      liveCard.classList.remove("product0");

      // Create a brand-new placeholder, with class="product0"
      const fresh = makeCard(true);
      belt.append(fresh);

      // Start observing the new product0’s <img> for the next update
      watchProduct0();

      // Re-run scroll‐based focus logic after layout
      if (!deviceCanHover) {
        requestAnimationFrame(onScroll);
      }
    }

    function watchProduct0() {
      liveObsRef.current?.disconnect();
      const liveImg = belt.querySelector(
        ".product0 img[data-role='product-image']"
      );
      if (!liveImg) return;

      liveObsRef.current = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "attributes" && m.attributeName === "src") {
            smoothAppend();
          }
        }
      });
      liveObsRef.current.observe(liveImg, {
        attributes: true,
        attributeFilter: ["src"],
      });
    }

    // ───────── E) Throttled onScroll ─────────
    function onScroll() {
      if (pendingRAF.current) return;
      pendingRAF.current = true;

      requestAnimationFrame(() => {
        pendingRAF.current = false;
        updateFocusDuringScroll();
      });
    }

    function applyFocus(card) {
      if (!card || card === lastBestRef.current) return;

      if (lastBestRef.current) {
        lastBestRef.current.classList.remove("focused");
      }

      card.classList.add("focused");
      lastBestRef.current = card;

      // details are displayed directly within the focused card
    }

    // ───────── updateFocusDuringScroll: only run when focus really changes ─────────
    function updateFocusDuringScroll() {
      const containerRect = scrollBox.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const scrollLeft = scrollBox.scrollLeft;
      const maxScroll = belt.scrollWidth - containerWidth;

      const START = 150;
      const END = containerWidth - 150;
      const t = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      const focusX = containerRect.left + (START + t * (END - START));

      // find the card whose center is closest to focusX
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

    // Attach scroll listener as passive
    if (!deviceCanHover) {
      scrollBox.addEventListener("scroll", onScroll, { passive: true });
    }

    //
    // ────────────────────────────────────────────────────────────────────────
    // (F) CARD FACTORY: create a minimal `.item-container`
    // ────────────────────────────────────────────────────────────────────────
    function makeCard(isP0 = false) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
  <div class="item-container ${isP0 ? "product0" : ""}">
    <!-- Visible product image -->
    <img
      data-role="product-image"
      src=""
      alt="Product Image"
      loading="lazy" 
    />
    <!-- Newly added frame-image -->
    <img
      class="frame-image"
      data-role="frame-image"
      src=""
      alt=""
    />

    <!-- Hidden link element; screenNoAnim.js will populate its href -->
    <a data-role="product-link" href=""></a>

    <!-- Hidden fields (name, price, description) -->
    <div
      data-role="matchText"
      style="padding: 8px; font-size: 1rem; font-weight: bold;"
    ></div>

    <img
      data-role="vendor-logo"
      src=""
      alt="Vendor Logo"
    />

    <div
      data-role="product-name"
      class="live-product-name"
      style="padding: 8px; font-size: 1rem; font-weight: bold;"
    ></div>
    <div
      data-role="product-price"
      style="padding: 4px 8px; font-size: 0.9rem; color: #aaf;"
    ></div>
    <div
      data-role="ai-description"
      class="ai-query"
      style="padding: 8px; font-size: 0.85rem; color: #ddd;"
    ></div>

    <!-- Info button -->
    <div
      class="info-button"
      style="position: absolute; top: 8px; right: 8px; color: #fff; font-size: 1.2rem;"
    >
      &#9432;
    </div>

    <!-- Like/Dislike/Share row -->
    <div class="product-buttons-container" style="flex: 1; justify-content: space-around; padding: 8px 0;">
      <button data-role="like" style="background: #444; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">
        Like
      </button>
      <button data-role="dislike" style="background: #444; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">
        Dislike
      </button>
      <button data-role="share-link" style="background: #444; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">
        Share
      </button>
    </div>
  </div>
      `.trim();

      const card = wrapper.firstElementChild;
      if (deviceCanHover) {
        card.addEventListener("mouseenter", () => applyFocus(card));
      }
      return card;
    }

    //
    // ────────────────────────────────────────────────────────────────────────
    // (G) Initialize belt: if empty, plant a single “product0” placeholder,
    //     then start observing its <img> for updates. Also run initial focus.
    // ────────────────────────────────────────────────────────────────────────
    function initializeBelt() {
      if (!belt.querySelector(".item-container")) {
        const first = makeCard(true);
        belt.append(first);
      }
      watchProduct0();

      if (deviceCanHover) {
        const firstCard = belt.querySelector(".item-container");
        if (firstCard) applyFocus(firstCard);
      } else {
        requestAnimationFrame(onScroll);
      }
    }
    initializeBelt();

    //
    // ────────────────────────────────────────────────────────────────────────
    // (H) Cleanup on unmount
    // ────────────────────────────────────────────────────────────────────────
    return () => {
      liveObsRef.current?.disconnect();
      if (!deviceCanHover) {
        scrollBox.removeEventListener("scroll", onScroll, { passive: true });
      }
      if (injectedScript) document.head.removeChild(injectedScript);
    };
  }, [channelId]);


  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="liveshopping-container" style={{ width: "100%" }}>
      <ChannelLogo channelId={channelId} className="channel-logo" />{" "}
      {/* ─────────────────────────────────────────────────────────────────
           (1) SCROLLABLE BELT: only images are visible here
      ───────────────────────────────────────────────────────────────── */}
      <div id="absolute-container" ref={scrollBoxRef}>
        <div id="itemContent" ref={beltRef}>
          {/* screenNoAnim.js will insert <div class="item-container product0">…</div> cards here */}
        </div>
      </div>
    </div>
  );
}
