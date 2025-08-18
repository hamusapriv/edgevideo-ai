// src/utils/cookieManager.js
import { applyGAConsent, clearGACookies } from "./analytics";

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
  // Clear all non-necessary cookies when consent is removed
  clearAllOptionalCookies();
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
    enableMarketingCookies();
  } else {
    disableMarketingCookies();
  }

  // Functional cookies
  if (preferences.functional) {
    enableFunctionalCookies();
  } else {
    disableFunctionalCookies();
  }
};

// Marketing cookies management
const enableMarketingCookies = () => {
  // Add your marketing tracking here
  // Examples:
  // - Facebook Pixel
  // - LinkedIn Insight Tag
  // - Twitter conversion tracking
  // - TikTok Pixel
};

const disableMarketingCookies = () => {
  clearMarketingCookies();
};

const clearMarketingCookies = () => {
  // Clear common marketing cookies
  const marketingCookies = [
    "_fbp",
    "_fbc",
    "fr", // Facebook
    "bcookie",
    "lidc", // LinkedIn
    "personalization_id", // Twitter
    "_ttp", // TikTok
  ];

  clearCookiesByNames(marketingCookies);
};

// Functional cookies management
const enableFunctionalCookies = () => {
  // Enable functional features like:
  // - User preferences
  // - Theme settings
  // - Language preferences
  // - Recent searches
};

const disableFunctionalCookies = () => {
  clearFunctionalCookies();
};

const clearFunctionalCookies = () => {
  // Clear functional cookies
  const functionalCookies = [
    "theme",
    "language",
    "user-preferences",
    "recent-searches",
    "view-mode",
  ];

  clearCookiesByNames(functionalCookies);
};

// Utility function to clear cookies by names
const clearCookiesByNames = (cookieNames) => {
  cookieNames.forEach((cookieName) => {
    // Clear for current domain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Clear for parent domain
    const domain = window.location.hostname.replace(/^www\./, "");
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
    // Clear for subdomain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
  });
};

// Clear all optional cookies (used when consent is revoked)
const clearAllOptionalCookies = () => {
  clearGACookies();
  clearMarketingCookies();
  clearFunctionalCookies();
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

// Initialize consent system on app start
export const initializeCookieConsent = () => {
  const consent = getCookieConsent();

  if (consent) {
    // Apply existing consent preferences
    applyConsent(consent);
  } else {
    // No consent given - disable all optional cookies
    clearAllOptionalCookies();
  }
};
