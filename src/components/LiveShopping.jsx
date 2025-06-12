// src/components/LiveShopping.jsx
import React, { useEffect, useRef, useState } from "react";
import ChannelLogo from "./ChannelLogo";
import { useAuth } from "../auth/AuthContext";
import { useSidebar } from "../ui/SidebarContext";

import LikeButton from "./LikeButton";
import DislikeButton from "./DislikeButton";
import ShareButton from "./ShareButton";

export default function LiveShopping({ channelId, onLike }) {
  const { user } = useAuth();
  const { openSidebar } = useSidebar();
  // ───────── Refs ─────────
  const scrollBoxRef = useRef(null);
  const beltRef = useRef(null);
  const liveObsRef = useRef(null);

  const actionsRef = useRef(null);

  // ───────── New: throttle flag for requestAnimationFrame ─────────
  const pendingRAF = useRef(false);

  // ───────── add at top of your useEffect ─────────
  const lastBestRef = useRef(null);

  // ───────── Selected-card state ─────────
  const [selectedCardData, setSelectedCardData] = useState({
    id: null,
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
    // (A) Inject a <style> that hides all non-image fields
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
    `;
    document.head.appendChild(injectedStyle);

    /*     //
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
    } */

    //
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
      const id = bestCard.getAttribute("data-id"); // ← read it
      setSelectedCardData({
        id,
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

  /* useEffect(() => {
    const container = actionsRef.current;
    if (!container) return;
    container.innerHTML = ""; // clear any old buttons

    const id = selectedCardData.id;
    if (!id) return; // nothing selected yet

    // find the matching belt card
    const card = beltRef.current?.querySelector(
      `.item-container[data-id="${id}"]`
    );
    if (!card) return;

    // grab the real buttons
    const realBtns = card.querySelectorAll(
      "[data-role='share-link'],[data-role='like'],[data-role='dislike']"
    );

    realBtns.forEach((btn) => {
      const clone = btn.cloneNode(true); // copy all attributes & handlers
      clone.style.display = ""; // make visible

      // wrap the click: require login, otherwise call the original
      const original = btn.onclick;
      clone.onclick = (e) => {
        e.stopPropagation();
        if (!user) return openSidebar();
        original?.call(btn, e);
        onLike?.(); // ← tell the parent a like just happened
      };

      container.appendChild(clone);
    });
  }, [selectedCardData.id, user, openSidebar]); */

  //
  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="liveshopping-container" style={{ width: "100%" }}>
      <ChannelLogo className="channel-logo" />{" "}
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
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            padding: "12px 6px",
            alignItems: "flex-start",
            whiteSpace: "nowrap",
            position: "absolute",
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
          borderRadius: "8px",
          color: "rgb(255, 255, 255)",
          flex: "1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "stretch",
          padding: "10px",
        }}
      >
        {selectedCardData.name ? (
          <>
            {/* (e) NAME */}
            <h2
              style={{
                margin: "8px 0",
                fontSize: "1rem",
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
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                gap: "8px",
                justifyContent: "space-between",
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
                    fontWeight: "bald",
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
                        borderRadius: "6px",
                      }}
                    />
                  )}
                </a>
              )}
              {/*  … inside your JSX: */}
              <div
                style={{
                  marginTop: "12px",
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
