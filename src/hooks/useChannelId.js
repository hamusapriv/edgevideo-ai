// src/hooks/useChannelId.js
import { useMemo } from "react";
import { getChannelId } from "../legacy/modules/useChannelModule";

export const DEFAULT_CHANNEL_ID =
  window.DEFAULT_CHANNEL_ID || "3d8c4c38-2d6e-483c-bdc5-e1eeeadd155e";

export function useChannelId() {
  return useMemo(() => {
    // Use the same cached getChannelId function to ensure consistency
    return getChannelId();
  }, []);
}
