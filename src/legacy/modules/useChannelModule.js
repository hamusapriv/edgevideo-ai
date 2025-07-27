// Cache to avoid repeated initialization and logging
let cachedChannelId = null;
let isInitialized = false;

/**
 * Initializes the channel ID once and caches it
 * This should be called when the app starts or when channel changes
 */
function initializeChannelId(forceRefresh = false) {
  if (isInitialized && !forceRefresh && cachedChannelId !== undefined) {
    return cachedChannelId;
  }

  const DEFAULT_CHANNEL_ID =
    window.DEFAULT_CHANNEL_ID || "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e";

  // Priority order: URL params > window.channelId > localStorage
  // NOTE: We removed the default fallback to prevent unwanted products
  let id = null;

  // First, check URL parameters (for /app route compatibility)
  const params = new URLSearchParams(window.location.search);
  const urlChannelId = params.get("channelId");

  if (urlChannelId) {
    // URL parameter exists - use it (for /app route)
    id = urlChannelId;
    console.log("Using URL parameter channelId:", id);
  }
  // If no URL parameter, check window.channelId (for demo page)
  else if (window.channelId) {
    id = window.channelId;
    console.log("Using window.channelId:", id);
  }
  // Then check localStorage (only if we're in /app route context)
  else if (window.location.pathname.startsWith("/app")) {
    try {
      const stored = localStorage.getItem("channelId");
      if (stored) {
        id = stored;
        console.log("Using localStorage channelId:", id);
      }
    } catch {
      /* ignore read errors */
    }

    // For /app route, fall back to default if nothing found
    if (!id) {
      id = DEFAULT_CHANNEL_ID;
      console.log("Using default channelId for /app route:", id);
    }
  }
  // For demo page and other routes, don't fall back to default
  else {
    console.log("No channelId found for demo page - returning null");
  }

  // Update both window and localStorage only if we have a valid ID
  if (id) {
    try {
      localStorage.setItem("channelId", id);
    } catch {
      /* ignore write errors */
    }
    window.channelId = id;
  } else {
    // Clear any stored channel ID when id is null
    try {
      localStorage.removeItem("channelId");
    } catch {
      /* ignore write errors */
    }
    window.channelId = null;
  }

  // Cache the result
  cachedChannelId = id;
  isInitialized = true;

  console.log("Channel ID initialized:", id);
  return id;
}

/**
 * Gets the cached channel ID, initializing if necessary
 * This is now a lightweight operation after first initialization
 */
export function getChannelId() {
  if (cachedChannelId && isInitialized) {
    return cachedChannelId;
  }
  return initializeChannelId();
}

/**
 * Updates the channel ID and refreshes the cache
 * Call this when the user changes channels (e.g., in DemoPage)
 */
export function setChannelId(newChannelId) {
  if (newChannelId === null || newChannelId === undefined) {
    // Only dispatch event if channel was actually set before
    const wasSet = cachedChannelId !== null;

    // Clear the channel ID
    window.channelId = null;
    try {
      localStorage.removeItem("channelId");
    } catch {
      /* ignore write errors */
    }

    // Clear cache
    cachedChannelId = null;
    isInitialized = false;

    console.log("Channel ID cleared");

    // Only dispatch event if channel was actually cleared
    if (wasSet) {
      window.dispatchEvent(
        new CustomEvent("channel-changed", {
          detail: { channelId: null },
        })
      );
    }
    return;
  }

  // Check if channel is actually changing
  const currentChannelId = getChannelId();
  if (currentChannelId === newChannelId) {
    console.log("Channel ID unchanged, not dispatching event:", newChannelId);
    return;
  }

  // Update all storage locations
  window.channelId = newChannelId;
  try {
    localStorage.setItem("channelId", newChannelId);
  } catch {
    /* ignore write errors */
  }

  // Update cache
  cachedChannelId = newChannelId;
  isInitialized = true;

  console.log("Channel ID updated:", newChannelId);

  // Dispatch event to notify WebSocket system of channel change
  window.dispatchEvent(
    new CustomEvent("channel-changed", {
      detail: { channelId: newChannelId },
    })
  );
}
