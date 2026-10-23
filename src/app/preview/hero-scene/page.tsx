import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import {
  HeroScene,
  type HeroSceneMotion,
} from "@/components/landing/hero-scene";

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

const MOTIONS: readonly HeroSceneMotion[] = [
  "twinkle",
  "float",
  "float-strong",
  "settle",
  "thread",
  "living",
  "parallax",
];

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
  // ?motion=twinkle,float,thread — any of MOTIONS, comma-separated.
  const motion = String(params.motion ?? "")
    .split(",")
    .filter((m): m is HeroSceneMotion =>
      MOTIONS.includes(m as HeroSceneMotion),
    );
  // ?crop=mobile frames the scene as the landing hero does at 390px wide.
  const mobile = params.crop === "mobile";

  return (
    <>
      {/* The global body paints the site background; a transparent render needs it gone. */}
      <style>{`body{background:${BACKGROUNDS[bg]} !important}nextjs-portal{display:none !important}`}</style>
      {mobile ? (
        <main
          className={`${inter.variable} overflow-hidden px-6 pt-6`}
          style={{ width: 390, background: BACKGROUNDS[bg] }}
        >
          <div className="-mt-[11%] -mb-[9%] -ml-[17%] -mr-[20%]">
            <HeroScene layout={layout} motion={motion} />
          </div>
        </main>
      ) : (
        <main
          className={inter.variable}
          style={{ width: 1440, background: BACKGROUNDS[bg] }}
        >
          <HeroScene layout={layout} motion={motion} />
        </main>
      )}
    </>
  );
}
