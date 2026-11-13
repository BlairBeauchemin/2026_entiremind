import type { CSSProperties } from "react";
import { SMS_CONTENT } from "./hero-phone-content";
import { SmsPhone } from "./sms-phone";
import { Doodle, PHOTO, Print, Sparkle, at } from "./hero-scene";
import styles from "./hero-scene.module.css";

/**
 * Phone-sized hero scenes: the same Messages phone, prints, sparkles and
 * float as the desktop "spill" scene (HeroScene), recomposed on a portrait
 * canvas so the phone can be much larger on a phone screen. Options for the
 * founder to compare; the live hero still uses HeroScene everywhere.
 *
 * - "a": the phone at about 62% of the screen, six prints around it, as in
 *   the desktop scene, overlapping its frame.
 * - "b": the phone at about 70%, tucked into a "My vision" board and a
 *   flower print that cover its lower part (the empty space and the
 *   composer); larger prints overlap its top corners and right edge.
 * (A third option, a large photograph behind the phone, was dropped.)
 *
 * Canvas: 1000 units wide (--u = 1/1000 of the width), height per option.
 * The SmsPhone draws its device at x 277–747, y 42–982 of a 1024-unit square,
 * so a device D units wide sits in a wrapper D × 1024/470 wide. On the device,
 * the four messages run from about 6% to 86% across and 25% to 82% down;
 * nothing overlaps them, only the frame, the header and the space below.
 */
export type MobileSceneOption = "a" | "b";

const CANVAS_WIDTH = 1000;

/** Places the SmsPhone so its device is `width` units wide at (x, y). */
function phoneBox(x: number, y: number, width: number, zIndex?: number) {
  const u = (n: number) => `calc(var(--u) * ${n})`;
  return {
    left: u(x - (277 * width) / 470),
    top: u(y - (42 * width) / 470),
    width: u((1024 * width) / 470),
    zIndex,
  } satisfies CSSProperties;
}

const OPTIONS: Record<
  MobileSceneOption,
  { height: number; clipBottom?: boolean }
> = {
  a: { height: 1420 },
  b: { height: 1590, clipBottom: true },
};

function OptionA() {
  // Device 620 wide at (190, 50): messages x 235–765, y 287–1087 (scaled
  // from B's measured positions). Six prints, bigger, around and over the
  // phone's frame, as in the desktop scene; none on a message.
  return (
    <>
      <div className={styles.phone} style={phoneBox(190, 50, 620)}>
        <SmsPhone content={SMS_CONTENT} />
      </div>
      <Print
        box={at(694, 0, 296, 346, 6)}
        src={PHOTO.freedomField}
        alt="A woman walking through a summer field holding a straw hat"
        tape
      />
      <Print
        box={at(0, 56, 236, 206, -7)}
        src={PHOTO.oliveCoast}
        alt="Sunlight through olive branches above a coastal town"
        tape
      />
      <Print
        box={at(0, 560, 214, 190, -6)}
        src={PHOTO.loveBeach}
        alt="A couple walking hand in hand along a golden beach"
      />
      <Print
        box={at(788, 540, 206, 236, 5)}
        src={PHOTO.potteryStudio}
        alt="A bright pottery studio with a wheel and shelves of ceramics"
        tape
      />
      <Print
        box={at(10, 1104, 320, 296, 4)}
        src={PHOTO.flowerShop}
        alt="Buckets of fresh flowers outside a small flower shop"
        tape
      />
      <Print
        box={at(676, 1110, 310, 280, -5)}
        src={PHOTO.slowMorningTable}
        alt="An open book, croissant and coffee by a sunlit window"
      />
      <Sparkle x={950} y={420} size={28} />
      <Sparkle x={40} y={440} size={24} tone="cobalt" />
      <Sparkle x={950} y={900} size={22} />
      <Sparkle x={40} y={960} size={20} />
      <Doodle kind="star" x={440} y={1320} size={64} rotate={12} />
    </>
  );
}

function OptionB() {
  // Device 700 wide at (150, 40): messages x 201–799, y 308–1211 (measured).
  // The board and the bottom-right print cover the phone from y 1226 down. Photos
  // overlap the phone's frame (never a message) to carry the "life you want".
  return (
    <>
      <div className={styles.phone} style={phoneBox(150, 40, 700)}>
        <SmsPhone content={SMS_CONTENT} />
      </div>
      <Print
        box={at(690, 0, 300, 360, 7)}
        src={PHOTO.freedomField}
        alt="A woman walking through a summer field holding a straw hat"
        tape
      />
      <Print
        box={at(0, 56, 250, 214, -7)}
        src={PHOTO.oliveCoast}
        alt="Sunlight through olive branches above a coastal town"
        tape
      />
      <Print
        box={at(818, 640, 178, 164, 5)}
        src={PHOTO.loveBeach}
        alt="A couple walking hand in hand along a golden beach"
      />
      {/* "My vision": the title tucked into the top-left corner, a print
          filling the space under it, two more beside it. */}
      <div
        className={`${styles.item} ${styles.board}`}
        style={at(10, 1232, 712, 330, -2)}
      >
        <div className={styles.boardTitle}>My vision</div>
        <div className={styles.boardRule} />
        <Print
          box={at(18, 100, 196, 204, -4)}
          src={PHOTO.potteryStudio}
          alt="A bright pottery studio with a wheel and shelves of ceramics"
          slim
          tape
        />
        <Print
          box={at(234, 22, 214, 262, 3)}
          src={PHOTO.slowMorningTable}
          alt="An open book, croissant and coffee by a sunlit window"
          slim
          tape
        />
        <Print
          box={at(468, 34, 210, 246, -3)}
          src={PHOTO.journalCoffee}
          alt="Coffee and a notebook in striped window light"
          slim
        />
      </div>
      <Print
        box={at(696, 1226, 292, 340, 6)}
        src={PHOTO.flowerShop}
        alt="Buckets of fresh flowers outside a small flower shop"
        tape
      />
      <Sparkle x={950} y={420} size={30} />
      <Sparkle x={34} y={440} size={24} tone="cobalt" />
      <Sparkle x={40} y={1160} size={20} />
      <Sparkle x={946} y={1060} size={22} />
    </>
  );
}

export function HeroSceneMobile({
  option,
  float = true,
}: {
  option: MobileSceneOption;
  /** The same gentle drift as the desktop scene ("float-strong"). */
  float?: boolean;
}) {
  const { height, clipBottom } = OPTIONS[option];
  const canvasClass = [
    styles.canvas,
    float ? `${styles.motionFloat} ${styles.floatStrong}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={styles.frame}
      style={{
        aspectRatio: `${CANVAS_WIDTH} / ${height}`,
        // Option B crops the phone at the board's lower edge; the other
        // sides stay open so the drift is never clipped.
        clipPath: clipBottom ? "inset(-50% -50% 0 -50%)" : undefined,
      }}
      aria-hidden="true"
    >
      <div
        className={canvasClass}
        style={{ "--u": `calc(100cqw / ${CANVAS_WIDTH})` } as CSSProperties}
      >
        {option === "a" ? <OptionA /> : <OptionB />}
      </div>
    </div>
  );
}
