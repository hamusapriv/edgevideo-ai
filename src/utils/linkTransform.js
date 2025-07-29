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
export function trackOutboundLink(
  url,
  clickTypeName = "product",
  itemId = null
) {
  try {
    // Log the click for debugging
    console.log("Outbound link clicked:", {
      url,
      clickTypeName,
      itemId,
      timestamp: new Date().toISOString(),
    });

    // Implement Google Analytics tracking if available
    if (window.gtag) {
      window.gtag("event", "click", {
        event_category: "outbound",
        event_label: url,
        click_type: clickTypeName,
        item_id: itemId,
      });
    }

    // Track to internal analytics API with correct field names
    const trackingUrl = "https://fastapi.edgevideo.ai/tracking/click";
    const payload = {
      url: url,
      clickTypeName: clickTypeName, // API expects this field name
      itemId: itemId, // API expects this field name
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
    };

    fetch(trackingUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          console.warn(
            `Tracking API returned ${response.status}: ${response.statusText}`
          );
        }
        return response.text(); // Use text() instead of json() to handle any response format
      })
      .then((data) => {
        console.log("Tracking successful:", data);
      })
      .catch((error) => {
        console.warn("Tracking failed (non-critical):", error.message);
      });
  } catch (err) {
    // Silently fail to not interrupt user experience
    console.error("Error tracking outbound link:", err);
  }
}
