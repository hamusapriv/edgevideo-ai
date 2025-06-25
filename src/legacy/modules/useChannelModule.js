export function getChannelId() {
  const DEFAULT_CHANNEL_ID =
    window.DEFAULT_CHANNEL_ID || "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e";
  const params = new URLSearchParams(window.location.search);
  const id = params.get("channelId") || DEFAULT_CHANNEL_ID;
  try {
    localStorage.setItem("channelId", id);
  } catch {
    /* ignore write errors */
  }
  window.channelId = id;
  return id;
}
