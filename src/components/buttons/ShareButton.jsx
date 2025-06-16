// src/components/buttons/ShareButton.jsx
import React from "react";
import SvgShare from "../svgs/SvgShare";

export default function ShareButton({ title, url }) {
  const handleClick = (e) => {
    e.stopPropagation();

    let shareTitle = title;
    let shareUrl = url;

    if (!shareUrl) {
      const card = e.currentTarget.closest(".item-container");
      shareTitle =
        shareTitle ||
        card?.querySelector("[data-role='product-name']")?.innerText ||
        "";
      shareUrl = card?.querySelector("[data-role='product-link']")?.href || "";
    }

    if (navigator.share) {
      navigator.share({ title: shareTitle, text: shareTitle, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => alert("Link copied!"));
    }
  };

  return (
    <button
      className="product-cta share-button"
      data-role="share-link"
      onClick={handleClick}
    >
      <SvgShare />
    </button>
  );
}
