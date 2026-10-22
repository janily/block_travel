import type { MetadataRoute } from "next";
import { isPreview,siteOrigin } from "@/lib/metadata";
export default function sitemap():MetadataRoute.Sitemap {
  const origin=siteOrigin();
  return origin && !isPreview ? [{url:origin+"/"},{url:origin+"/videos"}]:[];
}
