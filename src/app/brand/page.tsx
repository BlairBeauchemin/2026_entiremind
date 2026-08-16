import {
  Marcellus,
  Bodoni_Moda,
  Petrona,
  Vollkorn,
  Faustina,
  Andada_Pro,
  Karla,
  Archivo,
} from "next/font/google";

import { SanctuaryHero } from "@/components/landing-worlds/sanctuary-hero";
import { NotationHero } from "@/components/landing-worlds/notation-hero";
import { CorrespondenceHero } from "@/components/landing-worlds/correspondence-hero";
import { AtelierHero } from "@/components/landing-worlds/atelier-hero";
import { EmbroideryHero } from "@/components/landing-worlds/embroidery-hero";
import { FieldNotesHero } from "@/components/landing-worlds/field-notes-hero";
import { GeigyHero } from "@/components/landing-worlds/geigy-hero";
import {
  ThemeSpecStrip,
  type ThemeSpec,
} from "@/components/landing-worlds/theme-spec";
import { stagingMetadata } from "@/config/site";

export const metadata = stagingMetadata;

/* Faces. Each theme pairs its own display with a text face; several share the
   text face on purpose, since the display face carries the brand's voice. */
const marcellus = Marcellus({ subsets: ["latin"], weight: ["400"], variable: "--f-marcellus", display: "swap" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-bodoni", display: "swap" });
const petrona = Petrona({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-petrona", display: "swap" });
const vollkorn = Vollkorn({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-vollkorn", display: "swap" });
const faustina = Faustina({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-faustina", display: "swap" });
const andada = Andada_Pro({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-andada", display: "swap" });
const karla = Karla({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-karla", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-archivo", display: "swap" });

const FONT_VARS = [
  marcellus.variable,
  bodoni.variable,
  petrona.variable,
  vollkorn.variable,
  faustina.variable,
  andada.variable,
  karla.variable,
  archivo.variable,
].join(" ");

/**
 * Bind a theme's chosen faces to the two variables the world components read.
 * Values are `var(--f-*)` references rather than resolved family names: the
 * families are self-hosted under generated names, so the indirection has to
 * survive to the browser.
 */
function faceVars(display: string, text: string): React.CSSProperties {
  return {
    "--font-plate-face": `var(${display})`,
    "--font-hand-face": `var(${text})`,
  } as React.CSSProperties;
}

const SPECS: Record<string, ThemeSpec> = {
  sanctuary: {
    id: "sanctuary",
    name: "Sanctuary",
    belief: "Unapologetically spiritual",
    beliefPosition: 0.04,
    positioning:
      "She already believes. This meets her all the way there and treats the daily message as a devotional act rather than a notification.",
    palette: [
      { name: "Dusk", hex: "#1a1633" },
      { name: "Gold", hex: "#d8ab55" },
      { name: "Rose", hex: "#b6738a" },
      { name: "Mist", hex: "#ded8ee" },
    ],
    type: { display: "Marcellus", text: "Karla" },
    hand: "laid gold",
    answersDust:
      "A ritual is not an app. You do not abandon a practice you consider sacred; you return to it.",
    answersCritic:
      "Reframes the critic as something to be quieted rather than defeated — no fight, no self-improvement framing.",
    note: "Highest risk of reading as category cliché. Premium here depends entirely on restraint in execution.",
  },
  notation: {
    id: "notation",
    name: "Notation",
    belief: "The tension is the brand",
    beliefPosition: 0.42,
    positioning:
      "Rigorous underneath, mystical on the surface. Treats interior change as a subject worth documenting properly.",
    palette: [
      { name: "Plate", hex: "#1b2a5e" },
      { name: "Vermilion", hex: "#c8442a" },
      { name: "Gold", hex: "#d7a548" },
      { name: "Vellum", hex: "#e9dec9" },
    ],
    type: { display: "Bodoni Moda", text: "Archivo" },
    hand: "ink",
    answersDust:
      "A plate is a record, not a feed. It accrues meaning instead of unread badges.",
    answersCritic:
      "The tangle is drawn, named and captioned — the critic becomes an observed specimen rather than the voice in charge.",
  },
  correspondence: {
    id: "correspondence",
    name: "Correspondence",
    belief: "Grounded, lightly magical",
    beliefPosition: 0.34,
    positioning:
      "Someone is writing to you, and keeps writing. The most intimate reading of the product's actual mechanic.",
    palette: [
      { name: "Paper", hex: "#f7f1e5" },
      { name: "Ink blue", hex: "#38477a" },
      { name: "Stamp", hex: "#b0453c" },
      { name: "Airmail", hex: "#2f6b8f" },
    ],
    type: { display: "Petrona", text: "Karla" },
    hand: "pen",
    answersDust:
      "The sharpest answer available: a letter is not an app. Nobody abandons a correspondence in week three.",
    answersCritic:
      "A second, kinder hand writes in the margin beside her own — the critic gets answered rather than argued with.",
    note: "Closest to the written promise in docs/design-philosophy.md. Warmest of the set; least obviously premium.",
  },
  atelier: {
    id: "atelier",
    name: "Atelier",
    belief: "Grounded daily practice",
    beliefPosition: 0.52,
    positioning:
      "A well-made everyday object. No claims about the universe, no clinical distance — just a practice built to be used.",
    palette: [
      { name: "Plaster", hex: "#e6dfd4" },
      { name: "Clay", hex: "#b5714f" },
      { name: "Ochre", hex: "#c78d34" },
      { name: "Ink", hex: "#33302b" },
    ],
    type: { display: "Vollkorn", text: "Archivo" },
    hand: "ink",
    answersDust:
      "Material honesty implies durability. This is a tool that wears in rather than an app that wears out.",
    answersCritic:
      "Treats her as a maker rather than a patient. The critic is not pathology, it is a rough edge being worked.",
  },
  embroidery: {
    id: "embroidery",
    name: "Embroidery",
    belief: "Craft-warm",
    beliefPosition: 0.4,
    positioning:
      "The ordered image on the front of the cloth, the tangle of floss on the back. Same threads, both sides.",
    palette: [
      { name: "Linen", hex: "#d8cbb2" },
      { name: "Madder", hex: "#a83f34" },
      { name: "Indigo", hex: "#2f4470" },
      { name: "Saffron", hex: "#d09a3c" },
    ],
    type: { display: "Faustina", text: "Karla" },
    hand: "stitch",
    answersDust:
      "A sampler is finished slowly and then kept. It is an heirloom object, not a subscription.",
    answersCritic:
      "The mess is on the back of every finished piece — the critic is normal, not a personal failing.",
  },
  fieldNotes: {
    id: "fieldNotes",
    name: "Field Notes",
    belief: "Quietly evidence-based",
    beliefPosition: 0.78,
    positioning:
      "The mechanism is attention and repeated thought. Manifestation is her word for it; the brand does not need the word.",
    palette: [
      { name: "Paper", hex: "#f2ece0" },
      { name: "Annotate", hex: "#9a5a3c" },
      { name: "Specimen", hex: "#4f6b4a" },
      { name: "Ink", hex: "#23231f" },
    ],
    type: { display: "Andada Pro", text: "Archivo" },
    hand: "pen",
    answersDust:
      "Observation accumulates. The value is visibly in the record, which makes stopping feel like losing data rather than skipping a day.",
    answersCritic:
      "Names the pattern without diagnosing her. Warm rigour: the thought is the specimen, she is the observer.",
    note: "Credible to a skeptic while staying warm — the one direction that would survive press scrutiny of the manifestation category.",
  },
  geigy: {
    id: "geigy",
    name: "Geigy",
    belief: "Clinical",
    beliefPosition: 0.96,
    positioning:
      "Kept on the page as the cold end of the axis, so the warm directions can be judged against something, not just against each other.",
    palette: [
      { name: "Paper", hex: "#f2f0ea" },
      { name: "Signal", hex: "#e2542a" },
      { name: "Cobalt", hex: "#2a4b8d" },
      { name: "Ink", hex: "#1a1a18" },
    ],
    type: { display: "Archivo", text: "Archivo" },
    hand: "plot",
    answersDust:
      "Precision implies seriousness, which earns attention — but nothing here suggests warmth or return.",
    answersCritic:
      "Weakest on this axis. Clinical framing risks making her feel like a case rather than a person.",
    note: "Contrast only. You ruled the clinical register out; this is here to show you what you ruled out.",
  },
};

const ORDER = [
  "sanctuary",
  "correspondence",
  "embroidery",
  "notation",
  "atelier",
  "fieldNotes",
  "geigy",
] as const;

export default function BrandSpectrum() {
  const heroes: Record<string, { node: React.ReactNode; vars: React.CSSProperties }> = {
    sanctuary: { node: <SanctuaryHero />, vars: faceVars("--f-marcellus", "--f-karla") },
    correspondence: { node: <CorrespondenceHero />, vars: faceVars("--f-petrona", "--f-karla") },
    embroidery: { node: <EmbroideryHero />, vars: faceVars("--f-faustina", "--f-karla") },
    notation: { node: <NotationHero />, vars: faceVars("--f-bodoni", "--f-archivo") },
    atelier: { node: <AtelierHero />, vars: faceVars("--f-vollkorn", "--f-archivo") },
    fieldNotes: { node: <FieldNotesHero />, vars: faceVars("--f-andada", "--f-archivo") },
    geigy: { node: <GeigyHero />, vars: faceVars("--f-archivo", "--f-archivo") },
  };

  return (
    <div className={`${FONT_VARS} bg-[#15161a]`}>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#15161a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[78rem] items-center gap-1 overflow-x-auto px-4 py-3 font-sans">
          <span className="mr-3 shrink-0 text-[0.62rem] uppercase tracking-[0.2em] text-white/35">
            Brand spectrum
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
            href="/v6"
            className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-[0.78rem] text-white/35 transition-colors hover:text-white/70"
          >
            Control ↗
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
        <p className="mx-auto max-w-[56ch] text-[0.9rem] leading-relaxed text-white/45">
          Register is held constant across all seven — premium and warm — and only
          belief varies, left to right. The category standard sits at{" "}
          <a href="/v6" className="text-white/70 underline underline-offset-4">
            /v6
          </a>{" "}
          as a control.
        </p>
      </footer>
    </div>
  );
}
