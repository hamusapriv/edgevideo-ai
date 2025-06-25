// src/components/buttons/DislikeButton.jsx
import React, { useEffect, useState } from "react";
import SvgDislike from "../svgs/SvgDislike";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { downvoteProduct } from "../../services/voteService";
import { useFavorites } from "../../contexts/FavoritesContext";

export default function DislikeButton({ itemId, itemTypeName, onSuccess }) {
  const { user } = useAuth();
  const { openSidebar } = useSidebar();
  const { fetchFavorites } = useFavorites();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [itemId]);

  function inferItemTypeName(card) {
    const url =
      card?.querySelector("[data-role='product-link']")?.href?.toLowerCase() || "";
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
    if (!user) return openSidebar();

    let id = itemId;
    let typeName = itemTypeName;

    if (!id) {
      const card = e.currentTarget.closest(".item-container");
      id = card?.getAttribute("data-product-id");
      typeName = inferItemTypeName(card);
    }

    if (!id) return;

    await downvoteProduct(id, typeName);
    setActive(true);
    fetchFavorites();
    onSuccess?.();
  };

  return (
    <button
      className={`product-cta dislike-button${active ? " clicked" : ""}`}
      data-role="dislike"
      data-product-id={itemId}
      onClick={handleClick}
    >
      <SvgDislike />
    </button>
  );
}
