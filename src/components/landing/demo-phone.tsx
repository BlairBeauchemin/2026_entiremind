import type { ReactNode } from "react";
import { SmsPhone } from "./sms-phone";
import { DEMO_CONTENT } from "./hero-phone-content";
import type { HeroPhoneContent } from "./hero-phone";
import { heroInter } from "./hero-font";

/**
 * The Messages phone on its own — no prints, board or sparkles — showing one
 * example exchange. Kept as a reusable asset for other pages; it is not on the
 * landing page (the "Moment" section carries the demo conversation there).
 * A rendered PNG of the default lives at
 * public/marketing/demo-phone/demo-phone.png for non-code uses.
 *
 * Usage: <DemoPhone /> or <DemoPhone content={…} caption="…" className="w-[280px]" />
 */
export function DemoPhone({
  content = DEMO_CONTENT,
  caption = "An example conversation",
  className = "w-[300px] sm:w-[320px]",
}: {
  content?: HeroPhoneContent;
  caption?: ReactNode;
  /** Width of the phone; the height follows the device's 1:2 shape. */
  className?: string;
}) {
  return (
    <figure>
      <div className={`mx-auto ${className} ${heroInter.variable}`}>
        <PhoneOnly content={content} />
      </div>
      {caption && (
        <figcaption className="mt-4 text-sm text-muted font-sans text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// SmsPhone renders on a square 1024-unit canvas with the device at
// x 277–747, y 42–982. This box is the device's own size, and the canvas is
// offset inside it so only the phone takes up layout space.
function PhoneOnly({ content }: { content: HeroPhoneContent }) {
  return (
    <div className="relative aspect-[470/940]">
      <div
        className="absolute"
        style={{
          width: `${(1024 / 470) * 100}%`,
          left: `${(-277 / 470) * 100}%`,
          marginTop: `${(-42 / 470) * 100}%`,
        }}
      >
        <SmsPhone content={content} />
      </div>
    </div>
  );
}
