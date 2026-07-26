import type { MetadataRoute } from "next";
import { getLatestDataUpdatedAt } from "@/lib/oneshots";

const SITE_URL = "https://yomikiri-manga.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = (await getLatestDataUpdatedAt()) ?? undefined;

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
  ];
}
