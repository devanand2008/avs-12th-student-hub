import type { MetadataRoute } from "next";
import { publicSearchPaths, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Do not invent modification dates or advertise authenticated pages.
  return publicSearchPaths().map((path) => ({
    url: new URL(path, SITE_URL).href,
  }));
}
