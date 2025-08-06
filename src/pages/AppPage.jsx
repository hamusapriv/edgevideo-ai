// src/pages/AppPage.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import EdgeLogo from "../assets/edgevideoai-logo.png";
import ChannelLogo from "../components/ChannelLogo";
import Tabs from "../components/Tabs";
import ScreenInitializer from "../screen/ScreenInitializer";
import { useSidebar } from "../contexts/SidebarContext";

// Tab‐pane components
import ShoppingTab from "../components/ShoppingTab";
import GamesTab from "../components/GamesTab";
import GamesIcon from "../components/svgs/GamesIcon";
import QuickAccessTab from "../components/QuickAccessTab";
import AppBg from "../components/AppBg";
import FAQ from "../components/FAQ";
import { useChannelId } from "../hooks/useChannelId";
import "../styles/app.css";

// Import test functions for development
import "../utils/testAIStatus";

function AppPage() {
  console.log("[DOM DEBUG] AppPage render");

  // Use custom hook to get channelId from context or localStorage
  const channelId = useChannelId();
  console.log("[DOM DEBUG] AppPage channelId:", channelId);

  // Use global sidebar state instead of local state
  const { isOpen: isSidebarOpen, openSidebar, closeSidebar } = useSidebar();

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
      {
        key: "quick",
        label: "Quick Access",
        Component: QuickAccessTab,
      },
    ],
    []
  );

  // active tab state
  const [activeTab, setActiveTab] = useState(tabConfig[0].key);

  // Sidebar handlers using global context
  const handleToggleSidebar = () => {
    if (isSidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  };
  const handleCloseSidebar = closeSidebar;

  // refs for sliding panels
  const prevIndexRef = useRef(0);
  const panelRefs = useRef([]);
  if (panelRefs.current.length !== tabConfig.length) {
    panelRefs.current = tabConfig.map(
      (_, i) => panelRefs.current[i] || React.createRef()
    );
  }

  // initial positioning - use CSS classes instead of direct DOM manipulation
  useEffect(() => {
    // Force a re-render to ensure proper CSS classes are applied
    const timer = setTimeout(() => {
      setActiveTab((currentTab) => currentTab);
    }, 0);
    return () => clearTimeout(timer);
  }, [tabConfig]);

  // animate on tab change - use CSS classes instead of direct style manipulation
  useEffect(() => {
    const newIndex = tabConfig.findIndex((t) => t.key === activeTab);
    prevIndexRef.current = newIndex;
  }, [activeTab, tabConfig]);

  return (
    <>
      <ScreenInitializer features={["products", "faces", "auth"]} />
      {/* Injected AppHeader content directly */}
      <header className="header">
        <img src={EdgeLogo} alt="EdgeVideo" height="30" />
        {/* The sidebar‐toggle button has been removed from here */}

        {/* Use channelId from useChannelId hook (state/prop, not window) */}
        {channelId && (
          <ChannelLogo channelId={channelId} className="channel-logo" />
        )}
      </header>

      <section
        style={{
          position: "relative",
          flex: "1",
          overflow: "hidden",
        }}
      >
        {tabConfig.map(({ key, Component: TabComponent }, i) => {
          void TabComponent;
          // Use a key that depends on both tab and channelId to avoid DOM errors
          const panelKey = channelId ? `${key}-${channelId}` : key;
          const currentIndex = tabConfig.findIndex((t) => t.key === activeTab);
          const isActive = i === currentIndex;

          console.log("[DOM DEBUG] AppPage rendering tab:", {
            key,
            panelKey,
            isActive,
            index: i,
            channelId,
          });

          return (
            <div
              key={panelKey}
              className={`tab-content ${
                isActive ? "tab-content-active" : "tab-content-inactive"
              }`}
              ref={panelRefs.current[i]}
              data-tab-index={i}
            >
              {key === "shopping" ? (
                <TabComponent openProfileSidebar={openSidebar} />
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

      <AppBg />
    </>
  );
}

export default AppPage;
