// src/components/LiveShopping.jsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server.browser";
import ChannelLogo from "./ChannelLogo";

import LikeButton from "./buttons/LikeButton";
import DislikeButton from "./buttons/DislikeButton";
import ShareButton from "./buttons/ShareButton";
import ProductCard from "./ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";
import { upvoteProduct, downvoteProduct } from "../legacy/modules/voteModule";

function DetailsPanel({ data, onLike }) {
  if (!data?.name) return null;
  return (
    <div className="live-details" style={{ display: "flex" }}>
      <h2 className="live-product-name">{data.name}</h2>
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
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          {data.matchText && (
            <span
              style={{
                display: "inline",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#fff",
              }}
            >
              AI {data.matchText}
            </span>
          )}
        </span>
        {data.description}
      </p>
      {data.frameImageUrl && (
        <div
          className="live-frame-image-container"
          style={{
            overflow: "hidden",
            aspectRatio: "16/9",
            maxWidth: "calc(200px * 16 / 9)",
            width: "fit-content",
            maxHeight: "200px",
            objectFit: "cover",
            borderRadius: "8px",
            opacity: 1,
            transform: "translateY(0)",
            transition: "opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease",
          }}
        >
          <img
            src={data.frameImageUrl}
            alt={`Frame for ${data.name}`}
            className="live-frame-image"
          />
        </div>
      )}
      {data.price && (
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
          {data.price}
        </p>
      )}
      <div className="product-buttons-container">
        {data.productUrl && (
          <a
            href={data.productUrl}
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
            {data.vendorLogoUrl && (
              <img
                src={data.vendorLogoUrl}
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
          style={{ display: "flex", gap: 16, justifyContent: "space-around" }}
        >
          <LikeButton
            itemId={data.id}
            itemTypeName={data.itemTypeName}
            onSuccess={onLike}
          />
          <DislikeButton
            itemId={data.id}
            itemTypeName={data.itemTypeName}
            onSuccess={onLike}
          />
          <ShareButton title={data.name} url={data.productUrl} />
        </div>
      </div>
    </div>
  );
}

export default function LiveShopping({ channelId, onLike }) {
  // ───────── Refs ─────────
  const scrollBoxRef = useRef(null);
  const beltRef = useRef(null);
  const liveObsRef = useRef(null);

  // ───────── New: throttle flag for requestAnimationFrame ─────────
  const pendingRAF = useRef(false);

  // ───────── add at top of your useEffect ─────────
  const lastBestRef = useRef(null);

  const [allCardData, setAllCardData] = useState([]);

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

  const collectCardData = useCallback((card) => {
    if (!card) return null;
    return {
      id: card.getAttribute("data-product-id"),
      itemTypeName: inferItemTypeName(card),
      name:
        card.querySelector('[data-role="product-name"]')?.innerText || "",
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
    };
  }, []);

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

      const data = collectCardData(liveCard);
      if (data) {
        setAllCardData((prev) => [...prev, data]);
      }

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

    function applyFocus(card) {
      if (!card || card === lastBestRef.current) return;

      if (lastBestRef.current) {
        lastBestRef.current.classList.remove("focused");
      }

      card.classList.add("focused");
      lastBestRef.current = card;

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

      // Frame is always visible; manual toggle removed

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
  }, [channelId, deviceCanHover, handleLike, handleDislike, handleShare, collectCardData]);

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
           (2) DETAILS PANEL: list of all cards
      ───────────────────────────────────────────────────────────────── */}
      <div className="all-live-details">
        {allCardData.map((d, i) => (
          <DetailsPanel key={i} data={d} onLike={onLike} />
        ))}
      </div>
    </div>
  );
}
