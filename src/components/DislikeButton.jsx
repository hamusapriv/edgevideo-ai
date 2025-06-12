// src/components/DislikeButton.jsx
import React from "react";
import SvgDislike from "./SvgDislike";
import { useAuth } from "../auth/AuthContext";
import { useSidebar } from "../ui/SidebarContext";
import { downvoteProduct } from "../services/voteService";

export default function DislikeButton({ itemId, itemTypeName, onSuccess }) {
  const { user } = useAuth();
  const { openSidebar } = useSidebar();

  const handleClick = async (e) => {
    e.stopPropagation();
    if (!user) return openSidebar();
    await downvoteProduct(itemId, itemTypeName);
    onSuccess?.(); // bump refresh
  };

  return (
    <button data-role="dislike" onClick={handleClick}>
      <SvgDislike />
    </button>
  );
}
