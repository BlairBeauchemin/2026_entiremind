// Renders the hero phone (src/components/landing/hero-phone.tsx) to PNG by
// screenshotting the preview route, so ads always match the site.
//
// Usage: start the app (`npm run dev`), then
//   node docs/marketing/hero-phone/render.mjs [outDir] [baseUrl]
// Defaults: outDir = this folder, baseUrl = http://localhost:3000
// Set CHROMIUM_PATH to use a preinstalled Chromium instead of Playwright's own.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = process.argv[2] || path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[3] || "http://localhost:3000";

const RENDERS = {
  entiremind: "mode=entiremind&bg=transparent",
  "entiremind-on-linen": "mode=entiremind&bg=linen",
  "entiremind-sky": "mode=entiremind&bg=transparent&reply=sky",
  // Calibration against the reference — keep local, don't commit the output.
  replica: "mode=replica&bg=transparent",
};

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  );
  const page = await browser.newPage({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 2,
  });
  for (const [name, query] of Object.entries(RENDERS)) {
    await page.goto(`${base}/preview/hero-phone?${query}`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join(outDir, `${name}.png`),
      clip: { x: 0, y: 0, width: 1024, height: 1024 },
      omitBackground: query.includes("bg=transparent"),
    });
    console.log("rendered", name);
  }
  await browser.close();
})();
