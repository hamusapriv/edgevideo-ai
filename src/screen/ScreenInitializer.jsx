import { useEffect, useRef } from "react";
import {
  initProductsFeature,
  initFacesFeature,
  initAuthFeature,
} from "../legacy/screen";
import { getChannelId } from "../legacy/modules/useChannelModule";

export default function ScreenInitializer({ features = [] }) {
  const didInit = useRef({});
  const cleanupRef = useRef([]);

  useEffect(() => {
    // Add a small delay to ensure React has finished rendering
    const timer = setTimeout(() => {
      try {
        // Initialize channel ID once when the component mounts
        const channelId = getChannelId();

        // Only call once per mount for each feature
        if (features.includes("products") && !didInit.current.products) {
          initProductsFeature();
          didInit.current.products = true;
        }
        if (features.includes("faces") && !didInit.current.faces) {
          initFacesFeature();
          didInit.current.faces = true;
        }
        if (features.includes("auth") && !didInit.current.auth) {
          initAuthFeature();
          didInit.current.auth = true;
        }
      } catch (error) {
        console.error("[DOM DEBUG] ScreenInitializer error:", error);
        console.warn("ScreenInitializer error:", error);
      }
    }, 100);

    cleanupRef.current.push(() => clearTimeout(timer));

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, [features]);

  return null;
}
