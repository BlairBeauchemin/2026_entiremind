import type { CSSProperties } from "react";
import { SMS_CONTENT } from "./hero-phone-content";
import { SmsPhone } from "./sms-phone";
import { PHOTO, Print, Sparkle, at } from "./hero-scene";
import styles from "./hero-scene.module.css";

/**
 * Phone-sized hero scenes: the same Messages phone, prints, sparkles and
 * float as the desktop "spill" scene (HeroScene), recomposed on a portrait
 * canvas so the phone can be much larger on a phone screen. Options for the
 * founder to compare; the live hero still uses HeroScene everywhere.
 *
 * - "a": the phone at 47% of the screen, with the live scene's prints and
 *   "My vision" board (three prints) in the same places.
 * - "b": the phone at 64%, the same arrangement with fewer pieces (a
 *   two-print board) and the board below the phone's lower left.
 *
 * Canvas: 1000 units wide (--u = 1/1000 of the width), height per option.
 * The SmsPhone draws its device at x 277–747, y 42–982 of a 1024-unit square,
 * so a device D units wide sits in a wrapper D × 1024/470 wide.
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

const OPTIONS: Record<MobileSceneOption, { height: number }> = {
  a: { height: 1110 },
  b: { height: 1420 },
};

/* Both options keep the live scene's arrangement: olive coast top left,
 * the "My vision" board low on the left, the field, the beach and the
 * flower shop down the right. The phone is bare (no composer, bigger
 * bubbles). Its messages fill the device from 19% to 91% of its height;
 * the incoming ones run 6–83% across, the replies 17–94%. A print may
 * cover the phone's top 18% (status bar, header), its frame, and the
 * side of the screen a message isn't on. */

function VisionBoard({
  box,
  prints,
}: {
  box: CSSProperties;
  prints: { box: CSSProperties; photo: keyof typeof PHOTO; tape?: boolean }[];
}) {
  return (
    <div
      className={`${styles.item} ${styles.board}`}
      // Narrower than the desktop board: less side padding, so the title
      // stays on one line.
      style={{ ...box, paddingInline: "calc(var(--u) * 18)" }}
    >
      <div
        className={styles.boardTitle}
        style={{ whiteSpace: "nowrap", fontSize: "calc(var(--u) * 40)" }}
      >
        My vision
      </div>
      <div className={styles.boardRule} />
      {prints.map((p) => (
        <Print
          key={p.photo}
          box={p.box}
          src={PHOTO[p.photo]}
          alt={ALT[p.photo]}
          slim
          tape={p.tape}
        />
      ))}
    </div>
  );
}

const ALT: Record<string, string> = {
  freedomField: "A woman walking through a summer field holding a straw hat",
  oliveCoast: "Sunlight through olive branches above a coastal town",
  loveBeach: "A couple walking hand in hand along a golden beach",
  flowerShop: "Buckets of fresh flowers outside a small flower shop",
  potteryStudio: "A bright pottery studio with a wheel and shelves of ceramics",
  slowMorningTable: "An open book, croissant and coffee by a sunlit window",
  journalCoffee: "Coffee and a notebook in striped window light",
};

function OptionA() {
  // Device 474 wide at (263, 40), 948 tall.
  return (
    <>
      <div className={styles.phone} style={phoneBox(263, 40, 474)}>
        <SmsPhone content={SMS_CONTENT} bare />
      </div>
      <VisionBoard
        box={at(0, 630, 272, 420, -4)}
        prints={[
          { box: at(12, 84, 150, 184, -4), photo: "potteryStudio", tape: true },
          {
            box: at(108, 214, 128, 108, 3),
            photo: "slowMorningTable",
            tape: true,
          },
          { box: at(18, 292, 124, 112, -2), photo: "journalCoffee" },
        ]}
      />
      <Print
        box={at(664, 40, 300, 340, 5)}
        src={PHOTO.freedomField}
        alt={ALT.freedomField}
        tape
      />
      <Print
        box={at(718, 500, 256, 216, -5)}
        src={PHOTO.loveBeach}
        alt={ALT.loveBeach}
      />
      <Print
        box={at(722, 752, 262, 228, 4)}
        src={PHOTO.flowerShop}
        alt={ALT.flowerShop}
      />
      <Print
        box={at(0, 50, 280, 196, -6)}
        src={PHOTO.oliveCoast}
        alt={ALT.oliveCoast}
        tape
      />
      <Sparkle x={960} y={20} size={26} />
      <Sparkle x={968} y={470} size={30} tone="cobalt" />
      <Sparkle x={966} y={1000} size={22} />
      {/* Quiet accents in the open space on the left. */}
      <Sparkle x={92} y={404} size={28} tone="cobalt" />
      <Sparkle x={194} y={548} size={16} />
      <Sparkle x={200} y={1074} size={18} />
    </>
  );
}

function OptionB() {
  // Device 640 wide at (180, 30), 1280 tall: a bigger phone, five pieces.
  return (
    <>
      <div className={styles.phone} style={phoneBox(180, 30, 640)}>
        <SmsPhone content={SMS_CONTENT} bare />
      </div>
      <VisionBoard
        box={at(0, 1018, 280, 330, -4)}
        prints={[
          { box: at(14, 84, 140, 180, -4), photo: "potteryStudio", tape: true },
          {
            box: at(136, 104, 128, 156, 3),
            photo: "slowMorningTable",
            tape: true,
          },
        ]}
      />
      <Print
        box={at(726, 50, 274, 330, 5)}
        src={PHOTO.freedomField}
        alt={ALT.freedomField}
        tape
      />
      <Print
        box={at(788, 612, 212, 184, -5)}
        src={PHOTO.loveBeach}
        alt={ALT.loveBeach}
      />
      <Print
        box={at(726, 806, 272, 214, 4)}
        src={PHOTO.flowerShop}
        alt={ALT.flowerShop}
      />
      <Print
        box={at(0, 26, 256, 200, -7)}
        src={PHOTO.oliveCoast}
        alt={ALT.oliveCoast}
        tape
      />
      <Sparkle x={34} y={560} size={22} tone="cobalt" />
      <Sparkle x={966} y={560} size={28} />
      <Sparkle x={960} y={1100} size={22} />
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
  const { height } = OPTIONS[option];
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
