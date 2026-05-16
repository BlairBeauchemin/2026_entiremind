import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Prevent Vercel edge / browser from caching any authenticated dashboard page.
        // force-dynamic sets no-store at the Next.js layer, but Vercel's edge can
        // override it. This config applies no-store at the infrastructure level so
        // every reload fetches a fresh server render regardless of edge behavior.
        source: "/dashboard/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
