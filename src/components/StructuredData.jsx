/**
 * Structured Data components for better SEO
 * Generates JSON-LD markup for products, organizations, and other entities
 */

// Product structured data for shopping items
export function ProductStructuredData({ product }) {
  if (!product) return null;

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title || product.name,
    description: product.description || product.explanation,
    image: product.image,
    url: product.link,
    brand: {
      "@type": "Brand",
      name: product.brand || "Edge Video AI Marketplace",
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "USD",
      availability: "https://schema.org/InStock",
      url: product.link,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Organization structured data for the company
export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Edge Video AI",
    description:
      "AI-powered shoppable TV platform that transforms passive video watching into interactive shopping experiences",
    url: "https://www.edgevideo.ai",
    logo: {
      "@type": "ImageObject",
      url: "https://www.edgevideo.ai/assets/logo.png",
    },
    foundingDate: "2023",
    sameAs: [
      "https://twitter.com/edgevideoai",
      "https://www.linkedin.com/company/edgevideoai",
      "https://www.youtube.com/@edgevideoai",
      "https://medium.com/edge-video-ai",
      "https://t.me/edgevideoai",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "developers@edgevideo.ai",
      contactType: "Customer Service",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Website structured data
export function WebsiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Edge Video AI",
    description:
      "Shoppable TV & AI-Powered Interactive Video Streaming Platform",
    url: "https://www.edgevideo.ai",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.edgevideo.ai/app?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// FAQ structured data for better rich snippets
export function FAQStructuredData({ faqs }) {
  if (!faqs || faqs.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Video structured data for video content
export function VideoStructuredData({ video }) {
  if (!video) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnail,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: video.url,
    embedUrl: video.embedUrl,
    publisher: {
      "@type": "Organization",
      name: "Edge Video AI",
      logo: {
        "@type": "ImageObject",
        url: "https://www.edgevideo.ai/assets/logo.png",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
