import { useEffect } from "react";
import {
  initProductsFeature,
  initFacesFeature,
  initAuthFeature,
} from "../legacy/screen";
export default function ScreenInitializer({ features = [] }) {
  useEffect(() => {
    if (features.includes("products")) {
      initProductsFeature();
    }
    if (features.includes("faces")) {
      initFacesFeature();
    }
    if (features.includes("auth")) {
      initAuthFeature();
    }
  }, [features]);
  return null;
}
