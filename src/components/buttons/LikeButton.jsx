// src/components/buttons/LikeButton.jsx
import React from "react";
import SvgLike from "../svgs/SvgLike";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { upvoteProduct } from "../../services/voteService";

export default function LikeButton({ itemId, itemTypeName, onSuccess }) {
  const { user } = useAuth();
  const { openSidebar } = useSidebar();

  const handleClick = async (e) => {
    e.stopPropagation();
    if (!user) return openSidebar();
    await upvoteProduct(itemId, itemTypeName);
    onSuccess?.();
  };

  return (
    <button className="product-cta" data-role="like" onClick={handleClick}>
      <SvgLike />
    </button>
  );
}
