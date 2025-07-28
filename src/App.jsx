// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProfileSidebar from "./components/ProfileSidebar";
import { useSidebar } from "./contexts/SidebarContext";
import LoadingOverlay from "./components/LoadingOverlay";
import CookieConsent from "./components/CookieConsent";
import { initializeCookieConsent } from "./utils/cookieManager";
import { initializeGA } from "./utils/analytics";

// Page components
const AppPage = lazy(() => import("./pages/AppPage"));
const InTravelLivestorePage = lazy(() =>
  import("./pages/InTravelLivestorePage")
);
const InTravelRedirectPage = lazy(() => import("./pages/InTravelRedirectPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const ChannelsPage = lazy(() => import("./pages/ChannelsPage"));
const BrandsPage = lazy(() => import("./pages/BrandsPage"));
const ViewersPage = lazy(() => import("./pages/ViewersPage"));
const CookieSettingsPage = lazy(() => import("./pages/CookieSettingsPage"));
import BuildInfo from "./components/BuildInfo";

// OAuth callback
import OAuthCallback from "./auth/OAuthCallback";

export default function App() {
  const { isOpen: sidebarOpen, closeSidebar } = useSidebar();
  const { pathname } = useLocation();

  // Initialize cookie consent system on app start
  useEffect(() => {
    // Initialize cookie consent system
    initializeCookieConsent();

    // Initialize Google Analytics with consent-aware setup
    initializeGA();
  }, []);

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
          <Route path="/intravel-redirect" element={<InTravelRedirectPage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/terms-and-services" element={<TermsPage />} />
          <Route path="/cookie-settings" element={<CookieSettingsPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/for-channels" element={<ChannelsPage />} />
          <Route path="/for-brands" element={<BrandsPage />} />
          <Route path="/for-viewers" element={<ViewersPage />} />

          {/* 4) Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>

      <CookieConsent />
      <BuildInfo />
    </>
  );
}
