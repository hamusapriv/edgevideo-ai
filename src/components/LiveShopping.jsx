// src/components/LiveShopping.jsx
import React, { useEffect, useRef, useCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server.browser";
import ChannelLogo from "./ChannelLogo";

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

    //
    // ────────────────────────────────────────────────────────────────────────
    // (A) Previously, details were hidden on non-hover devices. This style
    //     injection is removed so each product always displays its details.
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
        <ProductCard isP0={isP0} showDetails />
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
    };
  }, [channelId, deviceCanHover, handleLike, handleDislike, handleShare]);

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
      {/* The single details panel was removed so each product card now displays
          its details individually. */}
    </div>
  );
}
