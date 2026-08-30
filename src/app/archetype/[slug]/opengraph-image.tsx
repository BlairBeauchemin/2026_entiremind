import { ImageResponse } from "next/og";
import { ARCHETYPES, type Archetype } from "@/lib/persona/types";
import { ARCHETYPE_PUBLIC } from "@/lib/persona/content";
import { loadDisplayFont, OG_COLORS } from "@/lib/og/font";

/**
 * OG card for the shareable archetype pages — this is what people actually
 * see in feeds and iMessage previews, so the design effort lives here.
 *
 * This is one of exactly two surfaces where a user's archetype colour is
 * allowed to appear. Those four accents are still an open decision in
 * DESIGN.md, so the card runs on cobalt until the reveal is designed and the
 * accents are chosen together — inventing one here would pick the palette by
 * accident.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ARCHETYPES.map((slug) => ({ slug }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = (ARCHETYPES as readonly string[]).includes(rawSlug)
    ? (rawSlug as Archetype)
    : "visionary";
  const content = ARCHETYPE_PUBLIC[slug];
  const display = await loadDisplayFont();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.cobalt,
        padding: 80,
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: OG_COLORS.cobaltWash,
          marginBottom: 40,
        }}
      >
        A manifestation archetype
      </div>

      <div
        style={{
          fontFamily: display ? "Prata" : "serif",
          fontSize: 96,
          color: OG_COLORS.linen,
          textAlign: "center",
          lineHeight: 1.05,
        }}
      >
        {content.name}
      </div>

      {/* Gold on cobalt — the one place it can actually be seen. */}
      <div
        style={{
          width: 96,
          height: 1,
          backgroundColor: OG_COLORS.leaf,
          marginTop: 36,
          marginBottom: 36,
        }}
      />

      <div
        style={{
          fontSize: 36,
          color: OG_COLORS.linen,
          opacity: 0.85,
          textAlign: "center",
          maxWidth: 860,
          lineHeight: 1.35,
        }}
      >
        {content.essence}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 56,
          fontSize: 20,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: OG_COLORS.cobaltWash,
        }}
      >
        entiremind.com
      </div>
    </div>,
    {
      ...size,
      fonts: display
        ? [{ name: "Prata", data: display, style: "normal", weight: 400 }]
        : undefined,
    },
  );
}
