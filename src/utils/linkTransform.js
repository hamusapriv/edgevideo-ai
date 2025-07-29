/**
 * Link transformation utilities
 * Note: Geniuslink snippet in index.html automatically converts Amazon links
 */

/**
 * Pass-through function for links since Geniuslink handles conversion automatically
 * Keeping this function to maintain compatibility with existing code
 */
export function transformToGeniusLink(originalUrl) {
  // The Geniuslink snippet in index.html will automatically convert Amazon links
  // So we just return the original URL as-is
  return originalUrl;
}

/**
 * Track outbound link clicks for analytics
 */
export function trackOutboundLink(url, productName = "Unknown Product") {
  try {
    // Log the click for debugging
    console.log("Outbound link clicked:", {
      url,
      product: productName,
      timestamp: new Date().toISOString(),
    });

    // Track with Google Analytics if available
    if (typeof gtag !== "undefined") {
      gtag("event", "click", {
        event_category: "outbound",
        event_label: url,
        transport_type: "beacon",
      });
    }

    return true;
  } catch (err) {
    console.error("Error tracking outbound link:", err);
    return false;
  }
}

/**
 * Tracks outbound link clicks
 */
export function trackOutboundLink(url, itemType = "product") {
  try {
    // Implement Google Analytics tracking if available
    if (window.gtag) {
      window.gtag("event", "click", {
        event_category: "outbound",
        event_label: url,
        item_type: itemType,
      });
    }

    // Also track to internal analytics API
    const trackingUrl = "https://fastapi.edgevideo.ai/tracking/click";
    fetch(trackingUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, item_type: itemType }),
      // Use no-cors to avoid CORS issues with tracking
      mode: "no-cors",
    }).catch(() => {
      // Silently fail tracking to not interrupt user experience
    });
  } catch (err) {
    // Silently fail to not interrupt user experience
    console.error("Error tracking outbound link:", err);
  }
}
