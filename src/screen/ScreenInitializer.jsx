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

  console.log("[DOM DEBUG] ScreenInitializer render with features:", features);

  useEffect(() => {
    console.log("[DOM DEBUG] ScreenInitializer useEffect triggered");

    // Add a small delay to ensure React has finished rendering
    const timer = setTimeout(() => {
      try {
        console.log("[DOM DEBUG] ScreenInitializer timer callback executing");

        // Initialize channel ID once when the component mounts
        const channelId = getChannelId();
        console.log("[DOM DEBUG] Current channel ID:", channelId);

        // Only call once per mount for each feature
        if (features.includes("products") && !didInit.current.products) {
          console.log("[DOM DEBUG] Initializing products feature");
          initProductsFeature();
          didInit.current.products = true;
        }
        if (features.includes("faces") && !didInit.current.faces) {
          console.log("[DOM DEBUG] Initializing faces feature");
          initFacesFeature();
          didInit.current.faces = true;
        }
        if (features.includes("auth") && !didInit.current.auth) {
          console.log("[DOM DEBUG] Initializing auth feature");
          initAuthFeature();
          didInit.current.auth = true;
        }

        console.log("[DOM DEBUG] ScreenInitializer initialization completed");
      } catch (error) {
        console.error("[DOM DEBUG] ScreenInitializer error:", error);
        console.warn("ScreenInitializer error:", error);
      }
    }, 100);

    cleanupRef.current.push(() => clearTimeout(timer));

    return () => {
      console.log("[DOM DEBUG] ScreenInitializer cleanup");
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, [features]);

  return null;
}
