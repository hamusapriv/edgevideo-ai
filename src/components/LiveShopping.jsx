// src/components/LiveShopping.jsx
import React, { useEffect, useRef, useState } from "react";
import ChannelLogo from "./ChannelLogo";

import SvgFrame from "./svgs/SvgFrame";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";

export default function LiveShopping({ channelId, onLike }) {
  // ───────── Refs ─────────
  const scrollBoxRef = useRef(null);
  const beltRef = useRef(null);
  const liveObsRef = useRef(null);

  // ───────── New: throttle flag for requestAnimationFrame ─────────
  const pendingRAF = useRef(false);

  // ───────── add at top of your useEffect ─────────
  const lastBestRef = useRef(null);

  // ───────── Selected-card state ─────────
  const [selectedCardData, setSelectedCardData] = useState({
    id: null,
    itemTypeName: "", // ← add this

    name: "",
    price: "",
    description: "",
    frameImageUrl: "",
    matchText: "",
    vendorLogoUrl: "",
    productUrl: "",
  });

  // ───────── Mount & animate frame states ─────────
  const [mountFrame, setMountFrame] = useState(false);
  const [animateFrame, setAnimateFrame] = useState(false);

  // ───────── Detect hover (desktop vs mobile) ─────────
  const deviceCanHover = window.matchMedia("(any-hover:hover)").matches;
  const isDesktop =
    deviceCanHover && window.matchMedia("(min-width: 768px)").matches;

  useEffect(() => {
    let injectedScript = null;
    let injectedStyle = null;

    //
    // ────────────────────────────────────────────────────────────────────────
    // (A) Inject a <style> that hides all non-image fields
    // ────────────────────────────────────────────────────────────────────────
    injectedStyle = document.createElement("style");
    injectedStyle.innerHTML = `
      /* Hide details when card is not opened */
      .item-container:not(.opened) [data-role="product-name"],
      .item-container:not(.opened) [data-role="product-price"],
      .item-container:not(.opened) [data-role="ai-description"],
      .item-container:not(.opened) [data-role="frame-image"],
      .item-container:not(.opened) [data-role="matchText"],
      .item-container:not(.opened) [data-role="vendor-logo"],
      .item-container:not(.opened) .info-button,
      .item-container:not(.opened) [data-role="like"],
      .item-container:not(.opened) [data-role="dislike"],
      .item-container:not(.opened) [data-role="share-link"],
      .item-container:not(.opened) [data-role="product-link"] {
        display: none !important;
      }
    `;
    document.head.appendChild(injectedStyle);

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
      requestAnimationFrame(onScroll);
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

      // nothing to do if no card or it’s the same one
      if (!bestCard || bestCard === lastBestRef.current) return;

      // 1) remove old focus
      if (lastBestRef.current) {
        lastBestRef.current.classList.remove("focused");
      }

      // 2) add new focus
      bestCard.classList.add("focused");
      lastBestRef.current = bestCard;

      // 3) update details panel once
      const id = bestCard.getAttribute("data-product-id");

      function inferItemTypeName(card) {
        const url =
          card
            .querySelector("[data-role='product-link']")
            ?.href?.toLowerCase() || "";
        if (card.classList.contains("ticket-style")) {
          return url.includes("viator") ? "Viator Ticket" : "DB Ticket";
        }
        if (card.classList.contains("coupon-style")) {
          return "Deal";
        }
        return "DB Product";
      }

      setSelectedCardData({
        id,
        itemTypeName: inferItemTypeName(bestCard),

        name:
          bestCard.querySelector('[data-role="product-name"]')?.innerText || "",
        price:
          bestCard.querySelector('[data-role="product-price"]')?.innerText ||
          "",
        description:
          bestCard.querySelector('[data-role="ai-description"]')?.innerText ||
          "",
        frameImageUrl:
          bestCard.querySelector('[data-role="frame-image"]')?.src || "",
        matchText:
          bestCard.querySelector('[data-role="matchText"]')?.innerText || "",
        vendorLogoUrl:
          bestCard.querySelector('[data-role="vendor-logo"]')?.src || "",
        productUrl:
          bestCard.querySelector('[data-role="product-link"]')?.href || "",
      });
    }

    // Attach scroll listener as passive
    scrollBox.addEventListener("scroll", onScroll, { passive: true });

    //
    // ────────────────────────────────────────────────────────────────────────
    // (F) CARD FACTORY: create a minimal `.item-container`
    // ────────────────────────────────────────────────────────────────────────
    function makeCard(isP0 = false) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
  <div class="item-container ${isP0 ? "product0" : ""} ${isDesktop ? "desktop-layout" : ""}">
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

      // Run one focus update so the first card is focused immediately
      requestAnimationFrame(onScroll);
    }
    initializeBelt();

    //
    // ────────────────────────────────────────────────────────────────────────
    // (H) Cleanup on unmount
    // ────────────────────────────────────────────────────────────────────────
    return () => {
      liveObsRef.current?.disconnect();
      scrollBox.removeEventListener("scroll", onScroll, { passive: true });
      if (injectedScript) document.head.removeChild(injectedScript);
      if (injectedStyle) document.head.removeChild(injectedStyle);
    };
  }, [channelId]);

  // when mountFrame flips on, start the entry animation next tick
  useEffect(() => {
    if (mountFrame) {
      requestAnimationFrame(() => {
        setAnimateFrame(true);
      });
    }
  }, [mountFrame]);

  // when animateFrame flips off, unmount after the transition finishes
  useEffect(() => {
    if (!animateFrame && mountFrame) {
      const timer = setTimeout(() => setMountFrame(false), 400);
      return () => clearTimeout(timer);
    }
  }, [animateFrame, mountFrame]);

  // ───────── Hide frame when user focuses a different product ─────────
  useEffect(() => {
    // collapse and unmount immediately
    setAnimateFrame(false);
    setMountFrame(false);
  }, [selectedCardData.id]);

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="liveshopping-container" style={{ width: "100%" }}>
      <ChannelLogo channelId={channelId} className="channel-logo" />{" "}
      {/* ─────────────────────────────────────────────────────────────────
           (1) SCROLLABLE BELT: only images are visible here
      ───────────────────────────────────────────────────────────────── */}
      <div
        id="absolute-container"
        ref={scrollBoxRef}
        style={{
          WebkitOverflowScrolling: "touch",
          position: "relative",
          overflowX: "auto",
          overflowY: "hidden",
          padding: "10px",
          borderRadius: "8px",
          minHeight: "250px",
        }}
      >
        <div
          id="itemContent"
          ref={beltRef}
          style={
            isDesktop
              ? {
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(200px, 1fr))",
                  gridAutoRows: "200px",
                  gap: "12px",
                  padding: "12px 6px",
                  position: "absolute",
                }
              : {
                  display: "flex",
                  flexDirection: "row",
                  padding: "12px 6px",
                  alignItems: "flex-start",
                  whiteSpace: "nowrap",
                  position: "absolute",
                }
          }
        >
          {/* screenNoAnim.js will insert <div class="item-container product0">…</div> cards here */}
        </div>
      </div>
      {/* ─────────────────────────────────────────────────────────────────
           (2) DETAILS PANEL: visible when a card is in focus
      ───────────────────────────────────────────────────────────────── */}
      <div className="live-details">
        {selectedCardData.name ? (
          <>
            {/* (e) NAME */}
            <h2 className="live-product-name">{selectedCardData.name}</h2>

            {/* (f) DESCRIPTION */}
            <p
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                margin: "8px 0",
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
                  marginRight: "8px",
                }}
              >
                {/* (c) MATCH TEXT */}
                {selectedCardData.matchText && (
                  <span
                    style={{
                      display: "inline",
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    AI {selectedCardData.matchText}
                  </span>
                )}

                {/* Inline toggle */}
                <button
                  onClick={() => {
                    if (!mountFrame) {
                      setMountFrame(true);
                    } else {
                      setAnimateFrame(false);
                    }
                  }}
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
                  {animateFrame ? "Hide Frame" : "Show Frame"}
                </button>
              </span>
              {selectedCardData.description}
            </p>

            {/* (d-1) FRAME IMAGE: only when toggled on */}
            {mountFrame && selectedCardData.frameImageUrl && (
              <img
                src={selectedCardData.frameImageUrl}
                alt={`Frame for ${selectedCardData.name}`}
                className="live-frame-image"
                style={{
                  overflow: "hidden",

                  width: "100%",
                  maxHeight: animateFrame ? "200px" : "0px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  opacity: animateFrame ? 1 : 0,
                  transform: animateFrame
                    ? "translateY(0)"
                    : "translateY(-20px)",
                  transition:
                    "opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease",
                }}
              />
            )}

            {/* (g) PRICE */}
            {selectedCardData.price && (
              <p
                style={{
                  margin: "8px 0 12px",
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
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "space-between",
                alignItems: "stretch",
                marginTop: "auto",
                position: "sticky",
                bottom: "0px",
                left: "0",
                right: "0",
                backdropFilter: " blur(10px)",
                padding: "6px",
              }}
            >
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
                  {/* (d) VENDOR LOGO (if present) */}
                  {selectedCardData.vendorLogoUrl && (
                    <img
                      src={selectedCardData.vendorLogoUrl}
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
                  gap: 8,
                  justifyContent: "space-around",
                }}
              >
                <LikeButton
                  itemId={selectedCardData.id}
                  itemTypeName={selectedCardData.itemTypeName}
                  onSuccess={onLike}
                />
                <DislikeButton
                  itemId={selectedCardData.id}
                  itemTypeName={selectedCardData.itemTypeName}
                  onSuccess={onLike}
                />
                <ShareButton
                  title={selectedCardData.name}
                  url={selectedCardData.productUrl}
                />
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
