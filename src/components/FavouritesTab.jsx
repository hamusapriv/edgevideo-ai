// src/components/FavouritesTab.jsx
import React, { useEffect, useRef } from "react";
import { useFavorites } from "../favorites/FavoritesContext";

export default function FavouritesTab({ refreshKey }) {
  const { favorites, removeFavorite, fetchFavorites } = useFavorites();
  const containerRef = useRef(null);
  const pullStartY = useRef(null);

  // re-fetch whenever parent bumps refreshKey
  useEffect(() => {
    fetchFavorites();
  }, [refreshKey, fetchFavorites]);

  // pull‐to‐refresh on touch devices
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onTouchStart(e) {
      // only start if you're scrolled all the way to top
      if (container.scrollTop === 0) {
        pullStartY.current = e.touches[0].clientY;
      } else {
        pullStartY.current = null;
      }
    }

    function onTouchMove(e) {
      if (pullStartY.current === null) return;
      const deltaY = e.touches[0].clientY - pullStartY.current;
      // once you've pulled down 60px, trigger refresh
      if (deltaY > 60) {
        fetchFavorites();
        pullStartY.current = null; // reset so you don't refire immediately
      }
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, [fetchFavorites]);

  if (!favorites.length) {
    return (
      <p style={{ padding: "1rem" }}>Sign in to see your Favorite Products</p>
    );
  }

  return (
    <div
      id="favs"
      className="favs"
      ref={containerRef}
      style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" }}
    >
      {favorites.map((item) => (
        <div
          key={item.item_id}
          className="fav-item"
          data-item-id={item.item_id}
          style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
        >
          <a
            href={item.affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            className="fav-item-link w-inline-block"
            style={{ flex: 1, display: "flex", textDecoration: "none" }}
          >
            <div className="fav-img-container" style={{ marginRight: 8 }}>
              <img
                src={item.image_link}
                loading="lazy"
                alt={item.name}
                className="fav-img"
              />
            </div>
            <h6 className="fav-h" style={{ color: "#fff", lineHeight: 1.2 }}>
              {item.name}
            </h6>
          </a>
          <button
            className="fav-remove"
            aria-label="Remove favorite"
            onClick={() => removeFavorite(item.item_id, item.itemTypeName)}
          >
            Remove From Favorites
          </button>
        </div>
      ))}
    </div>
  );
}
