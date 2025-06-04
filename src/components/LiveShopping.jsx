// src/components/LiveShopping.jsx
import React, { useEffect, useRef, useState } from "react";

export default function LiveShopping({ channelId }) {
  // ───────── Refs ─────────
  const scrollBoxRef = useRef(null);
  const beltRef = useRef(null);
  const liveObsRef = useRef(null);
  const highlightRef = useRef(null);

  // ───────── Selected‐card state ─────────
  const [selectedCardData, setSelectedCardData] = useState({
    name: "",
    price: "",
    description: "",
    frameImageUrl: "",
    matchText: "",
    vendorLogoUrl: "",
    productUrl: "",
  });

  // ───────── Detect hover (desktop vs mobile) ─────────
  const deviceCanHover = window.matchMedia("(any-hover:hover)").matches;

  useEffect(() => {
    let injectedScript = null;
    let injectedStyle = null;

    //
    // ────────────────────────────────────────────────────────────────────────
    // (A) Inject a <style> that hides all non-image fields, plus base styles
    // ────────────────────────────────────────────────────────────────────────
    injectedStyle = document.createElement("style");
    injectedStyle.innerHTML = `
      /* Hide everything except the two images */
      .item-container [data-role="product-name"],
      .item-container [data-role="product-price"],
      .item-container [data-role="ai-description"],
      .item-container [data-role="frame-image"],
      .item-container [data-role="matchText"],
      .item-container [data-role="vendor-logo"],
      .item-container .info-button,
      .item-container [data-role="like"],
      .item-container [data-role="dislike"],
      .item-container [data-role="share-link"],
      .item-container [data-role="product-link"] {
        display: none !important;
      }

      /* The highlight overlay around the focused card */
      .focus-highlight {
        position: absolute;
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.4);
        pointer-events: none;
        transition: left 0.1s ease, top 0.1s ease, width 0.1s ease, height 0.1s ease;
        z-index: 2;
      }
    `;
    document.head.appendChild(injectedStyle);

    //
    // ────────────────────────────────────────────────────────────────────────
    // (B) Define window.channelId if missing, then inject screenNoAnim.js once
    // ────────────────────────────────────────────────────────────────────────
    if (typeof window.channelId === "undefined") {
      window.channelId = channelId || "ada3896d-0456-4589-95fa-cf71718b79c8";
    }
    if (!document.querySelector('script[src*="screenNoAnim.js"]')) {
      const url = `https://storage.googleapis.com/edge_cloud_storage/screenNoAnim.js?t=${Date.now()}`;
      injectedScript = document.createElement("script");
      injectedScript.src = url;
      injectedScript.async = true;
      document.head.appendChild(injectedScript);
      console.log("[LiveShopping] Injected screenNoAnim.js →", url);
    }

    //
    // ────────────────────────────────────────────────────────────────────────
    // (C) Grab DOM nodes & bail if missing
    // ────────────────────────────────────────────────────────────────────────
    const scrollBox = scrollBoxRef.current;
    const belt = beltRef.current;
    let highlightEl = highlightRef.current;

    if (!scrollBox || !belt) {
      console.error(
        "[LiveShopping] Could not find #absolute-container or #itemContent"
      );
      return;
    }

    // If highlight div doesn’t exist yet, create & append it
    if (!highlightEl) {
      highlightEl = document.createElement("div");
      highlightEl.className = "focus-highlight";
      // Initially hide it until we first position it
      highlightEl.style.display = "none";
      scrollBox.appendChild(highlightEl);
      highlightRef.current = highlightEl;
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
      requestAnimationFrame(() => {
        scrollBox.dispatchEvent(new Event("scroll"));
      });
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

    //
    // ────────────────────────────────────────────────────────────────────────
    // (E) onScroll handler: immediately update the “highlight” overlay each frame
    // ────────────────────────────────────────────────────────────────────────
    function onScroll() {
      // (1) Compute the dynamic focus‐X exactly as before
      const containerRect = scrollBox.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const scrollLeft = scrollBox.scrollLeft;
      const maxScroll = belt.scrollWidth - containerWidth;

      const START = 150;
      const END = containerWidth - 150;
      let t = 0;
      if (maxScroll > 0) {
        t = scrollLeft / maxScroll;
      }
      const focusX = containerRect.left + (START + t * (END - START));

      // (2) Find the card whose center is closest to focusX
      const cards = Array.from(belt.querySelectorAll(".item-container"));
      let bestCard = null;
      let smallestDelta = Infinity;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const delta = Math.abs(cardCenterX - focusX);
        if (delta < smallestDelta) {
          smallestDelta = delta;
          bestCard = card;
        }
      });

      if (bestCard) {
        // (3) Position the highlight overlay over bestCard's bounding box
        const cardRect = bestCard.getBoundingClientRect();
        const relLeft = cardRect.left - containerRect.left;
        const relTop = cardRect.top - containerRect.top;
        const pad = 6; // small padding around the card
        highlightEl.style.display = "block";
        highlightEl.style.left = `${relLeft - pad}px`;
        highlightEl.style.top = `${relTop - pad}px`;
        highlightEl.style.width = `${cardRect.width + pad * 2}px`;
        highlightEl.style.height = `${cardRect.height + pad * 2}px`;

        // (4) Extract hidden fields and update details panel
        const nameEl = bestCard.querySelector("[data-role='product-name']");
        const priceEl = bestCard.querySelector("[data-role='product-price']");
        const descEl = bestCard.querySelector("[data-role='ai-description']");
        const frameEl = bestCard.querySelector("[data-role='frame-image']");
        const matchEl = bestCard.querySelector("[data-role='matchText']");
        const vendorEl = bestCard.querySelector("[data-role='vendor-logo']");
        const linkEl = bestCard.querySelector("[data-role='product-link']");

        setSelectedCardData({
          name: nameEl ? nameEl.innerText : "",
          price: priceEl ? priceEl.innerText : "",
          description: descEl ? descEl.innerText : "",
          frameImageUrl: frameEl ? frameEl.src : "",
          matchText: matchEl ? matchEl.innerText : "",
          vendorLogoUrl: vendorEl ? vendorEl.src : "",
          productUrl: linkEl ? linkEl.href : "",
        });
      }
    }

    // Attach scroll listener as passive (no reflow on each scroll)
    scrollBox.addEventListener("scroll", onScroll, { passive: true });

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
    />
    <!-- Newly added frame-image -->
    <img
      class="frame-image"
      data-role="frame-image"
      src=""
      alt=""
    />

    <!-- Hidden link element; screenNoAnim.js will populate its href -->
    <a data-role="product-link" href="" style="display: none;"></a>

    <!-- Hidden fields (name, price, description) -->
    <div
      data-role="matchText"
      style="display: none; padding: 8px; font-size: 1rem; font-weight: bold;"
    ></div>

    <img
      data-role="vendor-logo"
      src=""
      alt="Vendor Logo"
      style="display: none;"
    />

    <div
      data-role="product-name"
      style="display: none; padding: 8px; font-size: 1rem; font-weight: bold;"
    ></div>
    <div
      data-role="product-price"
      style="display: none; padding: 4px 8px; font-size: 0.9rem; color: #aaf;"
    ></div>
    <div
      data-role="ai-description"
      class="ai-query"
      style="display: none; padding: 8px; font-size: 0.85rem; color: #ddd;"
    ></div>

    <!-- Info button (hidden) -->
    <div
      class="info-button"
      style="display: none; position: absolute; top: 8px; right: 8px; color: #fff; font-size: 1.2rem;"
    >
      &#9432;
    </div>

    <!-- Like/Dislike/Share row (hidden) -->
    <div style="display: none; flex: 1; justify-content: space-around; padding: 8px 0;">
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
        card.addEventListener("mouseenter", () => card.classList.add("opened"));
        card.addEventListener("mouseleave", () => {
          card.classList.remove("opened", "query-opened");
          const ai = card.querySelector("[data-role='ai-description']");
          if (ai) ai.classList.remove("query-opened");
        });
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

      // Run one focus update so the first card is highlighted immediately
      requestAnimationFrame(() => {
        scrollBox.dispatchEvent(new Event("scroll"));
      });
    }
    initializeBelt();

    //
    // ────────────────────────────────────────────────────────────────────────
    // (H) Cleanup on unmount
    // ────────────────────────────────────────────────────────────────────────
    return () => {
      liveObsRef.current?.disconnect();
      scrollBox.removeEventListener("scroll", onScroll, { passive: true });
      if (highlightEl && scrollBox.contains(highlightEl)) {
        scrollBox.removeChild(highlightEl);
      }
      if (injectedScript) document.head.removeChild(injectedScript);
      if (injectedStyle) document.head.removeChild(injectedStyle);
    };
  }, [channelId]);

  //
  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        color: "#fff",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────
           (1) SCROLLABLE BELT: only images are visible here
      ───────────────────────────────────────────────────────────────── */}
      <div
        id="absolute-container"
        ref={scrollBoxRef}
        style={{
          position: "relative", // so that .focus-highlight can be absolute inside
          overflowX: "auto",
          overflowY: "hidden",
          padding: "8px",
          borderRadius: "8px",
          minHeight: "250px",
        }}
      >
        <div
          id="itemContent"
          ref={beltRef}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            padding: "12px 6px",
            alignItems: "flex-start",
            whiteSpace: "nowrap",
          }}
        >
          {/* screenNoAnim.js will insert <div class="item-container product0">…</div> cards here */}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
           (2) DETAILS PANEL: visible when a card is in focus
      ───────────────────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: "16px",
          borderRadius: "8px",
          color: "#fff",
          flex: "1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "stretch",
        }}
      >
        {selectedCardData.name ? (
          <>
            {/* (e) NAME */}
            <h2
              style={{
                margin: "8px 0",
                fontSize: "1.25rem",
                lineHeight: "1.3",
              }}
            >
              {selectedCardData.name}
            </h2>

            {/* (f) DESCRIPTION */}
            <p
              style={{
                margin: "8px 0",
                fontSize: "0.95rem",
                lineHeight: "1.4",
                color: "#ddd",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {/* (c) MATCH TEXT (if present) */}
              {selectedCardData.matchText && (
                <span
                  style={{
                    margin: "12px 0 0 0",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#fff",
                    lineHeight: "110%",
                  }}
                >
                  AI {selectedCardData.matchText}
                </span>
              )}
              {selectedCardData.description}
            </p>

            {/* (g) PRICE */}
            {selectedCardData.price && (
              <p
                style={{
                  margin: "8px 0",
                  fontSize: "1rem",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: "1.4rem",
                }}
              >
                <span
                  style={{
                    margin: "8px 0",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#aaf",
                    marginRight: "0.15rem",
                  }}
                >
                  Price:
                </span>
                {selectedCardData.price}
              </p>
            )}

            {/* (h) CTA + SOCIAL BUTTONS */}
            <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              {/* Shop Now */}
              {selectedCardData.productUrl && (
                <a
                  href={selectedCardData.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "1rem",
                    flex: 1,
                    background: "#556b2f",
                    color: "#fff",
                    textAlign: "center",
                    textDecoration: "none",
                    padding: "10px 0",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                  }}
                >
                  <p>Shop On</p>
                  {/* (d) VENDOR LOGO (if present) */}
                  {selectedCardData.vendorLogoUrl && (
                    <img
                      src={selectedCardData.vendorLogoUrl}
                      alt="Vendor Logo"
                      style={{
                        width: "30px",
                        height: "auto",
                      }}
                    />
                  )}
                </a>
              )}

              {/* Add to Favorites */}
              <button
                style={{
                  flex: 1,
                  background: "#30336b",
                  color: "#fff",
                  border: "none",
                  padding: "10px 0",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
                onClick={() => {
                  alert(
                    `“Add to Favorites” clicked for ${selectedCardData.name}`
                  );
                }}
              >
                Add to Favorites
              </button>
            </div>

            {/* (i) SHARE / LIKE / DISLIKE Buttons */}
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                justifyContent: "space-around",
              }}
            >
              <button
                style={{
                  background: "#444",
                  border: "none",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
                onClick={() => {
                  alert(`Share clicked for ${selectedCardData.name}`);
                }}
              >
                Share
              </button>
              <button
                style={{
                  background: "#444",
                  border: "none",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
                onClick={() => {
                  alert(`Like clicked for ${selectedCardData.name}`);
                }}
              >
                Like
              </button>
              <button
                style={{
                  background: "#444",
                  border: "none",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
                onClick={() => {
                  alert(`Dislike clicked for ${selectedCardData.name}`);
                }}
              >
                Dislike
              </button>
            </div>

            {/* (j) AFFILIATE FOOTER */}
            <p
              style={{
                marginTop: "12px",
                fontSize: "0.85rem",
                color: "var(--color-purple-text)",
              }}
            >
              edgevideo.ai
            </p>
          </>
        ) : (
          <p style={{ color: "#aaa" }}>Loading products…</p>
        )}
      </div>
    </div>
  );
}
