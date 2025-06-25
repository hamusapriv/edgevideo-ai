// src/components/buttons/LikeButton.jsx
import React, { useEffect, useState } from "react";
import SvgLike from "../svgs/SvgLike";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { upvoteProduct } from "../../legacy/modules/voteModule";
import { useFavorites } from "../../contexts/FavoritesContext";

export default function LikeButton({ itemId, itemTypeName, onSuccess }) {
  const { user } = useAuth();
  const { openSidebar } = useSidebar();
  const { favorites, fetchFavorites } = useFavorites();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!itemId) return setActive(false);
    setActive(favorites.some((f) => String(f.item_id) === String(itemId)));
  }, [favorites, itemId]);

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

    await upvoteProduct(id, typeName);
    setActive(true);
    fetchFavorites();
    onSuccess?.();
  };

  return (
    <button
      className={`product-cta like-button${active ? " clicked" : ""}`}
      data-role="like"
      data-product-id={itemId}
      onClick={handleClick}
    >
      <SvgLike />
    </button>
  );
}
