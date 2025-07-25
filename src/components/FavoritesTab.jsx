// src/components/FavoritesTab.jsx
import React, { useEffect, useRef } from "react";
import { useFavorites } from "../contexts/FavoritesContext";
import { useAuth } from "../contexts/AuthContext";
import { FormatPrice } from "../legacy/modules/productsModule";

export default function FavouritesTab({
  refreshKey,
  onNavigateToLive,
  openProfileSidebar,
}) {
  const { favorites, removeFavorite, fetchFavorites } = useFavorites();
  const { user } = useAuth();
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
      if (container.scrollTop === 0) {
        pullStartY.current = e.touches[0].clientY;
      } else {
        pullStartY.current = null;
      }
    }

    function onTouchMove(e) {
      if (pullStartY.current === null) return;
      const deltaY = e.touches[0].clientY - pullStartY.current;
      if (deltaY > 60) {
        fetchFavorites();
        pullStartY.current = null;
      }
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, [fetchFavorites]);

  // EMPTY STATES
  if (!favorites.length) {
    if (user) {
      // logged-in, no favorites
      return (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <p style={{ marginBottom: "1rem", color: "#fff", lineHeight: "1.5" }}>
            You haven’t liked any products yet. Discover something you love in
            Live Shopping!
          </p>
          <button onClick={onNavigateToLive} className="favorites-cta">
            Go to Live
          </button>
        </div>
      );
    } else {
      // not signed-in
      return (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <p style={{ marginBottom: "1rem", color: "#fff", lineHeight: "1.5" }}>
            Sign in to see your Favorite Products
          </p>
          <button onClick={openProfileSidebar} className="favorites-cta">
            Sign In
          </button>
        </div>
      );
    }
  }

  // NORMAL STATE: render favorites list
  return (
    <div
      id="favs"
      className="favs"
      ref={containerRef}
      style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" }}
    >
      {favorites.map((item) => {
        // Format price if available
        const formattedPrice = item.price
          ? FormatPrice(item.price, item.currency || "USD")
          : null;

        // Get AI explanation/description
        const aiExplanation = item.explanation || item.description || null;

        return (
          <div
            key={item.item_id}
            className="fav-item"
            data-item-id={item.item_id}
          >
            <div className="fav-item-link">
              <div className="fav-img-container">
                <img
                  src={item.image_link}
                  loading="lazy"
                  alt={item.name}
                  className="fav-img"
                />
              </div>

              <div className="fav-content">
                <h6 className="fav-h">{item.name}</h6>

                {formattedPrice && (
                  <div className="fav-price">
                    <span className="fav-price-label">Price:</span>
                    <span className="fav-price-value">{formattedPrice}</span>
                  </div>
                )}

                {aiExplanation && (
                  <div className="fav-description">
                    <span className="fav-description-label">
                      AI Description:
                    </span>
                    <p className="fav-description-text">{aiExplanation}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="fav-actions">
              {item.affiliate_link && (
                <a
                  href={item.affiliate_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fav-buy-button"
                >
                  Buy Now
                </a>
              )}

              <button
                className="fav-remove"
                aria-label="Remove favorite"
                onClick={() => removeFavorite(item.item_id, item.itemTypeName)}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
