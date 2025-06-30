// src/components/ShoppingTab.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import HomeTab from "./HomeTab";
import LiveShopping from "./LiveShopping";
import FavoritesTab from "./FavoritesTab";

export default function ShoppingTab({ openProfileSidebar }) {
  const nestedConfig = useMemo(
    () => [
      { key: "live", label: "Live Now", Component: LiveShopping },
      { key: "home", label: "Top Picks", Component: HomeTab },
      { key: "favorites", label: "Favorites", Component: FavoritesTab },
    ],
    []
  );

  const [refreshFavoritesKey, setRefreshFavoritesKey] = useState(0);
  const [active, setActive] = useState(nestedConfig[0].key);

  const prevRef = useRef(0);
  const panelRefs = useRef([]);

  if (panelRefs.current.length !== nestedConfig.length) {
    panelRefs.current = nestedConfig.map(
      (_, i) => panelRefs.current[i] || React.createRef()
    );
  }

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
  }, [nestedConfig]);

  useEffect(() => {
    const newIndex = nestedConfig.findIndex((t) => t.key === active);
    const oldIndex = prevRef.current;
    if (newIndex === oldIndex) return;

    const newEl = panelRefs.current[newIndex].current;
    const oldEl = panelRefs.current[oldIndex].current;
    if (!newEl || !oldEl) return;

    newEl.style.transition = "none";
    newEl.style.transform =
      newIndex > oldIndex ? "translateX(100%)" : "translateX(-100%)";
    newEl.offsetWidth;

    oldEl.style.transition = "transform 0.25s ease";
    oldEl.style.transform =
      newIndex > oldIndex ? "translateX(-100%)" : "translateX(100%)";

    newEl.style.transition = "transform 0.25s ease";
    newEl.style.transform = "translateX(0)";

    prevRef.current = newIndex;
  }, [active, nestedConfig]);

  return (
    <>
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
        {nestedConfig.map(({ key }, i) => {
          // pass props into FavoritesTab only
          if (key === "favorites") {
            return (
              <div
                key={key}
                ref={panelRefs.current[i]}
                className="nested-content"
              >
                <FavoritesTab
                  refreshKey={refreshFavoritesKey}
                  onNavigateToLive={() => setActive("live")}
                  openProfileSidebar={openProfileSidebar}
                />
              </div>
            );
          }

          // live and home panels
          return (
            <div
              key={key}
              ref={panelRefs.current[i]}
              className="nested-content"
            >
              {key === "live" ? (
                <LiveShopping onLike={() => setRefreshFavoritesKey((k) => k + 1)} />
              ) : (
                <HomeTab />
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
