"use client";

import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { HeroPhone, type HeroPhoneContent } from "./hero-phone";
import { buildTimeline, frameAt } from "./hero-phone-timeline";

/**
 * The HeroPhone with light motion, on a continuous loop: the thread plays in
 * (a typing indicator before each Entiremind message), the intention card
 * rises, the reply types itself out and stops mid-word, then everything fades
 * and the loop starts again. The timeline itself lives in
 * hero-phone-timeline.ts; this component only supplies the clock.
 *
 * Reduced motion gets the static final frame: no loop, no blink.
 *
 * The root carries `data-phase` and `data-loop-ms` so the ad recorder
 * (docs/marketing/hero-phone/record.mjs) can find the start of a loop.
 */

interface HeroPhoneMotionProps {
  content: HeroPhoneContent;
  font?: "karla" | "inter";
  replyTone?: "sky" | "cobalt";
  className?: string;
}

export function HeroPhoneMotion(props: HeroPhoneMotionProps) {
  const reduce = useReducedMotion();
  const timeline = useMemo(() => buildTimeline(props.content), [props.content]);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      // Commit synchronously so each painted frame shows exactly this time.
      flushSync(() => setTime(now - start!));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  if (reduce) return <HeroPhone {...props} />;

  const { frame, phase } = frameAt(props.content, timeline, time);
  return (
    <div data-phase={phase} data-loop-ms={timeline.loopMs}>
      <HeroPhone {...props} frame={frame} />
    </div>
  );
}
