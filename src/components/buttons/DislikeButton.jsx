// src/components/buttons/DislikeButton.jsx
import React, { useEffect, useState, useRef } from "react";
import SvgDislike from "../svgs/SvgDislike";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { downvoteProduct } from "../../legacy/modules/voteModule";
import { useFavorites } from "../../contexts/FavoritesContext";

export default function DislikeButton({ itemId, itemTypeName, onSuccess }) {
  const { user } = useAuth();
  const { openSidebar } = useSidebar();
  const { votes, fetchFavorites } = useFavorites();
  const [active, setActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const btn = btnRef.current;
    let id = itemId;
    if (!id) {
      const card = btn?.closest(".item-container");
      id = card?.getAttribute("data-product-id");
    }
    if (!id) return setActive(false);
    const vote = votes.find((v) => String(v.item_id) === String(id));
    if (vote) {
      setActive(vote.vote_type === -1);
    } else {
      setActive(false);
    }
  }, [votes, itemId]);

  function inferItemTypeName(card) {
    const url =
      card?.querySelector("[data-role='product-link']")?.href?.toLowerCase() ||
      "";
    if (card?.classList.contains("ticket-style")) {
      return url.includes("viator") ? "Viator Ticket" : "DB Ticket";
    }
    if (card?.classList.contains("coupon-style")) {
      return "Deal";
    }
    return "DB Product";
  }

  const handleClick = async (e) => {
    e.stopPropagation();

    // Clear any previous error
    setError(null);

    if (!user) return openSidebar();

    let id = itemId;
    let typeName = itemTypeName;

    if (!id) {
      const card = e.currentTarget.closest(".item-container");
      id = card?.getAttribute("data-product-id");
      typeName = inferItemTypeName(card);
    }

    if (!id) return;

    // Prevent multiple clicks while loading
    if (isLoading) return;

    // Optimistically update UI
    setActive(true);
    setIsLoading(true);

    try {
      await downvoteProduct(id, typeName);
      // Refresh favorites in background (don't wait for it)
      fetchFavorites().catch((err) =>
        console.warn("Failed to refresh favorites:", err)
      );
      onSuccess?.();
    } catch (error) {
      console.error("Vote failed:", error);

      // Revert optimistic update
      setActive(false);

      // Set user-friendly error message
      if (error.message.includes("No auth token")) {
        setError("Please log in to vote");
        openSidebar();
      } else if (error.message.includes("500")) {
        setError("Server error. Please try again.");
      } else if (error.message.includes("fetch")) {
        setError("Network error. Check your connection.");
      } else {
        setError("Vote failed. Please try again.");
      }

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      ref={btnRef}
      className={`product-cta dislike-button${active ? " clicked" : ""}${
        isLoading ? " loading" : ""
      }${error ? " error" : ""}`}
      data-role="dislike"
      data-product-id={itemId}
      onClick={handleClick}
      disabled={isLoading}
      title={
        error || (isLoading ? "Voting..." : active ? "Disliked" : "Dislike")
      }
    >
      <SvgDislike />
    </button>
  );
}
