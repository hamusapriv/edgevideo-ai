import { useEffect } from "react";

/**
 * SEO Head component for dynamically updating page meta tags
 * Updates document head based on current page/route
 */
export default function SEOHead({
  title = "Edge Video AI - Shoppable TV & AI-Powered Interactive Video Streaming",
  description = "Revolutionary AI-powered shoppable TV platform that transforms passive video watching into interactive shopping experiences. Watch, scan QR codes, and shop directly from live streams.",
  keywords = "shoppable tv, interactive video, AI streaming, live shopping, video commerce, edge video ai, real-time shopping, video streaming, interactive tv, AI powered shopping",
  image = "https://edgevideo.ai/assets/hero-image.png",
  url = "https://edgevideo.ai/app",
  type = "website",
}) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Function to update or create meta tag
    const updateMetaTag = (name, content, property = false) => {
      const attribute = property ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }

      meta.setAttribute("content", content);
    };

    // Update basic meta tags
    updateMetaTag("title", title);
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Update Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:type", type, true);

    // Update Twitter tags
    updateMetaTag("twitter:title", title, true);
    updateMetaTag("twitter:description", description, true);
    updateMetaTag("twitter:image", image, true);
    updateMetaTag("twitter:url", url, true);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, keywords, image, url, type]);

  return null; // This component doesn't render anything
}

// Pre-defined SEO configurations for different pages
export const seoConfigs = {
  home: {
    title:
      "Edge Video AI - Shoppable TV & AI-Powered Interactive Video Streaming",
    description:
      "Revolutionary AI-powered shoppable TV platform that transforms passive video watching into interactive shopping experiences. Join 12 channels, 21,527 vendors, and 17+ million products.",
    keywords:
      "shoppable tv, interactive video, AI streaming, live shopping, video commerce, edge video ai",
    url: "https://edgevideo.ai",
  },

  app: {
    title: "Edge Video AI App - Live Interactive Shopping Experience",
    description:
      "Experience the future of shopping with Edge Video AI. Watch live streams, discover products with AI, and shop directly from your favorite channels. Real-time interactive shopping made simple.",
    keywords:
      "live shopping app, interactive tv app, AI shopping, real-time product discovery, shoppable video",
    url: "https://edgevideo.ai/app",
  },

  channels: {
    title: "Channels - Edge Video AI Shoppable TV Network",
    description:
      "Explore our network of shoppable TV channels featuring AI-powered product discovery. Watch, discover, and shop from 12 channels with millions of products available instantly.",
    keywords:
      "shoppable tv channels, interactive channels, AI powered channels, live shopping channels",
    url: "https://edgevideo.ai/channels",
  },

  brands: {
    title: "Brands & Products - Edge Video AI Marketplace",
    description:
      "Discover thousands of brands and millions of products through AI-powered video recognition. Shop from 21,527+ verified vendors across multiple categories.",
    keywords:
      "brand marketplace, product discovery, AI shopping, verified vendors, online marketplace",
    url: "https://edgevideo.ai/brands",
  },

  demo: {
    title: "Demo - See Edge Video AI in Action",
    description:
      "Experience how Edge Video AI transforms regular video content into interactive shopping experiences. See our AI technology identify products in real-time video streams.",
    keywords:
      "shoppable tv demo, AI product recognition demo, interactive video demo, live shopping demo",
    url: "https://edgevideo.ai/demo",
  },

  privacy: {
    title: "Privacy Policy - Edge Video AI",
    description:
      "Learn how Edge Video AI protects your privacy and handles your data. Our commitment to transparency and user privacy in AI-powered video experiences.",
    keywords:
      "privacy policy, data protection, user privacy, Edge Video AI privacy",
    url: "https://edgevideo.ai/privacy",
  },

  terms: {
    title: "Terms of Service - Edge Video AI",
    description:
      "Read our terms of service for using Edge Video AI's shoppable TV platform and interactive video experiences.",
    keywords: "terms of service, user agreement, Edge Video AI terms",
    url: "https://edgevideo.ai/terms",
  },
};
