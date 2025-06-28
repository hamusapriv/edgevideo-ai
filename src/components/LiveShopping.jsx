// src/components/LiveShopping.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server.browser";
import ChannelLogo from "./ChannelLogo";

import SvgFrame from "./svgs/SvgFrame";
import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import ProductCard from "./ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";
import { upvoteProduct, downvoteProduct } from "../legacy/modules/voteModule";

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
  const [animateFrame, setAnimateFrame] = useState(false);

  // ───────── Detect hover (desktop vs mobile) ─────────
  const deviceCanHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  const { user } = useAuth();
  const { openSidebar } = useSidebar();
  const userRef = useRef(user);
  const onLikeRef = useRef(onLike);
  const sidebarRef = useRef(openSidebar);
  useEffect(() => {
    userRef.current = user;
    onLikeRef.current = onLike;
    sidebarRef.current = openSidebar;
  }, [user, onLike, openSidebar]);

  function inferItemTypeName(target) {
    const url =
      target
        ?.querySelector("[data-role='product-link']")
        ?.href?.toLowerCase() || "";
    if (target?.classList.contains("ticket-style")) {
      return url.includes("viator") ? "Viator Ticket" : "DB Ticket";
    }
    if (target?.classList.contains("coupon-style")) {
      return "Deal";
    }
    return "DB Product";
  }

  const handleLike = useCallback(async (e) => {
    e.stopPropagation();
    if (!userRef.current) return sidebarRef.current();

    const card = e.currentTarget.closest(".item-container");
    const id = card?.getAttribute("data-product-id");
    if (!id) return;

    await upvoteProduct(id, inferItemTypeName(card));
    const likeBtn = card.querySelector('[data-role="like"]');
    const dislikeBtn = card.querySelector('[data-role="dislike"]');
    likeBtn?.classList.add("clicked");
    dislikeBtn?.classList.remove("clicked");
    onLikeRef.current?.();
  }, []);

  const handleDislike = useCallback(async (e) => {
    e.stopPropagation();
    if (!userRef.current) return sidebarRef.current();

    const card = e.currentTarget.closest(".item-container");
    const id = card?.getAttribute("data-product-id");
    if (!id) return;

    await downvoteProduct(id, inferItemTypeName(card));
    const likeBtn = card.querySelector('[data-role="like"]');
    const dislikeBtn = card.querySelector('[data-role="dislike"]');
    likeBtn?.classList.remove("clicked");
    dislikeBtn?.classList.add("clicked");
    onLikeRef.current?.();
  }, []);

  const handleShare = useCallback((e) => {
    e.stopPropagation();
    const card = e.currentTarget.closest(".item-container");
    const shareTitle =
      card?.querySelector("[data-role='product-name']")?.innerText || "";
    const shareUrl =
      card?.querySelector("[data-role='product-link']")?.href || "";

    if (navigator.share) {
      navigator.share({ title: shareTitle, text: shareTitle, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => alert("Link copied!"));
    }
  }, []);

  useEffect(() => {
    let injectedScript = null;
    let injectedStyle = null;

    //
    // ────────────────────────────────────────────────────────────────────────
    // (A) Inject a <style> that hides all non-image fields on devices without hover
    // ────────────────────────────────────────────────────────────────────────
    if (!deviceCanHover) {
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
    }

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

    // helper: detect if user is near the end of the scroll container
    const SCROLL_THRESHOLD = 100;
    function isNearEnd() {
      const maxX = belt.scrollWidth - scrollBox.clientWidth;
      const maxY = belt.scrollHeight - scrollBox.clientHeight;
      if (maxX > 0) {
        return scrollBox.scrollLeft >= maxX - SCROLL_THRESHOLD;
      }
      if (maxY > 0) {
        return scrollBox.scrollTop >= maxY - SCROLL_THRESHOLD;
      }
      return false;
    }

    function scrollToEnd() {
      requestAnimationFrame(() => {
        const maxX = belt.scrollWidth - scrollBox.clientWidth;
        const maxY = belt.scrollHeight - scrollBox.clientHeight;
        if (maxX > 0) {
          scrollBox.scrollTo({ left: maxX, behavior: "smooth" });
        } else if (maxY > 0) {
          scrollBox.scrollTo({ top: maxY, behavior: "smooth" });
        }
      });
    }

    //
    // ────────────────────────────────────────────────────────────────────────
    // (D) Helper to append a fresh “product0” placeholder whenever the current one’s <img> changes
    // ────────────────────────────────────────────────────────────────────────
    function smoothAppend() {
      const liveCard = belt.querySelector(".product0");
      if (!liveCard) return;

      const shouldScroll = isNearEnd();

      // Remove “product0” from the old card so it becomes a “static” card
      liveCard.classList.remove("product0");

      // Create a brand-new placeholder, with class="product0"
      const fresh = makeCard(true);
      belt.append(fresh);

      if (shouldScroll) {
        setTimeout(() => {
          scrollToEnd();
        }, 500);
      }

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

    let frameOpenTimer = null;
    let frameCloseTimer = null;

    function applyFocus(card) {
      if (!card || card === lastBestRef.current) return;

      // 1) clear any pending open/close timers
      clearTimeout(frameOpenTimer);
      clearTimeout(frameCloseTimer);

      // 2) tear down the previously-focused card
      if (lastBestRef.current) {
        lastBestRef.current.classList.remove("focused");
        const prevContainer = lastBestRef.current.querySelector(
          '[data-role="frame-container"]'
        );

        const prevText = lastBestRef.current.querySelector(
          '[data-role="toggle-text"]'
        );
        if (prevContainer) {
          prevContainer.dataset.visible = "false";
          prevContainer.style.maxHeight = "0px";
          prevContainer.style.opacity = "0";
          prevContainer.style.transform = "translateY(-20px)";
        }
        if (prevText) prevText.textContent = "Show Frame";
      }

      // 3) focus this new card
      card.classList.add("focused");
      lastBestRef.current = card;

      // pull out the elements we'll animate
      const frameContainer = card.querySelector(
        '[data-role="frame-container"]'
      );
      const toggleText = card.querySelector('[data-role="toggle-text"]');

      // 4) immediately collapse it
      frameContainer.dataset.visible = "false";
      frameContainer.style.maxHeight = "0px";
      frameContainer.style.opacity = "0";
      frameContainer.style.transform = "translateY(-20px)";
      if (toggleText) toggleText.textContent = "Show Frame";

      // 5) open after 0.5s…
      frameOpenTimer = setTimeout(() => {
        frameContainer.dataset.visible = "true";
        frameContainer.style.maxHeight = "200px";
        frameContainer.style.opacity = "1";
        frameContainer.style.transform = "translateY(0)";
        if (toggleText) toggleText.textContent = "Hide Frame";

        // 6) …then auto-close after 2s
        frameCloseTimer = setTimeout(() => {
          frameContainer.dataset.visible = "false";
          frameContainer.style.maxHeight = "0px";
          frameContainer.style.opacity = "0";
          frameContainer.style.transform = "translateY(-20px)";
          if (toggleText) toggleText.textContent = "Show Frame";
        }, 2000);
      }, 500);

      // 7) finally, update your details panel as before
      const id = card.getAttribute("data-product-id");
      setSelectedCardData({
        id,
        itemTypeName: inferItemTypeName(card),
        name: card.querySelector('[data-role="product-name"]')?.innerText || "",
        price:
          card.querySelector('[data-role="product-price"]')?.innerText || "",
        description:
          card.querySelector('[data-role="ai-description"]')?.innerText || "",
        frameImageUrl:
          card.querySelector('[data-role="frame-image"]')?.src || "",
        matchText:
          card.querySelector('[data-role="matchText"]')?.innerText || "",
        vendorLogoUrl:
          card.querySelector('[data-role="vendor-logo"]')?.src || "",
        productUrl:
          card.querySelector('[data-role="product-link"]')?.href || "",
      });
    }

    // ───────── updateFocusDuringScroll: only run when focus really changes ─────────
    function updateFocusDuringScroll() {
      const containerRect = scrollBox.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const scrollLeft = scrollBox.scrollLeft;
      const maxScroll = belt.scrollWidth - containerWidth;

      const START = 190;
      const END = containerWidth - 190;
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
      wrapper.innerHTML = renderToStaticMarkup(
        <ProductCard isP0={isP0} showDetails={deviceCanHover} />
      );
      const card = wrapper.firstElementChild;
      if (card && deviceCanHover) {
        card.addEventListener("mouseenter", () => applyFocus(card));
      }

      const toggle = card.querySelector('[data-role="frame-toggle"]');
      const container = card.querySelector('[data-role="frame-container"]');
      const text = card.querySelector('[data-role="toggle-text"]');
      if (toggle && container) {
        container.dataset.visible = "false";
        toggle.addEventListener("click", (e) => {
          e.stopPropagation();
          const visible = container.dataset.visible === "true";
          const next = !visible;
          container.dataset.visible = next ? "true" : "false";
          container.style.maxHeight = next ? "200px" : "0px";
          container.style.opacity = next ? "1" : "0";
          container.style.transform = next
            ? "translateY(0)"
            : "translateY(-20px)";
          if (text) text.textContent = next ? "Hide Frame" : "Show Frame";
        });
      }

      const like = card.querySelector('[data-role="like"]');
      if (like) like.addEventListener("click", handleLike);
      const dislike = card.querySelector('[data-role="dislike"]');
      if (dislike) dislike.addEventListener("click", handleDislike);
      const share = card.querySelector('[data-role="share-link"]');
      if (share) share.addEventListener("click", handleShare);

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
      if (injectedStyle) document.head.removeChild(injectedStyle);
    };
  }, [channelId, deviceCanHover, handleLike, handleDislike, handleShare]);

  // ───────── Hide frame when user focuses a different product ─────────
  useEffect(() => {
    // collapse any existing frame
    setAnimateFrame(false);

    // open after 0.5 seconds
    const timer = setTimeout(() => {
      setAnimateFrame(true);
    }, 1000);

    // clear timeout if we switch focus again
    return () => clearTimeout(timer);
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
      <div id="absolute-container" ref={scrollBoxRef}>
        <div id="itemContent" ref={beltRef}></div>
      </div>
      {/* ─────────────────────────────────────────────────────────────────
           (2) DETAILS PANEL: visible when a card is in focus
      ───────────────────────────────────────────────────────────────── */}
      <div
        className="live-details"
        style={{ display: deviceCanHover ? "none" : "flex" }}
      >
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
                    setAnimateFrame((prev) => !prev);
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
            {selectedCardData.frameImageUrl && (
              <div
                className="live-frame-image-container"
                style={{
                  overflow: "hidden",
                  aspectRatio: "16/9",
                  maxWidth: "calc(200px * 16 / 9)",
                  width: "fit-content",
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
              >
                <img
                  src={selectedCardData.frameImageUrl}
                  alt={`Frame for ${selectedCardData.name}`}
                  className="live-frame-image"
                />
              </div>
            )}
            {/* (g) PRICE */}
            {selectedCardData.price && (
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
                {selectedCardData.price}
              </p>
            )}

            {/* (h) CTA + SOCIAL BUTTONS */}
            <div className="product-buttons-container">
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
                  gap: 16,
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
