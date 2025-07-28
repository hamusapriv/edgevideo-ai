// src/utils/analytics.js
// Environment-aware Google Analytics setup

export const getGAId = () => {
  // Use build-time constant if available, fallback to production
  return typeof __GA_ID__ !== "undefined" ? __GA_ID__ : "G-3GZF6H0L3V";
};

export const initializeGA = () => {
  const gaId = getGAId();

  if (window.gtag) {
    window.gtag("config", gaId, {
      // Default configuration
      send_page_view: true,
      anonymize_ip: true,
    });
    console.log(`Google Analytics initialized with ID: ${gaId}`);
  }
};

export const applyGAConsent = (hasConsent) => {
  const gaId = getGAId();

  if (window.gtag) {
    if (hasConsent) {
      window.gtag("config", gaId, {
        anonymize_ip: true,
        allow_google_signals: false,
        cookie_expires: 63072000, // 2 years
      });
      console.log("Google Analytics cookies enabled");
    } else {
      window.gtag("config", gaId, {
        send_page_view: false,
        client_storage: "none",
      });
      console.log("Google Analytics cookies disabled");
    }
  }
};
