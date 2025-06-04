import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import ProfileSidebar from "./components/ProfileSidebar";

// Page components (import as you created above)
import AppPage from "./pages/AppPage";
import InTravelLivestorePage from "./pages/InTravelLivestorePage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <ProfileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <Routes>
        <Route index element={<Navigate to="/app" replace />} />

        {/* Top‐level pages */}
        <Route path="/app" element={<AppPage />} />
        <Route path="/intravel-livestore" element={<InTravelLivestorePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </>
  );
}
