import type { MetadataRoute } from "next";
import { isPreview,siteOrigin } from "@/lib/metadata";
export default function robots():MetadataRoute.Robots {
  const origin=siteOrigin();
  return {rules:{userAgent:"*",...(isPreview ? {disallow:"/"}:{allow:"/"})},...(origin && !isPreview ? {sitemap:origin+"/sitemap.xml"}:{})};
}
