import type { HeroPhoneContent } from "./hero-phone";

/**
 * The SmsPhone's play-in as a pure function of time. It plays once and holds:
 *
 *   0.4s   typing dots where Entiremind's first message will land
 *   1.3s   they give way to the message (soft rise); Maya's reply follows
 *   …      the same for each message in turn
 *   then   Maya's last message types itself into the composer, the send
 *          button lights, and it goes out as a bubble
 *   end    the finished conversation, exactly the static SmsPhone
 *
 * Nothing here reads a clock: `smsFrameAt(t)` is the whole state at time t,
 * so the live page and the frame-stepped recorder render identical frames.
 */

const START_MS = 400;
const TYPING_LEAD_MS = 900;
const TYPING_FADE_MS = 250;
const APPEAR_MS = 500;
const DOT_CYCLE_MS = 1100;
const CARET_CYCLE_MS = 1000;
const RISE_EM = 0.45;

/** One instant of the play-in. */
export interface SmsPhoneFrame {
  /** Per bubble: opacity and how far below its resting place it sits (em). */
  bubbles: { opacity: number; rise: number }[];
  /** Per bubble: opacity of the typing dots in its slot. */
  typing: number[];
  /** Opacity of each of the three dots. */
  dots: [number, number, number];
  /** What is in the composer right now. */
  draft: string;
  caretOn: boolean;
}

export interface SmsPhoneTimeline {
  appearAt: number[];
  /** When each character of the typed-and-sent last reply lands. */
  charAt: number[];
  doneMs: number;
}

/** Per-character typing delay: a steady hand with a little human unevenness. */
function keyDelay(text: string, i: number): number {
  const wobble = [0, 18, -8, 26, 4, -12, 10][i % 7];
  return 58 + wobble + (text[i - 1] === " " ? 40 : 0);
}

/** Reading time before the next message: longer messages hold longer. */
const readMs = (text: string) => 700 + text.length * 9;

export function buildSmsTimeline(content: HeroPhoneContent): SmsPhoneTimeline {
  const { bubbles } = content;
  const last = bubbles.at(-1);
  const typeLast = last?.from === "me";
  const appearAt: number[] = [];
  const charAt: number[] = [];
  let t = START_MS;
  bubbles.forEach((bubble, i) => {
    if (typeLast && i === bubbles.length - 1) {
      t += 300;
      for (let c = 1; c <= bubble.text.length; c++) {
        charAt.push(t);
        t += keyDelay(bubble.text, c);
      }
      t += 350;
      appearAt.push(t);
      return;
    }
    if (bubble.from === "them") t += TYPING_LEAD_MS;
    appearAt.push(t);
    t += readMs(bubble.text);
  });
  return { appearAt, charAt, doneMs: t + APPEAR_MS };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Soft ease-out, close to cubic-bezier(0.22, 1, 0.36, 1). No overshoot. */
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 4);

export function smsFrameAt(
  content: HeroPhoneContent,
  tl: SmsPhoneTimeline,
  time: number,
): SmsPhoneFrame {
  const t = Math.max(0, time);
  const bubbles = tl.appearAt.map((at) => {
    const p = easeOut((t - at) / APPEAR_MS);
    return { opacity: p, rise: (1 - p) * RISE_EM };
  });
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

  // The composer holds the last reply while it is typed, and empties the
  // moment it sends.
  const sentAt = tl.appearAt.at(-1) ?? 0;
  const typed = tl.charAt.filter((c) => c <= t).length;
  const draft =
    tl.charAt.length && t < sentAt
      ? (content.bubbles.at(-1)?.text.slice(0, typed) ?? "")
      : "";
  const doneTyping = tl.charAt.at(-1) ?? 0;
  const caretOn =
    typed < tl.charAt.length || (t - doneTyping) % CARET_CYCLE_MS < 500;

  return {
    bubbles,
    typing,
    dots: [dot(0), dot(1), dot(2)],
    draft,
    caretOn,
  };
}
