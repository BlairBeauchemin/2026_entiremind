import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { loadDisplayFont, OG_COLORS } from "@/lib/og/font";

/**
 * Site-default OG card (pages without their own opengraph-image, e.g. / and
 * /quiz).
 *
 * A cobalt ground with linen lettering. Gold appears once, as a hairline —
 * this is the "gold lives on cobalt" rule doing its job. It is never the
 * headline: gold is ornament at every size, on every ground.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
        Lightly magical, by text
      </div>

      <div
        style={{
          fontFamily: display ? "Prata" : "serif",
          fontSize: 104,
          color: OG_COLORS.linen,
          textAlign: "center",
          lineHeight: 1.05,
        }}
      >
        {siteConfig.name}
      </div>

      {/* The one ornament. */}
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
        {siteConfig.tagline}
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
