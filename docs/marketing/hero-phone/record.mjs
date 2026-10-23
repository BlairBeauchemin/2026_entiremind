// Records one seamless loop of the animated hero phone
// (src/components/landing/hero-phone-motion.tsx) as ad video.
//
// The page clock is faked and stepped one frame at a time, so every frame is
// exact regardless of machine speed. Frames are captured with a transparent
// background, then ffmpeg makes:
//   hero-phone-loop.mp4   H.264 on linen, 1080x1080 (Meta / IG feed)
//   hero-phone-loop.webm  VP9 with alpha, 1080x1080 (for compositing over
//                         Higgsfield or other background plates)
//
// Usage: start the app (`npm run dev`), then
//   node docs/marketing/hero-phone/record.mjs [outDir] [baseUrl]
// Defaults: outDir = this folder, baseUrl = http://localhost:3000
// Needs ffmpeg on PATH. Set CHROMIUM_PATH to use a preinstalled Chromium.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = process.argv[2] || path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[3] || "http://localhost:3000";
const FPS = 30;
const LINEN = "0xF2EFE9";

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {},
);
const page = await browser.newPage({
  viewport: { width: 1024, height: 1024 },
  deviceScaleFactor: 2,
});
await page.clock.install();
await page.goto(`${base}/preview/hero-phone?motion=1&bg=transparent`, {
  waitUntil: "networkidle",
});
await page.evaluate(() => document.fonts.ready);
await page.clock.pauseAt(Date.now() + 60_000);

// Step forward until a loop restarts, so the capture begins on frame zero.
const phase = () =>
  page.$eval("[data-phase]", (el) => el.getAttribute("data-phase"));
const loopMs = Number(
  await page.$eval("[data-loop-ms]", (el) => el.getAttribute("data-loop-ms")),
);
while ((await phase()) !== "fading") await page.clock.runFor(50);
while ((await phase()) !== "start") await page.clock.runFor(10);

const frames = mkdtempSync(path.join(os.tmpdir(), "hero-phone-frames-"));
const count = Math.round((loopMs / 1000) * FPS);
let elapsed = 0;
for (let i = 0; i < count; i++) {
  await page.screenshot({
    path: path.join(frames, `${String(i).padStart(4, "0")}.png`),
    clip: { x: 0, y: 0, width: 1024, height: 1024 },
    omitBackground: true,
  });
  const next = Math.round(((i + 1) * 1000) / FPS);
  await page.clock.runFor(next - elapsed);
  elapsed = next;
}
await browser.close();
console.log(`captured ${count} frames (${loopMs}ms loop)`);

const input = ["-framerate", String(FPS), "-i", path.join(frames, "%04d.png")];
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  "-f",
  "lavfi",
  "-i",
  `color=c=${LINEN}:s=1080x1080:r=${FPS}`,
  ...input,
  "-filter_complex",
  "[1]scale=1080:1080:flags=lanczos[p];[0][p]overlay=shortest=1",
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-crf",
  "16",
  "-movflags",
  "+faststart",
  path.join(outDir, "hero-phone-loop.mp4"),
]);
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  ...input,
  "-vf",
  "scale=1080:1080:flags=lanczos",
  "-c:v",
  "libvpx-vp9",
  "-pix_fmt",
  "yuva420p",
  "-b:v",
  "0",
  "-crf",
  "24",
  path.join(outDir, "hero-phone-loop.webm"),
]);
rmSync(frames, { recursive: true, force: true });
console.log("wrote hero-phone-loop.mp4 and hero-phone-loop.webm to", outDir);
