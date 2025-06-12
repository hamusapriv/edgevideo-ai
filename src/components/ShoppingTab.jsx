// src/components/ShoppingTab.jsx
import React, { useState, useRef, useEffect } from "react";
import HomeTab from "./HomeTab";
import LiveShopping from "./LiveShopping";
import FavouritesTab from "./FavouritesTab";

export default function ShoppingTab({ channelId }) {
  const nestedConfig = [
    { key: "live", label: "Live", Component: LiveShopping },
    { key: "home", label: "Home", Component: HomeTab },
    { key: "favourites", label: "Favourites", Component: FavouritesTab },
  ];

  // Key we bump when a like happens
  const [refreshFavouritesKey, setRefreshFavouritesKey] = useState(0);
  const [active, setActive] = useState(nestedConfig[0].key);

  const prevRef = useRef(0);
  const panelRefs = useRef([]);

  // Keep panelRefs in sync with nestedConfig
  if (panelRefs.current.length !== nestedConfig.length) {
    panelRefs.current = nestedConfig.map(
      (_, i) => panelRefs.current[i] || React.createRef()
    );
  }

  // Position panels absolutely on mount
  useEffect(() => {
    panelRefs.current.forEach((r, i) => {
      const el = r.current;
      if (!el) return;
      Object.assign(el.style, {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        transition: "transform 0.25s ease",
        transform: i === 0 ? "translateX(0)" : "translateX(100%)",
      });
    });
  }, []);

  // Slide panels when active changes
  useEffect(() => {
    const newIndex = nestedConfig.findIndex((t) => t.key === active);
    const oldIndex = prevRef.current;
    if (newIndex === oldIndex) return;

    const newEl = panelRefs.current[newIndex].current;
    const oldEl = panelRefs.current[oldIndex].current;
    if (!newEl || !oldEl) return;

    // Prep incoming
    newEl.style.transition = "none";
    newEl.style.transform =
      newIndex > oldIndex ? "translateX(100%)" : "translateX(-100%)";
    newEl.offsetWidth; // force reflow

    // Animate out old
    oldEl.style.transition = "transform 0.25s ease";
    oldEl.style.transform =
      newIndex > oldIndex ? "translateX(-100%)" : "translateX(100%)";

    // Animate in new
    newEl.style.transition = "transform 0.25s ease";
    newEl.style.transform = "translateX(0)";

    prevRef.current = newIndex;
  }, [active]);

  return (
    <>
      {/* Sub-tab buttons */}
      <nav className="nested-tabs">
        {nestedConfig.map(({ key, label }) => (
          <button
            key={key}
            className={`nested-tab${active === key ? " active" : ""}`}
            onClick={() => setActive(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section
        className="subtab-section"
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {nestedConfig.map(({ key, Component }, i) => {
          // Prepare props for this panel
          const panelProps = {};
          if (key === "live") {
            panelProps.channelId = channelId;
            panelProps.onLike = () => setRefreshFavouritesKey((k) => k + 1);
          }
          if (key === "favourites") {
            panelProps.refreshKey = refreshFavouritesKey;
          }

          return (
            <div
              key={key}
              ref={panelRefs.current[i]}
              className="nested-content"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            >
              {key === "live" ? (
                <LiveShopping
                  channelId={channelId}
                  onLike={() => setRefreshFavouritesKey((k) => k + 1)}
                />
              ) : key === "favourites" ? (
                <FavouritesTab refreshKey={refreshFavouritesKey} />
              ) : (
                <Component {...panelProps} />
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
