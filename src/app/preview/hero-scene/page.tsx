import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { HeroScene } from "@/components/landing/hero-scene";

// Internal preview for the hero scenes (HeroPhone + aspirational imagery),
// used to review them and to render stills (docs/marketing/hero-phone/
// render.mjs). Dev-only and unlinked, like /preview/hero-phone.
export const metadata: Metadata = {
  title: "Hero scene preview",
  robots: { index: false, follow: false },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const BACKGROUNDS = {
  transparent: "transparent",
  white: "#ffffff",
  linen: "var(--color-linen)",
} as const;

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function HeroScenePreview({
  searchParams,
}: {
  searchParams: Search;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const layout =
    params.layout === "board" ||
    params.layout === "scatter" ||
    params.layout === "spill"
      ? params.layout
      : "cards";
  const bg =
    params.bg === "transparent" || params.bg === "white" ? params.bg : "linen";

  return (
    <>
      {/* The global body paints the site background; a transparent render needs it gone. */}
      <style>{`body{background:${BACKGROUNDS[bg]} !important}nextjs-portal{display:none !important}`}</style>
      <main
        className={inter.variable}
        style={{ width: 1440, background: BACKGROUNDS[bg] }}
      >
        <HeroScene layout={layout} />
      </main>
    </>
  );
}
