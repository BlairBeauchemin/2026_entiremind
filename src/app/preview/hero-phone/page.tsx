import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { HeroPhone } from "@/components/landing/hero-phone";
import {
  ENTIREMIND_CONTENT,
  ENTIREMIND_QUOTE_CONTENT,
  ENTIREMIND_VISUAL_CONTENT,
  REPLICA_CONTENT,
} from "@/components/landing/hero-phone-content";

// Internal preview for the hero phone: used to review it and to render ad
// images (docs/marketing/hero-phone/render.mjs). Not linked from anywhere, and
// dev-only: the calibration mode reproduces a third-party reference and must
// never be served from production.
export const metadata: Metadata = {
  title: "Hero phone preview",
  robots: { index: false, follow: false },
};

// Scoped to this route so the site bundle is unaffected until a font is chosen.
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

function pick<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export default async function HeroPhonePreview({
  searchParams,
}: {
  searchParams: Search;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const mode = pick(
    params.mode,
    ["entiremind", "replica"] as const,
    "entiremind",
  );
  const bg = pick(
    params.bg,
    ["transparent", "white", "linen"] as const,
    "white",
  );
  const font = pick(params.font, ["karla", "inter"] as const, "inter");
  const reply = pick(
    params.reply,
    ["sky", "cobalt"] as const,
    mode === "replica" ? "sky" : "cobalt",
  );
  const card = pick(
    params.card,
    ["landscape", "quote", "visual"] as const,
    "landscape",
  );
  const size = Number(params.size) > 0 ? Number(params.size) : 1024;

  return (
    <>
      {/* The global body paints the site background; a transparent render needs it gone. */}
      <style>{`body{background:${BACKGROUNDS[bg]} !important}nextjs-portal{display:none !important}`}</style>
      <main
        className={inter.variable}
        style={{ width: size, height: size, background: BACKGROUNDS[bg] }}
      >
        <HeroPhone
          content={
            mode === "replica"
              ? REPLICA_CONTENT
              : card === "visual"
                ? ENTIREMIND_VISUAL_CONTENT
                : card === "quote"
                  ? ENTIREMIND_QUOTE_CONTENT
                  : ENTIREMIND_CONTENT
          }
          font={font}
          replyTone={reply}
        />
      </main>
    </>
  );
}
