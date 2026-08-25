/**
 * Shared plumbing for the `next/og` cards.
 *
 * Prata is not available to the OG renderer the way it is to the browser, so
 * it is fetched once at build time. If that fetch fails the card still
 * renders — it falls back to the same Georgia-class serif DESIGN.md names as
 * Prata's fallback, rather than failing the build over a font.
 */

// Kept in sync with DESIGN.md by hand: the OG renderer cannot read CSS
// custom properties.
export const OG_COLORS = {
  cobalt: "#2A3A9C",
  cobaltDeep: "#233285",
  cobaltWash: "#E7E9F4",
  linen: "#F2EFE9",
  ink: "#14120F",
  leaf: "#C9A24B",
} as const;

let cached: ArrayBuffer | null | undefined;

export async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  if (cached !== undefined) return cached;

  try {
    // Deliberately no User-Agent header. Google serves woff2 to anything that
    // looks like a modern browser, and satori cannot read woff2 — it fails the
    // build with "Unsupported OpenType signature wOF2". With no UA the API
    // falls back to TTF, which it can read.
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Prata&display=swap",
    ).then((r) => (r.ok ? r.text() : ""));

    const url = css.match(
      /src:\s*url\((https:\/\/[^)]+)\)\s*format\('truetype'\)/,
    )?.[1];
    if (!url) {
      cached = null;
      return cached;
    }

    const res = await fetch(url);
    cached = res.ok ? await res.arrayBuffer() : null;
  } catch {
    cached = null;
  }

  return cached;
}
