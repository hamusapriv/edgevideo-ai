import { useEffect, useRef } from "react";
import {
  initProductsFeature,
  initFacesFeature,
  initAuthFeature,
} from "../legacy/screen";
import { getChannelId } from "../legacy/modules/useChannelModule";

export default function ScreenInitializer({ features = [] }) {
  const didInit = useRef({});

  useEffect(() => {
    // Initialize channel ID once when the component mounts
    getChannelId();

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
  }, [features]);
  return null;
}
