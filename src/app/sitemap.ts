import type { MetadataRoute } from "next";
import { results } from "@/data/quiz";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://innerlands.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const resultPages = Object.keys(results).map((id) => ({
    url: `${siteUrl}/result/${id}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    ...resultPages,
  ];
}
