import type { HeroPhoneContent } from "./hero-phone";
import { SeedOfLifeMark } from "./hero-phone-content";
import styles from "./sms-phone.module.css";

/**
 * The landing page's Messages facsimile (`PhoneMockup`), rebuilt for
 * marketing renders and for placing inside HeroScene.
 *
 * It keeps PhoneMockup's look: ink device, linen screen, surface bubbles with
 * a hairline for Entiremind, cobalt for the person. What it fixes:
 *
 * - A real contact header: the Seed of Life, drawn in code, in a round
 *   avatar above the name. Never a raster logo that can garble.
 * - One "Today 7:45 AM" (the daily send time) instead of a timestamp under
 *   every bubble, which Messages doesn't do.
 * - The conversation ends on the person's half-typed reply in the composer
 *   rather than on a typing indicator.
 *
 * Static by design; motion and rotation belong to wherever it is placed.
 * Reads the same `HeroPhoneContent` as HeroPhone, so both phones always
 * carry the same conversation.
 */
export function SmsPhone({
  content,
  className,
}: {
  content: HeroPhoneContent;
  className?: string;
}) {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(" ")}>
      <div className={styles.canvas}>
        <div className={styles.device}>
          <div className={styles.status} aria-hidden="true">
            <span>9:41</span>
            <span className={styles.island} />
            <span className={styles.statusIcons}>
              <svg viewBox="0 0 18 12" fill="currentColor">
                <rect x="0" y="8" width="3" height="4" rx="0.8" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
                <rect x="10" y="3" width="3" height="9" rx="0.8" />
                <rect x="15" y="0" width="3" height="12" rx="0.8" />
              </svg>
              <svg
                viewBox="0 0 16 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 6.9a6 6 0 0 1 8 0M6.4 9.6a2.6 2.6 0 0 1 3.2 0" />
              </svg>
              <svg viewBox="0 0 27 13" fill="none">
                <rect
                  x="0.5"
                  y="0.5"
                  width="23"
                  height="12"
                  rx="3.5"
                  stroke="currentColor"
                  opacity="0.4"
                />
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="9"
                  rx="2"
                  fill="currentColor"
                />
                <path
                  d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z"
                  fill="currentColor"
                  opacity="0.4"
                />
              </svg>
            </span>
          </div>

          <div className={styles.header}>
            <svg
              className={styles.back}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
            <div className={styles.avatar} aria-hidden="true">
              {SeedOfLifeMark}
            </div>
            <div className={styles.name}>{content.name}</div>
          </div>

          <div className={styles.thread}>
            <div className={styles.day}>
              <span className={styles.dayStrong}>Today</span> 7:45 AM
            </div>
            {content.bubbles.map((bubble, i) => {
              const prev = content.bubbles[i - 1];
              const gap =
                i === 0
                  ? ""
                  : prev.from === bubble.from
                    ? styles.gapSmall
                    : styles.gapLarge;
              const side = bubble.from === "me" ? styles.out : styles.in;
              return (
                <div key={i} className={[styles.bubble, side, gap].join(" ")}>
                  {bubble.text}
                </div>
              );
            })}
          </div>

          <div className={styles.footer} aria-hidden="true">
            <div className={styles.composer}>
              {content.draft ? (
                <span className={styles.draft}>
                  {content.draft}
                  <span className={styles.caret} />
                </span>
              ) : (
                <span className={styles.placeholder}>Text Message…</span>
              )}
              <span className={styles.send}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M6 11l6-6 6 6" />
                </svg>
              </span>
            </div>
            <span className={styles.homeBar} />
          </div>
        </div>
      </div>
    </div>
  );
}
