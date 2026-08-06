import type { MetadataRoute } from "next";
import { getLatestDataUpdatedAt, getOneshotSitemapEntries } from "@/lib/oneshots";

const SITE_URL = "https://yomikiri-manga.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lastModified, seriesEntries] = await Promise.all([
    getLatestDataUpdatedAt().then((value) => value ?? undefined),
    getOneshotSitemapEntries(),
  ]);

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/help`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/favorites`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.1,
    },
    ...seriesEntries.map((entry): MetadataRoute.Sitemap[number] => ({
      url: `${SITE_URL}/series/${entry.id}`,
      lastModified: entry.lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    })),
  ];
}
