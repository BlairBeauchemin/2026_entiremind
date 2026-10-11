import type { CSSProperties, ReactNode } from "react";
import styles from "./hero-phone.module.css";

/**
 * The soft, abstracted phone used for the landing hero and for ad renders.
 *
 * Unlike `PhoneMockup` (an iOS Messages facsimile), this is a marketing
 * illustration: a near-white slab with floating bubbles, one product card and
 * a frosted composer, recreated from an approved reference. Every bubble and
 * the card are separate elements so motion can drive each one.
 *
 * Ads are produced by screenshotting /preview/hero-phone, so this component is
 * the single source of truth for both surfaces.
 *
 * Static unless given a `frame`: one instant of the looping timeline, which
 * `HeroPhoneMotion` computes from a single clock (hero-phone-timeline.ts).
 * Every animated value is a pure function of that time, so the site and the
 * frame-by-frame ad recorder can never disagree.
 */

export interface HeroPhoneBubble {
  from: "them" | "me";
  text: string;
}

export interface HeroPhoneCard {
  title: string;
  subtitle: string;
  icon: ReactNode;
  /** Either an illustration… */
  body?: ReactNode;
  /** …or the person's own words, set in the brand serif. */
  quote?: string;
  action: string;
}

export interface HeroPhoneContent {
  name: string;
  status?: string;
  /** Optional mark shown in a badge overlapping the top of the name pill. */
  mark?: ReactNode;
  bubbles: HeroPhoneBubble[];
  card: HeroPhoneCard;
  /** A reply still being typed in the composer, shown with a caret. */
  draft?: string;
}

/** One instant of the animated timeline (see hero-phone-timeline.ts). */
export interface HeroPhoneFrame {
  /** Per bubble: opacity and how far below its resting place it sits (em). */
  bubbles: { opacity: number; rise: number }[];
  /** Per bubble: opacity of the typing indicator in its slot. */
  typing: number[];
  /** Opacity of each of the indicator's three dots. */
  dots: [number, number, number];
  card: { opacity: number; rise: number };
  /** How much of the draft has been typed. */
  draftChars: number;
  draftOpacity: number;
  caretOn: boolean;
}

interface HeroPhoneProps {
  content: HeroPhoneContent;
  font?: "karla" | "inter";
  replyTone?: "sky" | "cobalt";
  className?: string;
  frame?: HeroPhoneFrame;
}

function arrive(
  state: { opacity: number; rise: number } | undefined,
): CSSProperties | undefined {
  return state
    ? {
        opacity: state.opacity,
        transform: state.rise ? `translateY(${state.rise}em)` : undefined,
      }
    : undefined;
}

export function HeroPhone({
  content,
  font = "inter",
  replyTone = "cobalt",
  className,
  frame: f,
}: HeroPhoneProps) {
  const draft = f ? content.draft?.slice(0, f.draftChars) : content.draft;
  const canvasClass = [
    styles.canvas,
    font === "inter" ? styles.fontInter : "",
    replyTone === "cobalt" ? styles.replyCobalt : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={[styles.frame, className].filter(Boolean).join(" ")}>
      <div className={canvasClass}>
        <div className={styles.panel} aria-hidden="true" />

        {content.mark ? (
          <div className={styles.badge} aria-hidden="true">
            {content.mark}
          </div>
        ) : null}

        <div
          className={[styles.pill, content.mark ? styles.pillWithMark : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={styles.pillName}>{content.name}</div>
          {content.status ? (
            <div className={styles.pillStatus}>{content.status}</div>
          ) : null}
        </div>

        <div className={styles.thread}>
          {content.bubbles.map((bubble, i) => {
            const prev = content.bubbles[i - 1];
            // Consecutive messages from the same side sit tight together;
            // a change of speaker gets the larger gap.
            const gap =
              i === 0
                ? ""
                : prev.from === bubble.from
                  ? styles.gapSmall
                  : styles.gapLarge;
            const side = bubble.from === "me" ? styles.out : styles.in;
            const slot = bubble.from === "me" ? styles.slotOut : styles.slotIn;
            const typing = f?.typing[i] ?? 0;
            return (
              <div key={i} className={[styles.slot, slot, gap].join(" ")}>
                <div
                  className={[styles.bubble, side].join(" ")}
                  style={arrive(f?.bubbles[i])}
                >
                  {bubble.text}
                </div>
                {f && typing > 0 ? (
                  <div className={styles.typing} style={{ opacity: typing }}>
                    {f.dots.map((o, d) => (
                      <span
                        key={d}
                        className={styles.typingDot}
                        style={{ opacity: o }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className={styles.card} style={arrive(f?.card)}>
            <div className={styles.cardHead}>
              <div className={styles.tile}>{content.card.icon}</div>
              <div>
                <div className={styles.cardTitle}>{content.card.title}</div>
                <div className={styles.cardSub}>{content.card.subtitle}</div>
              </div>
            </div>
            {content.card.quote ? (
              <div className={`${styles.cardBody} ${styles.cardQuote}`}>
                <p className={styles.quoteText}>{content.card.quote}</p>
                <span className={styles.quoteRule} aria-hidden="true" />
              </div>
            ) : (
              <div className={styles.cardBody}>{content.card.body}</div>
            )}
            <div className={styles.cardButton}>{content.card.action}</div>
          </div>
        </div>

        <div className={styles.composer} aria-hidden="true">
          <svg className={styles.iconPlus} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 4v16M4 12h16"
              stroke="#111"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {draft ? (
            <span
              className={styles.draft}
              style={f ? { opacity: f.draftOpacity } : undefined}
            >
              {draft}
              <span
                className={styles.caret}
                style={f && !f.caretOn ? { opacity: 0 } : undefined}
              />
            </span>
          ) : (
            <span className={styles.placeholder}>Message</span>
          )}
          <svg
            className={styles.iconMic}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A9099"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          {draft ? (
            // Once there is text, the voice control becomes send.
            <span className={styles.send}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </span>
          ) : (
            <svg
              className={styles.iconWave}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 9v6M9.5 5v14M14 8v8M18.5 10v4" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
