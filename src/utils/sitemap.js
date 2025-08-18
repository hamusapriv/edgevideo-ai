/**
 * Sitemap generator for Edge Video AI
 * Generates XML sitemap for better SEO
 */

const routes = [
  {
    path: "/",
    priority: "1.0",
    changefreq: "daily",
  },
  {
    path: "/home",
    priority: "1.0",
    changefreq: "daily",
  },
  {
    path: "/app",
    priority: "0.9",
    changefreq: "daily",
  },
  {
    path: "/demo",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/channels",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/brands",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/viewers",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/privacy",
    priority: "0.3",
    changefreq: "monthly",
  },
  {
    path: "/terms",
    priority: "0.3",
    changefreq: "monthly",
  },
  {
    path: "/cookies",
    priority: "0.3",
    changefreq: "monthly",
  },
];

export function generateSitemap(baseUrl = "https://www.edgevideo.ai") {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return sitemap;
}

export function downloadSitemap() {
  const sitemap = generateSitemap();
  const blob = new Blob([sitemap], { type: "application/xml" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "sitemap.xml";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// For development - log sitemap to console
export function logSitemap() {
  return generateSitemap();
}
