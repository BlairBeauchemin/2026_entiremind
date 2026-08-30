import type { Metadata } from "next";
import { Karla, Prata } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

// Serif carries meaning, sans carries mechanics. Prata ships a single weight,
// which is why headings earn hierarchy by size rather than by bolding.
const prata = Prata({
  variable: "--font-prata",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Manifest Your Dreams`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Manifest Your Dreams`,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Manifest Your Dreams`,
    description: siteConfig.description,
  },
};

// GTM only loads when an id is available. NODE_ENV gating keeps local dev
// from producing tracking traffic; production falls back to the known
// container id until NEXT_PUBLIC_GTM_ID is set in Vercel.
const gtmId =
  process.env.NEXT_PUBLIC_GTM_ID ??
  (process.env.NODE_ENV === "production" ? siteConfig.gtmId : undefined);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body
        className={`${prata.variable} ${karla.variable} font-sans antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
