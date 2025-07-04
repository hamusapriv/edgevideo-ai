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
      ref={btnRef}
      className={`product-cta dislike-button${active ? " clicked" : ""}`}
      data-role="dislike"
      data-product-id={itemId}
      onClick={handleClick}
    >
      <SvgDislike />
    </button>
  );
}
