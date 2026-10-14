import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { HeroPhone } from "./hero-phone";
import { ENTIREMIND_CONTENT } from "./hero-phone-content";
import { SmsPhone } from "./sms-phone";
import styles from "./hero-scene.module.css";

/**
 * The locked HeroPhone with aspirational imagery around it.
 *
 * - `cards`: Calm-style — photo cards and product moments float beside the
 *   phone (a vision card, a weekly-recap card, a door into The Space).
 * - `board`: a linen "My vision" board overlaps the phone's lower left and
 *   printed photos spill off its right side.
 *
 * Around the Messages-style SmsPhone, images spill out organically:
 * - `scatter`: tilted tags, taped prints and ink doodles overlap the phone's
 *   corners and edges (Qeepsake-style). Tags show real product moments,
 *   never invented stats.
 * - `spill`: a "My vision" board tucked against the left edge, prints
 *   cascading down the right.
 *
 * Overlaps land on the phone's frame and empty screen only, never on message
 * text. In scene units the SmsPhone device sits at x 485–955, y 132–1072;
 * its bubbles run x 514–891, y 372–775, and the composer y 935–994.
 *
 * Photographs are generated stills in public/marketing/hero/. Everything else
 * is code: the phone is the exact HeroPhone render, and no text is ever part
 * of an image.
 */

export type HeroSceneLayout = "cards" | "board" | "scatter" | "spill";

const PHOTO = {
  studio: "/marketing/hero/studio.webp",
  studioWoman: "/marketing/hero/studio-woman.webp",
  terrace: "/marketing/hero/terrace.webp",
  cliffWalk: "/marketing/hero/cliff-walk.webp",
  coffeeJournal: "/marketing/hero/coffee-journal.webp",
  slowMorning: "/marketing/hero/slow-morning.webp",
  beachWalk: "/marketing/hero/beach-walk.webp",
  yoga: "/marketing/hero/yoga.webp",
} as const;

/** Position on the 1440 × 1200 canvas, in canvas units. */
function at(
  x: number,
  y: number,
  w: number,
  h?: number,
  rotate = 0,
): CSSProperties {
  const u = (n: number) => `calc(var(--u) * ${n})`;
  return {
    left: u(x),
    top: u(y),
    width: u(w),
    height: h === undefined ? undefined : u(h),
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
  };
}

function Photo({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  return (
    <div className={styles.photo}>
      <Image src={src} alt={alt} fill sizes={sizes} priority />
    </div>
  );
}

/** Flat four-point sparkle: printed foil, not a puffy charm. */
function Sparkle({
  x,
  y,
  size,
  tone = "gold",
}: {
  x: number;
  y: number;
  size: number;
  tone?: "gold" | "cobalt";
}) {
  return (
    <div
      className={`${styles.item} ${tone === "gold" ? styles.sparkle : styles.sparkleCobalt}`}
      style={at(x, y, size, size)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C12.7 6.6 17.4 11.3 24 12 17.4 12.7 12.7 17.4 12 24 11.3 17.4 6.6 12.7 0 12 6.6 11.3 11.3 6.6 12 0Z" />
      </svg>
    </div>
  );
}

const SPACE_STARS = [
  { x: 26, y: 24, r: 1.6 },
  { x: 44, y: 16, r: 1 },
  { x: 62, y: 28, r: 2.2 },
  { x: 78, y: 40, r: 1 },
  { x: 34, y: 44, r: 1 },
  { x: 54, y: 50, r: 1.4 },
  { x: 20, y: 56, r: 1 },
  { x: 72, y: 60, r: 1.2 },
];

function SpaceChip({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <div
      className={`${styles.item} ${styles.space}`}
      style={at(x, y, size, size)}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {SPACE_STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--color-leaf)" />
        ))}
      </svg>
      <span className={styles.spaceLabel}>The Space</span>
    </div>
  );
}

function PhotoCard({
  box,
  src,
  alt,
  eyebrow,
  title,
}: {
  box: CSSProperties;
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className={`${styles.item} ${styles.card}`} style={box}>
      <Photo src={src} alt={alt} sizes="(max-width: 768px) 40vw, 360px" />
      <div className={styles.caption}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <div className={styles.title}>{title}</div>
      </div>
    </div>
  );
}

function Print({
  box,
  src,
  alt,
  slim,
  tape,
}: {
  box: CSSProperties;
  src: string;
  alt: string;
  slim?: boolean;
  tape?: boolean;
}) {
  return (
    <div
      className={`${styles.item} ${styles.print} ${slim ? styles.printSlim : ""}`}
      style={box}
    >
      {tape ? <span className={styles.tape} aria-hidden="true" /> : null}
      <Photo src={src} alt={alt} sizes="(max-width: 768px) 30vw, 280px" />
    </div>
  );
}

/** A tilted label, like a sticker on the page. */
function Tag({
  box,
  tone,
  eyebrow,
  title,
}: {
  box: CSSProperties;
  tone: "cobalt" | "paper";
  eyebrow: string;
  title: string;
}) {
  return (
    <div
      className={`${styles.item} ${styles.tag} ${tone === "cobalt" ? styles.tagCobalt : styles.tagPaper}`}
      style={box}
    >
      <div className={styles.tagEyebrow}>{eyebrow}</div>
      <div className={styles.tagTitle}>{title}</div>
    </div>
  );
}

/** Hand-drawn ink line art: ink on linen, per DESIGN.md's emblem rule. */
function Doodle({
  kind,
  x,
  y,
  size,
  rotate = 0,
}: {
  kind: "star" | "heart";
  x: number;
  y: number;
  size: number;
  rotate?: number;
}) {
  return (
    <div
      className={`${styles.item} ${styles.doodle}`}
      style={at(x, y, size, size, rotate)}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "star" ? (
          <>
            <path d="M32 14l5.2 11.4 12.4 1.5-9.2 8.5 2.5 12.3L32 41.5l-10.9 6.2 2.5-12.3-9.2-8.5 12.4-1.5Z" />
            <path d="M10 12l4 4M8 22l5 1M54 12l-4 4M56 22l-5 1M32 4v5" />
          </>
        ) : (
          <>
            <path d="M32 50C20 41 12 34 12 25c0-6 4.5-10 10-10 4.3 0 7.6 2.6 10 6.4C34.4 17.6 37.7 15 42 15c5.5 0 10 4 10 10 0 9-8 16-20 25Z" />
            <path d="M50 8l-3 5M58 16l-5 2M44 6l-.5 5" />
          </>
        )}
      </svg>
    </div>
  );
}

function ScatterLayout() {
  return (
    <>
      <Tag
        box={at(262, 140, 350, undefined, -8)}
        tone="cobalt"
        eyebrow="My intention"
        title="Open my studio by spring"
      />
      <Print
        box={at(872, 158, 214, 258, 8)}
        src={PHOTO.studioWoman}
        alt="A woman at work in her own studio"
        tape
      />
      <Print
        box={at(262, 470, 236, 290, -7)}
        src={PHOTO.terrace}
        alt="A terrace above a calm blue sea"
      />
      <Tag
        box={at(936, 566, 320, undefined, 6)}
        tone="paper"
        eyebrow="This week we noticed"
        title="You keep making room to create."
      />
      <Print
        box={at(930, 770, 220, 218, -6)}
        src={PHOTO.coffeeJournal}
        alt="Coffee and a journal on a sunlit windowsill"
        slim
        tape
      />
      <Print
        box={at(300, 820, 180, 150, 5)}
        src={PHOTO.slowMorning}
        alt="Morning light across linen sheets"
        slim
      />
      <Doodle kind="star" x={196} y={372} size={84} rotate={-8} />
      <Doodle kind="heart" x={1150} y={712} size={72} rotate={10} />
      <Sparkle x={640} y={1090} size={24} />
      <Sparkle x={1180} y={1010} size={20} />
      <Sparkle x={230} y={300} size={18} />
    </>
  );
}

function SpillLayout() {
  return (
    <>
      <div
        className={`${styles.item} ${styles.board}`}
        style={at(116, 620, 392, 360, -5)}
      >
        <div className={styles.boardTitle}>My vision</div>
        <div className={styles.boardRule} />
        <Print
          box={at(24, 110, 160, 196, -4)}
          src={PHOTO.terrace}
          alt="A terrace above a calm blue sea"
          slim
          tape
        />
        <Print
          box={at(196, 92, 158, 128, 3)}
          src={PHOTO.studio}
          alt="A sunlit creative studio"
          slim
          tape
        />
        <Print
          box={at(214, 214, 128, 112, -2)}
          src={PHOTO.coffeeJournal}
          alt="Coffee and a journal on a windowsill"
          slim
        />
      </div>
      <Print
        box={at(904, 214, 230, 274, 7)}
        src={PHOTO.studioWoman}
        alt="A woman at work in her own studio"
        tape
      />
      <Print
        box={at(1010, 486, 214, 250, -6)}
        src={PHOTO.cliffWalk}
        alt="A woman walking a coastal path above the sea"
      />
      <Print
        box={at(918, 740, 236, 270, 5)}
        src={PHOTO.beachWalk}
        alt="A woman walking a quiet beach at sunrise"
      />
      <Print
        box={at(250, 236, 196, 236, -6)}
        src={PHOTO.yoga}
        alt="A yoga mat by a sunlit window"
        tape
      />
      <Sparkle x={1150} y={196} size={28} />
      <Sparkle x={1250} y={470} size={34} tone="cobalt" />
      <Sparkle x={1210} y={760} size={22} />
      <Sparkle x={1010} y={1090} size={18} />
      <Sparkle x={196} y={560} size={22} />
      <Doodle kind="star" x={1180} y={1020} size={70} rotate={12} />
    </>
  );
}

function CardsLayout() {
  return (
    <>
      <PhotoCard
        box={at(196, 132, 236, 300)}
        src={PHOTO.terrace}
        alt="A terrace above a calm blue sea"
        eyebrow="Your vision"
        title="Life by the sea"
      />
      <PhotoCard
        box={at(90, 480, 330, 420)}
        src={PHOTO.studio}
        alt="A sunlit creative studio"
        eyebrow="Your intention"
        title="A studio of my own"
      />
      <div
        className={`${styles.item} ${styles.recap}`}
        style={at(950, 236, 330)}
      >
        <div className={styles.eyebrow}>This week we noticed</div>
        <div className={styles.title}>You keep making room to create.</div>
      </div>
      <SpaceChip x={1030} y={430} size={170} />
      <PhotoCard
        box={at(1010, 640, 270, 300)}
        src={PHOTO.coffeeJournal}
        alt="Coffee and a journal on a sunlit windowsill"
        eyebrow="Today"
        title="One slow morning"
      />
      <Sparkle x={150} y={448} size={22} />
      <Sparkle x={1300} y={600} size={28} />
      <Sparkle x={1250} y={984} size={18} />
      <Sparkle x={455} y={1100} size={20} />
    </>
  );
}

function BoardLayout() {
  return (
    <>
      {/* Covers the phone's intention card whole (never half a card), and
          sits clear of the third message above and the composer below. */}
      <div
        className={`${styles.item} ${styles.board}`}
        style={at(150, 638, 730, 314, -2)}
      >
        <div className={styles.boardTitle}>My vision</div>
        <div className={styles.boardRule} />
        <div className={styles.boardCaption}>
          See it clearly.
          <br />
          Start small.
        </div>
        <Print
          box={at(40, 176, 170, 112, 2)}
          src={PHOTO.slowMorning}
          alt="Morning light across linen sheets"
          slim
          tape
        />
        <Print
          box={at(262, 50, 150, 205, -3)}
          src={PHOTO.terrace}
          alt="A terrace above a calm blue sea"
          slim
          tape
        />
        <Print
          box={at(430, 30, 165, 135, 2)}
          src={PHOTO.studio}
          alt="A sunlit creative studio"
          slim
          tape
        />
        <Print
          box={at(560, 112, 130, 165, -2)}
          src={PHOTO.coffeeJournal}
          alt="Coffee and a journal on a windowsill"
          slim
          tape
        />
      </div>
      <Print
        box={at(938, 300, 250, 320, 6)}
        src={PHOTO.studioWoman}
        alt="A woman at work in her own studio"
      />
      <Print
        box={at(1010, 650, 250, 300, -5)}
        src={PHOTO.cliffWalk}
        alt="A woman walking a coastal path above the sea"
      />
      <Sparkle x={905} y={262} size={30} />
      <Sparkle x={1210} y={300} size={34} tone="cobalt" />
      <Sparkle x={1270} y={612} size={24} />
      <Sparkle x={1290} y={1000} size={22} />
      <Sparkle x={40} y={570} size={20} />
    </>
  );
}

export function HeroScene({
  layout,
  className,
}: {
  layout: HeroSceneLayout;
  className?: string;
}): ReactNode {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(" ")}>
      <div className={styles.canvas}>
        <div className={styles.phone}>
          {layout === "scatter" || layout === "spill" ? (
            <SmsPhone content={ENTIREMIND_CONTENT} />
          ) : (
            <HeroPhone content={ENTIREMIND_CONTENT} />
          )}
        </div>
        {layout === "cards" ? (
          <CardsLayout />
        ) : layout === "board" ? (
          <BoardLayout />
        ) : layout === "scatter" ? (
          <ScatterLayout />
        ) : (
          <SpillLayout />
        )}
      </div>
    </div>
  );
}
