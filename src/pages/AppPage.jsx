// src/pages/AppPage.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import AppHeader from "../components/AppHeader";
import Tabs from "../components/Tabs";
import ProfileSidebar from "../components/ProfileSidebar";

// Tab‐pane components
import ShoppingTab from "../components/ShoppingTab";
import GamesTab from "../components/GamesTab";
import GamesIcon from "../components/svgs/GamesIcon";
import AppBg from "../components/AppBg";
import FAQ from "../components/FAQ";
import { useChannelId } from "../hooks/useChannelId";
import "../styles/app.css";


export default function AppPage() {
  const channelId = useChannelId();

  // 1) Main tabs config
  const tabConfig = useMemo(
    () => [
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
    ],
    []
  );

  // active tab & sidebar state
  const [activeTab, setActiveTab] = useState(tabConfig[0].key);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => setIsSidebarOpen((o) => !o);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // refs for sliding panels
  const prevIndexRef = useRef(0);
  const panelRefs = useRef([]);
  if (panelRefs.current.length !== tabConfig.length) {
    panelRefs.current = tabConfig.map(
      (_, i) => panelRefs.current[i] || React.createRef()
    );
  }

  // initial positioning
  useEffect(() => {
    tabConfig.forEach((_, i) => {
      const el = panelRefs.current[i].current;
      if (!el) return;
      Object.assign(el.style, {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        transition: "transform 0.3s ease",
        transform: i === 0 ? "translateX(0)" : "translateX(100%)",
      });
    });
  }, [tabConfig]);

  // animate on tab change
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

    newEl.style.transition = "none";
    newEl.style.transform =
      newIndex > oldIndex ? "translateX(100%)" : "translateX(-100%)";
    newEl.offsetWidth; // force reflow

    oldEl.style.transition = "transform 0.3s ease";
    oldEl.style.transform =
      newIndex > oldIndex ? "translateX(-100%)" : "translateX(100%)";

    newEl.style.transition = "transform 0.3s ease";
    newEl.style.transform = "translateX(0)";

    prevIndexRef.current = newIndex;
  }, [activeTab, tabConfig]);

  return (
    <>
      <AppHeader onToggleSidebar={handleToggleSidebar} />

      <section
        style={{
          position: "relative",
          flex: "1",
          overflow: "hidden",
        }}
      >
        {tabConfig.map(({ key, Component: TabComponent }, i) => {
          void TabComponent;
          return (
            <div key={key} className="tab-content" ref={panelRefs.current[i]}>
              {key === "shopping" ? (
                <TabComponent
                  channelId={channelId}
                  openProfileSidebar={handleToggleSidebar}
                />
              ) : (
                <TabComponent />
              )}
            </div>
          );
        })}
      </section>

      <Tabs
        tabs={tabConfig}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onToggleSidebar={handleToggleSidebar}
      />

      <ProfileSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      <AppBg />
    </>
  );
}
