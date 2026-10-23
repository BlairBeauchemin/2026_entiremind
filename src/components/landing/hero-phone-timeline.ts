import type { HeroPhoneContent, HeroPhoneFrame } from "./hero-phone";

/**
 * The HeroPhone's looping timeline as a pure function of time.
 *
 *   0.4s   typing indicator where Entiremind's first message will land
 *   1.3s   it gives way to the message (soft rise); Maya's reply follows
 *   …      the same for each message in turn, then the intention card
 *   then   the draft types itself out and stops mid-word; the caret blinks
 *   end    everything fades out together and the loop starts again
 *
 * Nothing here reads a clock: `frameAt(t)` is the whole state at time t, so
 * the live page and the frame-stepped ad recorder render identical frames.
 */

const APPEAR_MS = 500;
const CARD_APPEAR_MS = 600;
const TYPING_LEAD_MS = 900;
const TYPING_FADE_MS = 250;
const DOT_CYCLE_MS = 1100;
const CARET_CYCLE_MS = 1000;
const HOLD_MS = 3800;
const FADE_MS = 600;
const REST_MS = 200;
const BUBBLE_RISE_EM = 0.45;
const CARD_RISE_EM = 0.6;

export interface HeroPhoneTimeline {
  appearAt: number[];
  cardAt: number;
  charAt: number[];
  fadeAt: number;
  loopMs: number;
}

/** Per-character typing delay: a steady hand with a little human unevenness. */
function keyDelay(text: string, i: number): number {
  const wobble = [0, 18, -8, 26, 4, -12, 10][i % 7];
  return 62 + wobble + (text[i - 1] === " " ? 45 : 0);
}

export function buildTimeline(content: HeroPhoneContent): HeroPhoneTimeline {
  const appearAt: number[] = [];
  let t = 400;
  for (const bubble of content.bubbles) {
    if (bubble.from === "them") {
      t += TYPING_LEAD_MS;
      appearAt.push(t);
      t += 1000;
    } else {
      appearAt.push(t);
      t += 800;
    }
  }
  const cardAt = t - 200;
  t = cardAt + 800;
  const draft = content.draft ?? "";
  const charAt: number[] = [];
  for (let i = 1; i <= draft.length; i++) {
    charAt.push(t);
    t += keyDelay(draft, i);
  }
  const fadeAt = (charAt.at(-1) ?? t) + HOLD_MS;
  return {
    appearAt,
    cardAt,
    charAt,
    fadeAt,
    loopMs: fadeAt + FADE_MS + REST_MS,
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Soft ease-out, close to cubic-bezier(0.22, 1, 0.36, 1). No overshoot. */
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 4);

export type HeroPhonePhase = "start" | "playing" | "fading";

export function frameAt(
  content: HeroPhoneContent,
  tl: HeroPhoneTimeline,
  time: number,
): { frame: HeroPhoneFrame; phase: HeroPhonePhase } {
  const t = ((time % tl.loopMs) + tl.loopMs) % tl.loopMs;
  const fade = 1 - easeOut((t - tl.fadeAt) / FADE_MS);
  const fading = t >= tl.fadeAt;

  const arrive = (at: number, ms: number, riseEm: number) => {
    const p = easeOut((t - at) / ms);
    return { opacity: p * fade, rise: fading ? 0 : (1 - p) * riseEm };
  };

  const bubbles = tl.appearAt.map((at) =>
    arrive(at, APPEAR_MS, BUBBLE_RISE_EM),
  );
  const typing = content.bubbles.map((bubble, i) => {
    if (bubble.from !== "them") return 0;
    const from = tl.appearAt[i] - TYPING_LEAD_MS;
    const fadeIn = clamp01((t - from) / TYPING_FADE_MS);
    const fadeOut = 1 - clamp01((t - tl.appearAt[i]) / TYPING_FADE_MS);
    return fadeIn * fadeOut;
  });
  const dot = (d: number) => {
    const phase = (t / DOT_CYCLE_MS - d * 0.16) % 1;
    return 0.3 + 0.7 * (0.5 - 0.5 * Math.cos(2 * Math.PI * phase));
  };

  // Chars typed so far; cleared once the fade completes so the loop restarts
  // on the empty composer.
  const typed =
    t >= tl.fadeAt + FADE_MS ? 0 : tl.charAt.filter((c) => c <= t).length;
  const doneAt = tl.charAt.at(-1) ?? 0;
  // Solid while typing, blinking once the hand pauses.
  const caretOn =
    typed < tl.charAt.length ||
    (t - doneAt) % CARET_CYCLE_MS < CARET_CYCLE_MS / 2;

  return {
    frame: {
      bubbles,
      typing,
      dots: [dot(0), dot(1), dot(2)],
      card: arrive(tl.cardAt, CARD_APPEAR_MS, CARD_RISE_EM),
      draftChars: typed,
      draftOpacity: fade,
      caretOn,
    },
    phase: fading
      ? "fading"
      : t < tl.appearAt[0] - TYPING_LEAD_MS
        ? "start"
        : "playing",
  };
}
