// src/hooks/useChannelId.js
import { useMemo } from "react";

export const DEFAULT_CHANNEL_ID =
  window.DEFAULT_CHANNEL_ID || "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e";

export function useChannelId() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get("channelId") || DEFAULT_CHANNEL_ID;

    // always store the final value
    try {
      localStorage.setItem("channelId", id);
    } catch {
      // ignore write errors
    }

    return id;
  }, []);
}
