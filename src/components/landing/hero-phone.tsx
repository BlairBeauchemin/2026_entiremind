import type { ReactNode } from "react";
import styles from "./hero-phone.module.css";

/**
 * The soft, abstracted phone used for the landing hero and for ad renders.
 *
 * Unlike `PhoneMockup` (an iOS Messages facsimile), this is a marketing
 * illustration: a near-white slab with floating bubbles, one product card and
 * a frosted composer, recreated from an approved reference. It is static for
 * now; every bubble and the card are separate elements so load-in motion can
 * be layered on later without restructuring.
 *
 * Ads are produced by screenshotting /preview/hero-phone, so this component is
 * the single source of truth for both surfaces.
 */

export interface HeroPhoneBubble {
  from: "them" | "me";
  text: string;
}

export interface HeroPhoneCard {
  title: string;
  subtitle: string;
  icon: ReactNode;
  body: ReactNode;
  action: string;
}

export interface HeroPhoneContent {
  name: string;
  status?: string;
  bubbles: HeroPhoneBubble[];
  card: HeroPhoneCard;
}

interface HeroPhoneProps {
  content: HeroPhoneContent;
  font?: "karla" | "inter";
  replyTone?: "sky" | "cobalt";
  className?: string;
}

export function HeroPhone({
  content,
  font = "inter",
  replyTone = "cobalt",
  className,
}: HeroPhoneProps) {
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

        <div className={styles.pill}>
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
            return (
              <div key={i} className={[styles.bubble, side, gap].join(" ")}>
                {bubble.text}
              </div>
            );
          })}

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.tile}>{content.card.icon}</div>
              <div>
                <div className={styles.cardTitle}>{content.card.title}</div>
                <div className={styles.cardSub}>{content.card.subtitle}</div>
              </div>
            </div>
            <div className={styles.cardBody}>{content.card.body}</div>
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
          <span className={styles.placeholder}>Message</span>
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
        </div>
      </div>
    </div>
  );
}
