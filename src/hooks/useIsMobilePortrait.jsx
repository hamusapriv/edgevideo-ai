// Hook that detects mobile portrait mode
import { useEffect, useState } from "react";

export default function useIsMobilePortrait() {
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window === "undefined") return false;

    // Check if it's actually a mobile device (no hover capability)
    const isMobileDevice = window.matchMedia("(hover: none)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;

    // Only reverse frames for actual mobile devices in portrait, not narrow desktop windows
    return isMobileDevice && isPortrait;
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia("(hover: none)");
    const orientationQuery = window.matchMedia("(orientation: portrait)");

    function handleChange() {
      const isMobileDevice = mobileQuery.matches;
      const isPortrait = orientationQuery.matches;
      setIsMobilePortrait(isMobileDevice && isPortrait);
    }

    mobileQuery.addEventListener("change", handleChange);
    orientationQuery.addEventListener("change", handleChange);

    return () => {
      mobileQuery.removeEventListener("change", handleChange);
      orientationQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isMobilePortrait;
}
