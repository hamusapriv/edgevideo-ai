// Hook that detects if the device has touch capability (regardless of screen size)
import { useEffect, useState } from "react";

export default function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === "undefined") return false;

    // Check for touch capability - be more conservative
    const hasTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    // Additional check: if it's clearly a desktop browser, prioritize that
    const isDesktopBrowser =
      /Windows|Macintosh|Linux/.test(navigator.userAgent) &&
      !/Mobile|Android|iPhone|iPad/.test(navigator.userAgent);

    console.log("🔍 Touch Detection:", {
      hasTouch,
      isDesktopBrowser,
      userAgent: navigator.userAgent,
      finalResult: hasTouch && !isDesktopBrowser,
    });

    // Only consider it a touch device if it has touch AND isn't clearly a desktop
    return hasTouch && !isDesktopBrowser;
  });

  useEffect(() => {
    // Additional check for touch capability changes (edge case)
    const checkTouchCapability = () => {
      const hasTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0;

      const isDesktopBrowser =
        /Windows|Macintosh|Linux/.test(navigator.userAgent) &&
        !/Mobile|Android|iPhone|iPad/.test(navigator.userAgent);

      const finalResult = hasTouch && !isDesktopBrowser;
      setIsTouchDevice(finalResult);
    };

    // Listen for orientation changes to re-check (mobile specific)
    window.addEventListener("orientationchange", checkTouchCapability);
    window.addEventListener("resize", checkTouchCapability);

    return () => {
      window.removeEventListener("orientationchange", checkTouchCapability);
      window.removeEventListener("resize", checkTouchCapability);
    };
  }, []);

  return isTouchDevice;
}
