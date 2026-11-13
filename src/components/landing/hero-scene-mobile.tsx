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
 * - "a": the phone at about 64% of the screen, three prints around it, one
 *   tucked over the empty space under the last message.
 * - "b": the phone at about 82%, tucked into a "My vision" board that covers
 *   its lower part (the empty space and the composer), plus prints peeking
 *   from the top corners.
 * - "c": one large tilted photograph behind the phone, two prints in front.
 *
 * Canvas: 1000 units wide (--u = 1/1000 of the width), height per option.
 * The SmsPhone draws its device at x 277–747, y 42–982 of a 1024-unit square,
 * so a device D units wide sits in a wrapper D × 1024/470 wide. On the device,
 * the four messages run from about 6% to 86% across and 25% to 82% down;
 * nothing overlaps them, only the frame, the header and the space below.
 */
export type MobileSceneOption = "a" | "b" | "c";

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
  a: { height: 1400 },
  b: { height: 1660, clipBottom: true },
  c: { height: 1400 },
};

function OptionA() {
  // Device 640 wide at (180, 60): messages x 218–730, y 380–1050.
  return (
    <>
      <div className={styles.phone} style={phoneBox(180, 60, 640)}>
        <SmsPhone content={SMS_CONTENT} />
      </div>
      <Print
        box={at(694, 10, 286, 330, 6)}
        src={PHOTO.freedomField}
        alt="A woman walking through a summer field holding a straw hat"
        tape
      />
      <Print
        box={at(8, 470, 196, 176, -7)}
        src={PHOTO.loveBeach}
        alt="A couple walking hand in hand along a golden beach"
      />
      <Print
        box={at(18, 1000, 280, 240, 4)}
        src={PHOTO.flowerShop}
        alt="Buckets of fresh flowers outside a small flower shop"
        tape
      />
      <Sparkle x={905} y={430} size={30} />
      <Sparkle x={60} y={360} size={26} tone="cobalt" />
      <Sparkle x={880} y={1150} size={22} />
      <Sparkle x={150} y={1310} size={18} />
      <Doodle kind="star" x={850} y={1235} size={72} rotate={12} />
    </>
  );
}

function OptionB() {
  // Device 780 wide at (110, 40): messages x 157–781, y 430–1320. The board
  // covers it from y 1372 (the composer and below); the canvas ends at 1660.
  return (
    <>
      <div className={styles.phone} style={phoneBox(110, 40, 780)}>
        <SmsPhone content={SMS_CONTENT} />
      </div>
      <Print
        box={at(752, 0, 236, 280, 7)}
        src={PHOTO.freedomField}
        alt="A woman walking through a summer field holding a straw hat"
        tape
      />
      <Print
        box={at(6, 150, 196, 172, -7)}
        src={PHOTO.oliveCoast}
        alt="Sunlight through olive branches above a coastal town"
        tape
      />
      <div
        className={`${styles.item} ${styles.board}`}
        style={at(30, 1372, 940, 290, -2)}
      >
        <div className={styles.boardTitle}>My vision</div>
        <div className={styles.boardRule} />
        <Print
          box={at(300, 26, 180, 214, -4)}
          src={PHOTO.potteryStudio}
          alt="A bright pottery studio with a wheel and shelves of ceramics"
          slim
          tape
        />
        <Print
          box={at(506, 40, 196, 164, 3)}
          src={PHOTO.slowMorningTable}
          alt="An open book, croissant and coffee by a sunlit window"
          slim
          tape
        />
        <Print
          box={at(724, 30, 170, 196, -2)}
          src={PHOTO.journalCoffee}
          alt="Coffee and a notebook in striped window light"
          slim
        />
      </div>
      <Sparkle x={940} y={350} size={30} />
      <Sparkle x={30} y={420} size={24} tone="cobalt" />
      <Sparkle x={34} y={1200} size={20} />
      <Sparkle x={946} y={1180} size={22} />
    </>
  );
}

function OptionC() {
  // Device 600 wide at (200, 110): messages x 236–716, y 410–1095.
  // The lead photograph sits behind the phone; the other prints in front.
  return (
    <>
      <div className={styles.phone} style={phoneBox(200, 110, 600, 2)}>
        <SmsPhone content={SMS_CONTENT} />
      </div>
      <Print
        box={{ ...at(470, 20, 500, 640, 6), zIndex: 1 }}
        src={PHOTO.freedomField}
        alt="A woman walking through a summer field holding a straw hat"
        tape
      />
      <Print
        box={{ ...at(14, 250, 214, 186, -7), zIndex: 3 }}
        src={PHOTO.oliveCoast}
        alt="Sunlight through olive branches above a coastal town"
        tape
      />
      <Print
        box={{ ...at(24, 1010, 290, 244, 5), zIndex: 3 }}
        src={PHOTO.loveBeach}
        alt="A couple walking hand in hand along a golden beach"
      />
      <Sparkle x={70} y={150} size={26} />
      <Sparkle x={905} y={760} size={32} tone="cobalt" />
      <Sparkle x={860} y={1180} size={22} />
      <Doodle kind="heart" x={820} y={1240} size={66} rotate={-8} />
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
        {option === "a" ? (
          <OptionA />
        ) : option === "b" ? (
          <OptionB />
        ) : (
          <OptionC />
        )}
      </div>
    </div>
  );
}
