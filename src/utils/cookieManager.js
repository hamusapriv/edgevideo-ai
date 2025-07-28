// src/utils/cookieManager.js
import { applyGAConsent } from "./analytics";

// Cookie consent utilities
export const getCookieConsent = () => {
  const consent = localStorage.getItem("cookie-consent");
  return consent ? JSON.parse(consent) : null;
};

export const setCookieConsent = (preferences) => {
  localStorage.setItem("cookie-consent", JSON.stringify(preferences));
  applyConsent(preferences);
};

export const clearCookieConsent = () => {
  localStorage.removeItem("cookie-consent");
};

export const hasGivenConsent = () => {
  return getCookieConsent() !== null;
};

// Apply consent preferences to various services
export const applyConsent = (preferences) => {
  // Google Analytics
  applyGAConsent(preferences.analytics);

  // Marketing cookies
  if (preferences.marketing) {
    // Enable marketing tracking
    console.log("Marketing cookies enabled");
  } else {
    // Disable marketing tracking
    console.log("Marketing cookies disabled");
  }

  // Functional cookies
  if (preferences.functional) {
    // Enable functional features
    console.log("Functional cookies enabled");
  } else {
    // Limit functional features
    console.log("Functional cookies disabled");
  }
};

// Show cookie consent banner programmatically
export const showCookieConsent = () => {
  clearCookieConsent();
  // Force re-render of the cookie consent component
  window.dispatchEvent(new CustomEvent("show-cookie-consent"));
};

// Default preferences
export const getDefaultPreferences = () => ({
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
});

// GDPR compliance helper
export const isGDPRRegion = () => {
  // This could be enhanced with actual geolocation detection
  // For now, assume all users need consent
  return true;
};
