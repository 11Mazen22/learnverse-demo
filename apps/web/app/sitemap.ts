import type {MetadataRoute} from "next";

export default function sitemap():MetadataRoute.Sitemap{
  const base="https://noata.enterpriseworkhub.online";
  return [
    {url:base,lastModified:new Date(),changeFrequency:"weekly",priority:1},
    {url:base+"/learn",lastModified:new Date(),changeFrequency:"weekly",priority:.9},
    {url:base+"/privacy",lastModified:new Date(),changeFrequency:"monthly",priority:.3},
    {url:base+"/terms",lastModified:new Date(),changeFrequency:"monthly",priority:.3}
  ];
}
