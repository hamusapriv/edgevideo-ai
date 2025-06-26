// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProfileSidebar from "./components/ProfileSidebar";
import { useSidebar } from "./contexts/SidebarContext";
import LoadingOverlay from "./components/LoadingOverlay";

// Page components
const AppPage = lazy(() => import("./pages/AppPage"));
const InTravelLivestorePage = lazy(() =>
  import("./pages/InTravelLivestorePage")
);
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
import BuildInfo from "./components/BuildInfo";

// OAuth callback
import OAuthCallback from "./auth/OAuthCallback";

export default function App() {
  const { isOpen: sidebarOpen, closeSidebar } = useSidebar();
  const { pathname } = useLocation();

  // Only show the profile sidebar on /app routes
  const showSidebar = pathname.startsWith("/app");

  return (
    <>
      {showSidebar && (
        <ProfileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      )}

      <Suspense fallback={<LoadingOverlay message="Loading..." />}>
        <Routes>
          {/* 1) OAuth callback */}
          <Route path="/oauth2callback" element={<OAuthCallback />} />
          <Route path="/app/oauth2callback" element={<OAuthCallback />} />

          {/* 2) Default landing */}
          <Route index element={<Navigate to="/home" replace />} />

          {/* 3) Top‐level pages */}
          <Route path="/app" element={<AppPage />} />
          <Route
            path="/intravel-livestore"
            element={<InTravelLivestorePage />}
          />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/terms-and-services" element={<TermsPage />} />
          <Route path="/home" element={<HomePage />} />

          {/* 4) Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
      <BuildInfo />
    </>
  );
}
