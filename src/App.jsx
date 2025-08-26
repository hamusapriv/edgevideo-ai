// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProfileSidebar from "./components/ProfileSidebar";
import { useSidebar } from "./contexts/SidebarContext";
import LoadingOverlay from "./components/LoadingOverlay";
import CookieConsent from "./components/CookieConsent";
import AutoDailyCheckIn from "./components/AutoDailyCheckIn";
import SEOHead, { seoConfigs } from "./components/SEOHead";
import DynamicSEO from "./components/DynamicSEO";
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
} from "./components/StructuredData";
import { initializeCookieConsent } from "./utils/cookieManager";
import { initializeGA } from "./utils/analytics";
import { MarketingThemeProvider } from "./contexts/MarketingThemeContext";

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
const SandboxPage = lazy(() => import("./pages/SandboxPage"));
const EuronewsTravelPage = lazy(() => import("./pages/EuronewsTravelPage"));
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
    <MarketingThemeProvider>
      {/* Dynamic SEO based on current route */}
      <DynamicSEO />

      {/* Structured Data for better SEO */}
      <OrganizationStructuredData />
      <WebsiteStructuredData />

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
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookieSettingsPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/viewers" element={<ViewersPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/euronews-travel" element={<EuronewsTravelPage />} />

          {/* Backward compatibility redirects for old URLs */}
          <Route
            path="/privacy-policy"
            element={<Navigate to="/privacy" replace />}
          />
          <Route
            path="/terms-and-services"
            element={<Navigate to="/terms" replace />}
          />
          <Route
            path="/cookie-settings"
            element={<Navigate to="/cookies" replace />}
          />
          <Route
            path="/for-channels"
            element={<Navigate to="/channels" replace />}
          />
          <Route
            path="/for-brands"
            element={<Navigate to="/brands" replace />}
          />
          <Route
            path="/for-viewers"
            element={<Navigate to="/viewers" replace />}
          />

          {/* 4) Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>

      {/* Global components */}
      <AutoDailyCheckIn />
      <CookieConsent />
      <BuildInfo />
    </MarketingThemeProvider>
  );
}
