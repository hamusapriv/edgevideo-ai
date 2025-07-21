export function getChannelId() {
  const DEFAULT_CHANNEL_ID =
    window.DEFAULT_CHANNEL_ID || "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e";

  // Priority order: URL params > window.channelId > localStorage > default
  // This ensures /app route works correctly with ?channelId=... parameter
  let id;

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
  // Then check localStorage
  else {
    try {
      const stored = localStorage.getItem("channelId");
      if (stored) {
        id = stored;
        console.log("Using localStorage channelId:", id);
      }
    } catch {
      /* ignore read errors */
    }
  }

  // Fallback to default if nothing found
  if (!id) {
    id = DEFAULT_CHANNEL_ID;
    console.log("Using default channelId:", id);
  }

  // Update both window and localStorage
  try {
    localStorage.setItem("channelId", id);
  } catch {
    /* ignore write errors */
  }
  window.channelId = id;

  console.log("getChannelId returning:", id);
  return id;
}
