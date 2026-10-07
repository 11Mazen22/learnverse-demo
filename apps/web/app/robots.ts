import type {MetadataRoute} from "next";

export default function robots():MetadataRoute.Robots{
  return {
    rules:{
      userAgent:"*",
      allow:["/","/learn","/privacy","/terms"],
      disallow:["/admin","/teacher","/settings","/notifications","/ai","/assignments","/auth"]
    },
    sitemap:"https://noata.enterpriseworkhub.online/sitemap.xml"
  };
}
