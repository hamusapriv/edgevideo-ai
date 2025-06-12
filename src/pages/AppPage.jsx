// src/pages/AppPage.jsx
import React, { useState, useRef, useEffect } from "react";
import Tabs from "../components/Tabs";
import ProfileSidebar from "../components/ProfileSidebar";

// Import each tab‐pane component:
import ShoppingTab from "../components/ShoppingTab";
import GamesTab from "../components/GamesTab";
import GamesIcon from "../components/GamesIcon";

export default function AppPage() {
  // 1) Build a single array with exactly one entry per tab.
  // To add a new tab, just add another object here with its own `key`, `label`, and `Component`.
  const tabConfig = [
    {
      key: "shopping",
      label: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a48,48,0,0,1-96,0,8,8,0,0,1,16,0,32,32,0,0,0,64,0,8,8,0,0,1,16,0Z" />
        </svg>
      ),
      Component: ShoppingTab,
    },
    {
      key: "games",
      label: <GamesIcon />,
      Component: GamesTab,
    },

    // 🚀 To add a new tab later, just insert another object here:
    // {
    //   key: "profile",
    //   label: <Your SVG or text icon for “profile”>,
    //   Component: ProfileTab,
    // }
  ];

  // 2) Keep track of which tab is active
  const [activeTab, setActiveTab] = useState(tabConfig[0].key);

  // 3) Keep track of the user’s sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleToggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  function handleCloseSidebar() {
    setIsSidebarOpen(false);
  }

  // 4) We’ll need “oldIndex vs newIndex” when the user switches tabs
  const prevIndexRef = useRef(0);

  // 5) Create one ref per tabConfig entry (so we can animate each panel separately)
  const panelRefs = useRef([]);
  if (panelRefs.current.length !== tabConfig.length) {
    panelRefs.current = tabConfig.map(
      (_, i) => panelRefs.current[i] || React.createRef()
    );
  }

  // 6) On first mount **only**: absolutely‐position every panel and set its initial transform
  useEffect(() => {
    tabConfig.forEach((_, i) => {
      const el = panelRefs.current[i].current;
      if (!el) return;

      el.style.position = "absolute";
      el.style.top = "0";
      el.style.left = "0";
      el.style.width = "100%";
      el.style.height = "100%"; // or whatever height you need
      el.style.transition = "transform 0.3s ease";

      // The very first tab (i===0) is visible; all others go off-screen right.
      el.style.transform = i === 0 ? "translateX(0)" : "translateX(100%)";
    });
    // ← Notice: empty dependency array ⇒ run once on mount, never again
  }, []);

  // 7) Whenever activeTab changes, slide old panel out & new one in
  useEffect(() => {
    const newIndex = tabConfig.findIndex((t) => t.key === activeTab);
    const oldIndex = prevIndexRef.current;
    if (newIndex === oldIndex || newIndex < 0) {
      prevIndexRef.current = newIndex;
      return;
    }

    const newEl = panelRefs.current[newIndex].current;
    const oldEl = panelRefs.current[oldIndex].current;
    if (!newEl || !oldEl) {
      prevIndexRef.current = newIndex;
      return;
    }

    // 7.1 Pre‐position the incoming panel off-screen (no transition):
    newEl.style.transition = "none";
    newEl.style.transform =
      newIndex > oldIndex ? "translateX(100%)" : "translateX(-100%)";

    // Force reflow so the browser “sees” that starting transform
    newEl.offsetWidth; // eslint-disable-line no-unused-expressions

    // 7.2 Animate the old panel out:
    oldEl.style.transition = "transform 0.3s ease";
    oldEl.style.transform =
      newIndex > oldIndex ? "translateX(-100%)" : "translateX(100%)";

    // 7.3 Animate the new panel in:
    newEl.style.transition = "transform 0.3s ease";
    newEl.style.transform = "translateX(0)";

    prevIndexRef.current = newIndex;
  }, [activeTab]); // ← only rerun when activeTab changes

  return (
    <>
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {tabConfig.map(({ key, Component }, i) => (
          <div key={key} className="tab-content" ref={panelRefs.current[i]}>
            <Component />
          </div>
        ))}
      </section>

      <Tabs
        tabs={tabConfig}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onToggleSidebar={handleToggleSidebar}
      />

      <ProfileSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
    </>
  );
}
