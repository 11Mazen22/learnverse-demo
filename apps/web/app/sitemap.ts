import type {MetadataRoute} from "next";

/**
 * Origin resolution order:
 * 1. `NEXT_PUBLIC_SITE_URL` for staging/preview hosts,
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` when Vercel provides it,
 * 3. the canonical production origin.
 * No per-route hostnames are hardcoded, so the map stays correct on any host.
 */
function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return "https://noata.enterpriseworkhub.online";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  const lastModified = new Date();

  const entries: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/landing", priority: 0.95, changeFrequency: "weekly" },
    { path: "/curriculum", priority: 0.9, changeFrequency: "weekly" },
    { path: "/features", priority: 0.85, changeFrequency: "monthly" },
    { path: "/how", priority: 0.8, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/help", priority: 0.7, changeFrequency: "weekly" },
    { path: "/learn", priority: 0.9, changeFrequency: "weekly" },
    { path: "/quran", priority: 0.8, changeFrequency: "monthly" },
    { path: "/study", priority: 0.7, changeFrequency: "weekly" },
    { path: "/review", priority: 0.65, changeFrequency: "weekly" },
    { path: "/assignments", priority: 0.6, changeFrequency: "weekly" },
    { path: "/missions", priority: 0.6, changeFrequency: "weekly" },
    { path: "/boss", priority: 0.55, changeFrequency: "weekly" },
    { path: "/progress", priority: 0.55, changeFrequency: "weekly" },
    { path: "/rewards", priority: 0.55, changeFrequency: "weekly" },
    { path: "/ai", priority: 0.8, changeFrequency: "weekly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
  ];

  return entries.map((entry) => ({
    url: `${base}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
