/**
 * Transforms Amazon links to Geni.us affiliate links
 * Used for monetizing product links with geo-targeting
 */
export function transformToGeniusLink(originalUrl) {
  if (!originalUrl) return originalUrl;

  try {
    const url = new URL(originalUrl);

    // Handle Amazon links
    if (
      url.hostname.includes("amazon.com") ||
      url.hostname.includes("amzn.to")
    ) {
      // Extract product ID from URL
      let productId = "";

      // Handle different Amazon URL formats
      if (url.pathname.includes("/dp/")) {
        // Format: amazon.com/dp/B07FCMBLV6
        productId = url.pathname.split("/dp/")[1]?.split("/")[0];
      } else if (url.pathname.includes("/gp/product/")) {
        // Format: amazon.com/gp/product/B07FCMBLV6
        productId = url.pathname.split("/gp/product/")[1]?.split("/")[0];
      } else if (url.hostname.includes("amzn.to")) {
        // For shortened URLs, we'll need to keep as is
        // or implement a server-side resolver
        return originalUrl;
      }

      if (productId) {
        // Replace with your actual geni.us link pattern
        return `https://geni.us/${productId}`;
      }
    }

    // Return original URL if not Amazon or couldn't extract product ID
    return originalUrl;
  } catch (err) {
    console.error("Error transforming link:", err);
    return originalUrl;
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
