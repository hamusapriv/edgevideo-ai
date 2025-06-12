// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import ProfileSidebar from "./components/ProfileSidebar";
import { useSidebar } from "./ui/SidebarContext";
// Page components
import AppPage from "./pages/AppPage";
import InTravelLivestorePage from "./pages/InTravelLivestorePage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

// The callback handler you created
import OAuthCallback from "./auth/OAuthCallback";

export default function App() {
  const { isOpen: sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  return (
    <>
      <Header onToggleSidebar={openSidebar} />
      <ProfileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <Routes>
        {/* 1) OAuth callback route */}
        <Route path="/oauth2callback" element={<OAuthCallback />} />

        {/* 2) Default landing */}
        <Route index element={<Navigate to="/app" replace />} />

        {/* 3) Top‐level pages */}
        <Route path="/app" element={<AppPage />} />
        <Route path="/intravel-livestore" element={<InTravelLivestorePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* 4) Fallback */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </>
  );
}
