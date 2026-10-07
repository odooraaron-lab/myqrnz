import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { GUIDES } from "@/content/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["", 1, "weekly"],
    ["/how-it-works", 0.8, "monthly"],
    ["/pricing", 0.9, "monthly"],
    ["/market-stalls", 0.9, "monthly"],
    ["/small-business", 0.9, "monthly"],
    ["/faq", 0.7, "monthly"],
    ["/guides", 0.7, "weekly"],
    ["/register", 0.6, "yearly"],
    ["/terms", 0.2, "yearly"],
    ["/privacy", 0.2, "yearly"],
  ];
  return [
    ...pages.map(([path, priority, changeFrequency]) => ({
      url: `${site.url}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...GUIDES.map((g) => ({
      url: `${site.url}/guides/${g.slug}`,
      lastModified: new Date(g.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
