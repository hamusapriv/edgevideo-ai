// Hook that determines layout preference (mobile vs desktop UI)
import { useEffect, useState } from "react";

export default function useLayoutPreference() {
  const [layoutPreference, setLayoutPreference] = useState(() => {
    if (typeof window === "undefined") return "desktop";

    // Check screen size and orientation
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Consider it mobile layout if:
    // 1. Width is less than 768px (typical mobile breakpoint)
    // 2. OR if it's a portrait orientation regardless of size (phone rotated back)
    const isMobileLayout = width < 768 || width < height;

    return isMobileLayout ? "mobile" : "desktop";
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update layout preference based on current dimensions
      const isMobileLayout = width < 768 || width < height;
      setLayoutPreference(isMobileLayout ? "mobile" : "desktop");
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return layoutPreference;
}
