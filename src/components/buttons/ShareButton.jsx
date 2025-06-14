// src/components/buttons/ShareButton.jsx
import React from "react";
import SvgShare from "../svgs/SvgShare";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";

export default function ShareButton({ title, url }) {
  const { user } = useAuth();
  const { openSidebar } = useSidebar();

  const handleClick = (e) => {
    e.stopPropagation();
    if (!user) return openSidebar();
    if (navigator.share) {
      navigator.share({ title, text: title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
    }
  };

  return (
    <button
      className="product-cta"
      data-role="share-link"
      onClick={handleClick}
    >
      <SvgShare />
    </button>
  );
}
