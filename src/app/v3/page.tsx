import { Bodoni_Moda, Archivo } from "next/font/google";
import { NotationHero } from "@/components/landing-worlds/notation-hero";
import { stagingMetadata } from "@/config/site";

export const metadata = stagingMetadata;

const plate = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-plate-face",
  display: "swap",
});

const hand = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-hand-face",
  display: "swap",
});

const DIRECTION_CONTRACT = `
THESIS: A manifestation practice is a thought circling; this page shows the
circling and then shows it resolve. Refuses the wellness-landing arrangement
of cream ground, serif display, lavender gradient and a floating phone.
OWN-WORLD: Gouache-on-vellum plate after the analytical-psychology drawing
tradition. Saturated lapis ground, warm ink line, one vermilion alarm, gold
for rule and annotation, vellum reserved for inverted reading passages.
Ruled plates with struck corner marks; a didone plate face against a
grotesque annotating hand.
STORY: She recognises the snarl as her own, sees that replying is the whole
mechanic, and joins the waitlist.
FIRST VIEWPORT: Full-bleed lapis plate. Headline left at 4.4rem, vermilion
waitlist action beneath it. The tangled profile right, inside a hand-ruled
compass circle, captioned in the margin.
FORM: Analytical-psychology notation, candidate 5 of 7; seed key b3e5f384.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
`;

export default function NotationLanding() {
  return (
    <div
      className={`${plate.variable} ${hand.variable} min-h-screen bg-nt-plate-deep`}
    >
      <div dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }} />
      <NotationHero />
    </div>
  );
}
