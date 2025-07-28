// src/utils/analytics.js
// Environment-aware Google Analytics setup

export const getGAId = () => {
  // Use build-time constant if available, fallback to production
  return typeof __GA_ID__ !== "undefined" ? __GA_ID__ : "G-3GZF6H0L3V";
};

// Initialize GA with consent-aware setup
export const initializeGA = () => {
  const gaId = getGAId();

  // Check if user has given consent
  const consent = localStorage.getItem("cookie-consent");
  const hasAnalyticsConsent = consent ? JSON.parse(consent).analytics : false;

  if (window.gtag) {
    if (hasAnalyticsConsent) {
      // User has consented - enable full tracking
      window.gtag("config", gaId, {
        send_page_view: true,
        anonymize_ip: true,
        allow_google_signals: false,
      });
      console.log(`Google Analytics enabled with ID: ${gaId}`);
    } else {
      // User hasn't consented - disable tracking
      window.gtag("config", gaId, {
        send_page_view: false,
        client_storage: "none",
      });
      console.log(`Google Analytics disabled - no consent given`);
    }
  }
};

// Apply consent changes dynamically
export const applyGAConsent = (hasConsent) => {
  const gaId = getGAId();

  if (window.gtag) {
    if (hasConsent) {
      // Enable Google Analytics
      window.gtag("config", gaId, {
        send_page_view: true,
        anonymize_ip: true,
        allow_google_signals: false,
        cookie_expires: 63072000, // 2 years
      });

      // Send a page view for the current page
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
      });

      console.log("Google Analytics cookies enabled");
    } else {
      // Disable Google Analytics and clear existing cookies
      window.gtag("config", gaId, {
        send_page_view: false,
        client_storage: "none",
      });

      // Clear GA cookies
      clearGACookies();

      console.log("Google Analytics cookies disabled and cleared");
    }
  }
};

// Clear Google Analytics cookies
export const clearGACookies = () => {
  // Clear GA cookies
  const gaCookies = [
    "_ga",
    "_ga_" + getGAId().replace("G-", ""),
    "_gid",
    "_gat",
  ];

  gaCookies.forEach((cookieName) => {
    // Clear for current domain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Clear for parent domain
    const domain = window.location.hostname.replace(/^www\./, "");
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
  });

  console.log("Google Analytics cookies cleared");
};
