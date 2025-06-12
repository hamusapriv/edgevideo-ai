// src/components/LikeButton.jsx
import React from "react";
import SvgLike from "./SvgLike";
import { useAuth } from "../auth/AuthContext";
import { useSidebar } from "../ui/SidebarContext";
import { upvoteProduct } from "../services/voteService";

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
    <button data-role="like" onClick={handleClick}>
      <SvgLike />
    </button>
  );
}
