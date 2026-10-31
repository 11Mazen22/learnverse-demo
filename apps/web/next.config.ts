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
  // Local QA and the OpenCode browser reach the same dev server through the
  // loopback IP rather than the `localhost` hostname. Without this explicit
  // Next 16 allowlist, HMR is rejected and repeatedly reloads the document
  // before React can hydrate, leaving every control inert and every account
  // screen on its initial loading state. Development-only; no production CORS.
  allowedDevOrigins:["127.0.0.1","::1"],
  env: {
    NEXT_PUBLIC_NOATA_DEPLOYMENT_ENV: process.env.VERCEL_ENV ?? "development",
    NEXT_PUBLIC_NOATA_PRODUCTION_PROJECT_REF: process.env.VERCEL_ENV === "production"
      ? process.env.NOATA_PRODUCTION_SUPABASE_REF ?? ""
      : "",
  },
  poweredByHeader:false,
  compress:true,
  serverExternalPackages:["@sparticuz/chromium","puppeteer-core","pdfkit","fontkit"],
  outputFileTracingIncludes:{"/api/documents/pdf":["./public/fonts/*.woff2","./public/fonts/*.ttf","./lib/pdf/fonts/noto-sans-math-latin-400-normal.woff","./node_modules/@sparticuz/chromium/bin/**"],"/api/ai/chart-pdf":["./public/fonts/*.woff2","./lib/pdf/fonts/noto-sans-math-latin-400-normal.woff","./node_modules/@sparticuz/chromium/bin/**"],"/api/pdf":["./lib/pdf/fonts/**"]},
  async headers(){
    return [{
      source:"/:path*",
      headers:securityHeaders
    }];
  }
};

export default nextConfig;
