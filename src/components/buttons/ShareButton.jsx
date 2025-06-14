// src/components/buttons/ShareButton.jsx
import React from "react";
import SvgShare from "../svgs/SvgShare";
import { useAuth } from "../../auth/AuthContext";
import { useSidebar } from "../../ui/SidebarContext";

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
    <button data-role="share-link" onClick={handleClick}>
      <SvgShare />
    </button>
  );
}
