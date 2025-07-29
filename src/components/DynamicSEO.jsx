import { useLocation } from "react-router-dom";
import SEOHead, { seoConfigs } from "./SEOHead";

/**
 * Dynamic SEO component that automatically updates meta tags based on current route
 */
export default function DynamicSEO() {
  const location = useLocation();

  // Map routes to SEO configurations
  const getSEOConfig = (pathname) => {
    if (pathname === "/" || pathname === "/home") {
      return seoConfigs.home;
    } else if (pathname === "/app") {
      return seoConfigs.app;
    } else if (pathname === "/channels") {
      return seoConfigs.channels;
    } else if (pathname === "/brands") {
      return seoConfigs.brands;
    } else if (pathname === "/demo") {
      return seoConfigs.demo;
    } else if (pathname === "/privacy") {
      return seoConfigs.privacy;
    } else if (pathname === "/terms") {
      return seoConfigs.terms;
    } else if (pathname === "/cookies") {
      return {
        title: "Cookie Settings - Edge Video AI",
        description:
          "Manage your cookie preferences for Edge Video AI. Control how we use cookies to enhance your shoppable TV experience.",
        keywords: "cookie settings, privacy preferences, Edge Video AI cookies",
        url: "https://www.edgevideo.ai/cookies",
      };
    } else if (pathname === "/viewers") {
      return {
        title: "For Viewers - Edge Video AI Interactive Shopping",
        description:
          "Discover how Edge Video AI enhances your viewing experience with interactive shopping, rewards, and gamification features.",
        keywords:
          "interactive viewing, video rewards, gamification, viewer experience",
        url: "https://www.edgevideo.ai/viewers",
      };
    } else if (pathname.startsWith("/intravel")) {
      return {
        title: "InTravel Live Shopping - Edge Video AI",
        description:
          "Experience live shopping with InTravel through Edge Video AI's interactive platform. Shop travel experiences in real-time.",
        keywords:
          "intravel, live travel shopping, interactive travel, travel experiences",
        url: `https://www.edgevideo.ai${pathname}`,
      };
    }

    // Default SEO for unknown routes
    return seoConfigs.app;
  };

  const seoConfig = getSEOConfig(location.pathname);

  return <SEOHead {...seoConfig} />;
}
