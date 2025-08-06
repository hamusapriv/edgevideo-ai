// src/components/FavoritesTab.jsx
import React, { useEffect, useRef, useState } from "react";
import { useFavorites } from "../contexts/FavoritesContext";
import { useAuth } from "../contexts/AuthContext";
import { FormatPrice } from "../legacy/modules/productsModule";
import ConfirmModal from "./ConfirmModal";

export default function FavouritesTab({
  refreshKey,
  onNavigateToLive,
  openProfileSidebar,
}) {
  const { favorites, removeFavorite, fetchFavorites } = useFavorites();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const pullStartY = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({});

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

  // Categorize favorites by item type
  const categorizedFavorites = () => {
    const categories = {
      All: favorites,
      "DB Product": favorites.filter(
        (item) => item.itemTypeName === "DB Product"
      ),
      "DB Ticket": favorites.filter(
        (item) => item.itemTypeName === "DB Ticket"
      ),
      "Viator Ticket": favorites.filter(
        (item) => item.itemTypeName === "Viator Ticket"
      ),
      Deal: favorites.filter((item) => item.itemTypeName === "Deal"),
    };

    // Only return categories that have items
    return Object.fromEntries(
      Object.entries(categories).filter(
        ([key, items]) => key === "All" || items.length > 0
      )
    );
  };

  // Get favorites for selected category and search term
  const getFilteredFavorites = () => {
    let filtered = favorites;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (item) => item.itemTypeName === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        const name = item.name?.toLowerCase() || "";
        const description = item.description?.toLowerCase() || "";
        const itemType = item.itemTypeName?.toLowerCase() || "";

        return (
          name.includes(searchLower) ||
          description.includes(searchLower) ||
          itemType.includes(searchLower)
        );
      });
    }

    return filtered;
  };

  // Delete all favorites in current category
  const handleDeleteAll = async () => {
    if (isDeleting) return;

    const filteredFavorites = getFilteredFavorites();
    if (filteredFavorites.length === 0) return;

    const confirmMessage =
      selectedCategory === "All"
        ? "Are you sure you want to remove all favorite products?"
        : `Are you sure you want to remove all ${selectedCategory} favorites?`;

    // Show custom modal instead of window.confirm
    setConfirmModalData({
      title: "Remove Favorites",
      message: confirmMessage,
      confirmText: "Remove All",
      onConfirm: performDeleteAll,
      variant: "danger",
    });
    setShowConfirmModal(true);
  };

  const performDeleteAll = async () => {
    setIsDeleting(true);

    try {
      const filteredFavorites = getFilteredFavorites();
      // Remove each favorite individually
      const removePromises = filteredFavorites.map((item) =>
        removeFavorite(item.item_id, item.itemTypeName)
      );

      await Promise.allSettled(removePromises);

      // Refresh the data
      await fetchFavorites();
    } catch (error) {
      console.error("Error removing all favorites:", error);
      alert("Some favorites could not be removed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = categorizedFavorites();
  const filteredFavorites = getFilteredFavorites();

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

  // NORMAL STATE: render favorites list with categories
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Category Navigation */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          padding: "1rem 1rem 0.5rem 1rem",
          borderBottom: "1px solid var(--color-purple-text)",
          marginBottom: "0.5rem",
        }}
      >
        {Object.keys(categories).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.85rem",
              border: "1px solid var(--color-purple-text)",
              borderRadius: "20px",
              background:
                selectedCategory === category
                  ? "var(--color-primary)"
                  : "transparent",
              color:
                selectedCategory === category
                  ? "#fff"
                  : "var(--color-purple-text)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            {category} ({categories[category].length})
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div
        style={{
          padding: "0.5rem 1rem",
          borderBottom: "1px solid var(--color-purple-text)",
          marginBottom: "0.5rem",
        }}
      >
        <div className="favorites-search-container">
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="favorites-search-input"
          />
          {/* Search Icon */}
          <svg className="favorites-search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          {/* Clear Search Button */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="favorites-search-clear"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Delete All Button */}
      {filteredFavorites.length > 0 && (
        <div
          style={{
            padding: "0.5rem 1rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handleDeleteAll}
            disabled={isDeleting}
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
              border: "1px solid var(--color-red)",
              borderRadius: "6px",
              background: "transparent",
              color: isDeleting ? "#666" : "var(--color-red)",
              cursor: isDeleting ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: isDeleting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.target.style.background = "var(--color-red)";
                e.target.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.target.style.background = "transparent";
                e.target.style.color = "var(--color-red)";
              }
            }}
          >
            {isDeleting
              ? "Removing..."
              : `Delete All ${
                  selectedCategory === "All" ? "Favorites" : selectedCategory
                }`}
          </button>
        </div>
      )}

      {/* Favorites List */}
      <div
        id="favs"
        className="favs"
        ref={containerRef}
        style={{
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          flex: 1,
          padding: "0 1rem 1rem 1rem",
        }}
      >
        {filteredFavorites.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--color-purple-text)",
              padding: "2rem",
              fontSize: "0.9rem",
            }}
          >
            {searchTerm ? (
              <>
                <p>No favorites found matching "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    background: "var(--color-primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Clear Search
                </button>
              </>
            ) : (
              `No ${
                selectedCategory === "All" ? "" : selectedCategory
              } favorites`
            )}
            found
          </div>
        ) : (
          filteredFavorites.map((item) => {
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
                    {/* Item type badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(0, 0, 0, 0.8)",
                        color: "#fff",
                        fontSize: "0.6rem",
                        padding: "2px 6px",
                        borderRadius: "8px",
                        fontWeight: "500",
                      }}
                    >
                      {item.itemTypeName || "Product"}
                    </div>
                  </div>

                  <div className="fav-content">
                    <h6 className="fav-h">{item.name}</h6>

                    {formattedPrice && (
                      <div className="fav-price">
                        <span className="fav-price-label">Price:</span>
                        <span className="fav-price-value">
                          {formattedPrice}
                        </span>
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
                    onClick={() =>
                      removeFavorite(item.item_id, item.itemTypeName)
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmModalData.title}
        message={confirmModalData.message}
        confirmText={confirmModalData.confirmText}
        cancelText="Cancel"
        onConfirm={confirmModalData.onConfirm}
        variant={confirmModalData.variant}
      />
    </div>
  );
}
