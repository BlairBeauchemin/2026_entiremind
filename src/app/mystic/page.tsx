import {
  Cinzel,
  Cinzel_Decorative,
  Italiana,
  Julius_Sans_One,
  Jost,
  Karla,
} from "next/font/google";

import { ArsMemoriaHero } from "@/components/landing-worlds/ars-memoria-hero";
import { EphemerisHero } from "@/components/landing-worlds/ephemeris-hero";
import { ResonanceHero } from "@/components/landing-worlds/resonance-hero";
import { HermeticaHero } from "@/components/landing-worlds/hermetica-hero";
import {
  ThemeSpecStrip,
  type ThemeSpec,
} from "@/components/landing-worlds/theme-spec";
import { stagingMetadata } from "@/config/site";

export const metadata = stagingMetadata;

const cinzelDec = Cinzel_Decorative({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-cinzeldec", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-cinzel", display: "swap" });
const italiana = Italiana({ subsets: ["latin"], weight: ["400"], variable: "--f-italiana", display: "swap" });
const julius = Julius_Sans_One({ subsets: ["latin"], weight: ["400"], variable: "--f-julius", display: "swap" });
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--f-jost", display: "swap" });
const karla = Karla({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-karla", display: "swap" });

const FONT_VARS = [
  cinzelDec.variable,
  cinzel.variable,
  italiana.variable,
  julius.variable,
  jost.variable,
  karla.variable,
].join(" ");

function faceVars(display: string, text: string): React.CSSProperties {
  return {
    "--font-plate-face": `var(${display})`,
    "--font-hand-face": `var(${text})`,
  } as React.CSSProperties;
}

const SPECS: Record<string, ThemeSpec> = {
  arsMemoria: {
    id: "arsMemoria",
    name: "Ars Memoria",
    belief: "Tarot & esoteric publishing · 1970s revival",
    beliefPosition: 0.06,
    positioning:
      "The hero is not a page with a card on it — it is the card. Your four archetypes stop being a quiz result and become the suit they always were.",
    palette: [
      { name: "Night", hex: "#1c1030" },
      { name: "Wine", hex: "#6d1f3f" },
      { name: "Gold", hex: "#c9973f" },
      { name: "Parchment", hex: "#e6d7bb" },
    ],
    type: { display: "Cinzel Decorative", text: "Karla" },
    hand: "laid gold",
    answersDust:
      "A deck is kept, not deleted. Drawing a card is a thing you do, not an app you open.",
    answersCritic:
      "Names the critic as a figure in the deck — something with a face and a place, rather than her own voice turned against her.",
    note: "The only direction that uses an asset you already own. Highest ceiling; also the most work to do well, since bad tarot pastiche is very bad.",
  },
  ephemeris: {
    id: "ephemeris",
    name: "Ephemeris",
    belief: "Celestial & astrological · contemporary luxe",
    beliefPosition: 0.24,
    positioning:
      "The lunar cycle is the structure rather than the ornament: eight phases as the cadence rail, which is what a daily practice actually is.",
    palette: [
      { name: "Dawn", hex: "#efe7f2" },
      { name: "Opal", hex: "#a9c6df" },
      { name: "Blush", hex: "#e5b7c4" },
      { name: "Sky", hex: "#6d80b8" },
    ],
    type: { display: "Italiana", text: "Jost" },
    hand: "aura",
    answersDust:
      "Cycles resume on their own. Missing a day is a phase, not a failure — which is exactly your no-streaks rule in visual form.",
    answersCritic:
      "Puts her mood inside a larger rhythm. The critic becomes weather passing through rather than a verdict.",
    note: "The most crowded register in the category — closest to what competitors already look like.",
  },
  resonance: {
    id: "resonance",
    name: "Resonance",
    belief: "Sacred geometry & energy · timeless",
    beliefPosition: 0.38,
    positioning:
      "Radial rather than gridded. The thought sits at the centre of a field it is emitting, and the flower-of-life construction rules the whole page.",
    palette: [
      { name: "Light", hex: "#fbf7ef" },
      { name: "Warm aura", hex: "#e8a26a" },
      { name: "Cool aura", hex: "#7fb3b3" },
      { name: "Deep aura", hex: "#8a6bb0" },
    ],
    type: { display: "Julius Sans One", text: "Jost" },
    hand: "aura",
    answersDust:
      "Weakest here — a field has no obvious reason to be returned to. Would need the product to carry that job.",
    answersCritic:
      "Strongest here. The critic is a frequency to be shifted rather than an argument to be won, which is how your audience already talks.",
    note: "Least reliant on borrowed iconography, so the least likely to look like anyone else. Also the least concrete.",
  },
  hermetica: {
    id: "hermetica",
    name: "Hermetica",
    belief: "Ancient mystery school · ancient",
    beliefPosition: 0.16,
    positioning:
      "A stone tablet, not a landing page. Gold inlaid into cut stone, elements as a margin rubric, the profile etched rather than drawn.",
    palette: [
      { name: "Stone", hex: "#221f1c" },
      { name: "Gold", hex: "#b78a3c" },
      { name: "Lapis", hex: "#2c4a7a" },
      { name: "Bone", hex: "#ddd2bd" },
    ],
    type: { display: "Cinzel", text: "Karla" },
    hand: "etched",
    answersDust:
      "Initiation implies commitment. You do not casually abandon something you were admitted to.",
    answersCritic:
      "Frames her as an initiate working through material, so struggle reads as the process rather than as personal failure.",
    note: "Most differentiated and most premium of the four. Risk: can read masculine and severe for a female audience.",
  },
};

const ORDER = ["arsMemoria", "hermetica", "ephemeris", "resonance"] as const;

export default function MysticSpectrum() {
  const heroes: Record<string, { node: React.ReactNode; vars: React.CSSProperties }> = {
    arsMemoria: { node: <ArsMemoriaHero />, vars: faceVars("--f-cinzeldec", "--f-karla") },
    hermetica: { node: <HermeticaHero />, vars: faceVars("--f-cinzel", "--f-karla") },
    ephemeris: { node: <EphemerisHero />, vars: faceVars("--f-italiana", "--f-jost") },
    resonance: { node: <ResonanceHero />, vars: faceVars("--f-julius", "--f-jost") },
  };

  return (
    <div className={`${FONT_VARS} bg-[#15161a]`}>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#15161a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[78rem] items-center gap-1 overflow-x-auto px-4 py-3 font-sans">
          <span className="mr-3 shrink-0 text-[0.62rem] uppercase tracking-[0.2em] text-white/35">
            Metaphysical
          </span>
          {ORDER.map((key) => (
            <a
              key={key}
              href={`#${key}`}
              className="shrink-0 rounded-full px-3 py-1.5 text-[0.78rem] text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              {SPECS[key].name}
            </a>
          ))}
          <a
            href="/brand"
            className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-[0.78rem] text-white/35 transition-colors hover:text-white/70"
          >
            Earlier set ↗
          </a>
        </div>
      </nav>

      {ORDER.map((key) => (
        <section key={key} id={key} className="scroll-mt-14">
          <div style={heroes[key].vars}>{heroes[key].node}</div>
          <ThemeSpecStrip spec={SPECS[key]} />
        </section>
      ))}

      <footer className="px-6 py-16 text-center font-sans">
        <p className="mx-auto max-w-[58ch] text-[0.9rem] leading-relaxed text-white/45">
          Four metaphysical lineages, spread across both intensities you named —
          Ars Memoria and Hermetica dark and jewel-like, Ephemeris and Resonance
          luminous and ethereal. All four symbol systems are structural here, not
          decorative. The earlier, more restrained set is at{" "}
          <a href="/brand" className="text-white/70 underline underline-offset-4">
            /brand
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
