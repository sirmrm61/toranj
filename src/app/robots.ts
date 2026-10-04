import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/api/", "/login", "/pay/"] }],
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
