// src/hooks/useChannelId.js
import { useMemo } from "react";

const DEFAULT_CHANNEL_ID = "ba08370c-0362-462d-b299-97cc36973340";

export function useChannelId() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    let id =
      params.get("channelId") ||
      localStorage.getItem("channelId") ||
      DEFAULT_CHANNEL_ID;

    // always store the final value
    try {
      localStorage.setItem("channelId", id);
    } catch {}

    return id;
  }, []);
}
