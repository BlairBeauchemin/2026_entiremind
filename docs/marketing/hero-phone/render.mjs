// Renders the hero phone (src/components/landing/hero-phone.tsx) and the hero
// scenes around it (hero-scene.tsx) to PNG by screenshotting the preview
// routes, so ads always match the site.
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
  "entiremind-quote": "mode=entiremind&bg=transparent&card=quote",
  "entiremind-quote-on-linen": "mode=entiremind&bg=linen&card=quote",
  "entiremind-visual": "mode=entiremind&bg=transparent&card=visual",
  "entiremind-visual-on-linen": "mode=entiremind&bg=linen&card=visual",
  "entiremind-sky": "mode=entiremind&bg=transparent&reply=sky",
  // The landing page's Messages-style phone, same conversation.
  "sms-phone": "phone=sms&bg=transparent",
  "sms-phone-on-linen": "phone=sms&bg=linen",
  // Calibration against the reference — keep local, don't commit the output.
  replica: "mode=replica&bg=transparent",
};

// Scenes render on a 1440 × 1200 canvas.
const SCENES = {
  "scene-cards": "layout=cards&bg=transparent",
  "scene-cards-on-linen": "layout=cards&bg=linen",
  "scene-board": "layout=board&bg=transparent",
  "scene-board-on-linen": "layout=board&bg=linen",
};

const JOBS = [
  ...Object.entries(RENDERS).map(([name, query]) => ({
    name,
    url: `/preview/hero-phone?${query}`,
    width: 1024,
    height: 1024,
  })),
  ...Object.entries(SCENES).map(([name, query]) => ({
    name,
    url: `/preview/hero-scene?${query}`,
    width: 1440,
    height: 1200,
  })),
];

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  );
  const only = process.env.ONLY?.split(",");
  for (const job of JOBS) {
    if (only && !only.some((prefix) => job.name.startsWith(prefix))) continue;
    const page = await browser.newPage({
      viewport: { width: job.width, height: job.height },
      deviceScaleFactor: 2,
    });
    await page.goto(`${base}${job.url}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Photographs must be decoded before the shot, or they render blank.
    await page.evaluate(() =>
      Promise.all([...document.images].map((img) => img.decode())),
    );
    await page.screenshot({
      path: path.join(outDir, `${job.name}.png`),
      clip: { x: 0, y: 0, width: job.width, height: job.height },
      omitBackground: job.url.includes("bg=transparent"),
    });
    await page.close();
    console.log("rendered", job.name);
  }
  await browser.close();
})();
