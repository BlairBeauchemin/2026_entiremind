import { ImageResponse } from "next/og";
import { ARCHETYPES, type Archetype } from "@/lib/persona/types";
import { ARCHETYPE_PUBLIC } from "@/lib/persona/content";

/**
 * OG card for the shareable archetype pages — this is what people actually
 * see in feeds and iMessage previews, so the design effort lives here.
 * Theme: dark teal ground, soft purple accent, warm yellow archetype name.
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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #204147 0%, #2E2A58 100%)",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#cbbbe3",
            marginBottom: 28,
          }}
        >
          A manifestation archetype
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 600,
            color: "#f9d97a",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          {content.name}
        </div>
        <div
          style={{
            fontSize: 38,
            color: "#ffffff",
            opacity: 0.92,
            textAlign: "center",
            maxWidth: 900,
            marginBottom: 48,
          }}
        >
          {content.essence}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#cbbbe3",
          }}
        >
          entiremind.com
        </div>
      </div>
    ),
    size,
  );
}
