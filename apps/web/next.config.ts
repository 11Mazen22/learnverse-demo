import type {NextConfig} from "next";

const securityHeaders=[
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
  {key:"X-Frame-Options",value:"DENY"},
  {key:"Permissions-Policy",value:"camera=(), geolocation=(), payment=(), usb=()"},
  {key:"Cross-Origin-Opener-Policy",value:"same-origin-allow-popups"},
  {key:"Strict-Transport-Security",value:"max-age=63072000; includeSubDomains; preload"}
];

const nextConfig:NextConfig={
  reactStrictMode:true,
  poweredByHeader:false,
  compress:true,
  serverExternalPackages:["@sparticuz/chromium","puppeteer-core"],
  outputFileTracingIncludes:{"/api/documents/pdf":["./public/fonts/*.woff2","./node_modules/@sparticuz/chromium/bin/**"]},
  async headers(){
    return [{
      source:"/:path*",
      headers:securityHeaders
    }];
  }
};

export default nextConfig;
