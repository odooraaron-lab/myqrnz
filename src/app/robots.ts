import type { MetadataRoute } from "next";
import { site } from "@/config/site";

// Main domain only. Each shop subdomain serves its own robots.txt (see app/s/[shop]/robots.txt).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api/", "/s/", "/reset-password", "/login", "/forgot-password"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
