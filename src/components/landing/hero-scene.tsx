import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { HeroPhone } from "./hero-phone";
import { ENTIREMIND_CONTENT } from "./hero-phone-content";
import styles from "./hero-scene.module.css";

/**
 * The locked HeroPhone with aspirational imagery around it.
 *
 * - `cards`: Calm-style — photo cards and product moments float beside the
 *   phone (a vision card, a weekly-recap card, a door into The Space).
 * - `board`: a linen "My vision" board overlaps the phone's lower left and
 *   printed photos spill off its right side.
 *
 * Photographs are generated stills in public/marketing/hero/. Everything else
 * is code: the phone is the exact HeroPhone render, and no text is ever part
 * of an image.
 */

export type HeroSceneLayout = "cards" | "board";

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
          <HeroPhone content={ENTIREMIND_CONTENT} />
        </div>
        {layout === "cards" ? <CardsLayout /> : <BoardLayout />}
      </div>
    </div>
  );
}
