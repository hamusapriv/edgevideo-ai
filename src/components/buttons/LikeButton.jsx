// src/components/buttons/LikeButton.jsx
import React, { useEffect, useState, useRef } from "react";
import SvgLike from "../svgs/SvgLike";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { upvoteProduct } from "../../legacy/modules/voteModule";
import { useFavorites } from "../../contexts/FavoritesContext";

export default function LikeButton({ itemId, itemTypeName, onSuccess }) {
  const { user } = useAuth();
  const { openSidebar } = useSidebar();
  const { favorites, fetchFavorites, triggerPulse } = useFavorites();
  const [active, setActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    let id = itemId;
    if (!id) {
      const card = btnRef.current?.closest(".item-container");
      id = card?.getAttribute("data-product-id");
    }
    if (!id) return setActive(false);
    setActive(favorites.some((f) => String(f.item_id) === String(id)));
  }, [favorites, itemId]);

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
      await upvoteProduct(id, typeName);

      // Only trigger pulse if this item wasn't already liked
      const wasAlreadyLiked = favorites.some(
        (f) => String(f.item_id) === String(id)
      );
      if (!wasAlreadyLiked) {
        triggerPulse();
      }

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
      className={`product-cta like-button${active ? " clicked" : ""}${
        isLoading ? " loading" : ""
      }${error ? " error" : ""}`}
      data-role="like"
      data-product-id={itemId}
      onClick={handleClick}
      disabled={isLoading}
      title={error || (isLoading ? "Voting..." : active ? "Liked" : "Like")}
    >
      <SvgLike />
    </button>
  );
}
