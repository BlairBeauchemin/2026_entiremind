import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Baseline security headers for every route.
        source: "/:path*",
        headers: [
          // Never render this app in a frame (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Don't MIME-sniff responses into executable types.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send only the origin cross-site; full URL same-origin.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The app uses none of these browser capabilities.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Force HTTPS for a year once seen over HTTPS.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
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
