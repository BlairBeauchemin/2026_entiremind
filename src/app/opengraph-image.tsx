import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/**
 * Site-default OG card (pages without their own opengraph-image, e.g. / and
 * /quiz). Same visual system as the archetype cards: dark teal ground, soft
 * purple accent, warm yellow headline.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
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
        Lightly magical, by text
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 600,
          color: "#f9d97a",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        {siteConfig.name}
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
        {siteConfig.tagline}
      </div>
      <div
        style={{
          fontSize: 28,
          color: "#cbbbe3",
        }}
      >
        entiremind.com
      </div>
    </div>,
    size,
  );
}
