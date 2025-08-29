// Hook that detects mobile portrait mode
import { useEffect, useState } from "react";

export default function useIsMobilePortrait() {
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window === "undefined") return false;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    return isMobile && isPortrait;
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const orientationQuery = window.matchMedia("(orientation: portrait)");

    function handleChange() {
      const isMobile = mobileQuery.matches;
      const isPortrait = orientationQuery.matches;
      setIsMobilePortrait(isMobile && isPortrait);
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
