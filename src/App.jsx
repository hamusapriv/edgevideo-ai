// src/App.jsx
import React from "react";
import ScreenInitializer from "./screen/ScreenInitializer";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProfileSidebar from "./components/ProfileSidebar";
import { useSidebar } from "./contexts/SidebarContext";

// Page components
import AppPage from "./pages/AppPage";
import InTravelLivestorePage from "./pages/InTravelLivestorePage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import HomePage from "./pages/HomePage";

// OAuth callback
import OAuthCallback from "./auth/OAuthCallback";

export default function App() {
  const { isOpen: sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const { pathname } = useLocation();

  // Only show the profile sidebar on /app routes
  const showSidebar = pathname.startsWith("/app");

  return (
    <>
      {showSidebar && (
        <ProfileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      )}

      <ScreenInitializer />

      <Routes>
        {/* 1) OAuth callback */}
        <Route path="/oauth2callback" element={<OAuthCallback />} />

        {/* 2) Default landing */}
        <Route index element={<Navigate to="/app" replace />} />

        {/* 3) Top‐level pages */}
        <Route path="/app" element={<AppPage />} />
        <Route path="/intravel-livestore" element={<InTravelLivestorePage />} />
        <Route path="/privacy-policy" element={<PrivacyPage />} />
        <Route path="/terms-and-services" element={<TermsPage />} />
        <Route path="/home" element={<HomePage />} />

        {/* 4) Fallback */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </>
  );
}
