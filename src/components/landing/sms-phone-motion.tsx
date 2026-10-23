"use client";

import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "framer-motion";
import type { HeroPhoneContent } from "./hero-phone";
import { SmsPhone } from "./sms-phone";
import { buildSmsTimeline, smsFrameAt } from "./sms-phone-timeline";

/**
 * The SmsPhone with its conversation playing in once: typing dots before
 * each Entiremind message, Maya's replies arriving, her last one typed into
 * the composer and sent. Then it holds on the finished thread and the clock
 * stops, so nothing runs after the first ~9 seconds.
 *
 * Reduced motion gets the static finished conversation.
 *
 * The root carries `data-done` so the recorder can tell when it has settled.
 */
export function SmsPhoneMotion({
  content,
  className,
}: {
  content: HeroPhoneContent;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const timeline = useMemo(() => buildSmsTimeline(content), [content]);
  const [time, setTime] = useState(0);
  const done = time >= timeline.doneMs;

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const t = now - start;
      // Commit synchronously so each painted frame shows exactly this time.
      flushSync(() => setTime(t));
      if (t < timeline.doneMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, timeline]);

  if (reduce || done) {
    return (
      <div data-done="true">
        <SmsPhone content={content} className={className} />
      </div>
    );
  }
  return (
    <div data-done="false">
      <SmsPhone
        content={content}
        className={className}
        frame={smsFrameAt(content, timeline, time)}
      />
    </div>
  );
}
