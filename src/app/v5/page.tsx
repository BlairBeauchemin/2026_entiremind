import { Archivo } from "next/font/google";
import { GeigyHero } from "@/components/landing-worlds/geigy-hero";
import { stagingMetadata } from "@/config/site";

export const metadata = stagingMetadata;

/**
 * One family, worked hard across weights — the Swiss discipline this world
 * is built on. There is no display face because the grammar does not have one.
 */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hand-face",
  display: "swap",
});

const DIRECTION_CONTRACT = `
THESIS: Changing how you think is clinical craft, documented on a ruled
sheet. Refuses both the wellness gradient and the mystical dark, treating the
mind as a subject to be plotted rather than evoked.
OWN-WORLD: Warm paper ground, near-black ink, one signal orange used only
where action lives, cobalt as the single secondary. Hairline rules, a strict
12-column register, one grotesque across every weight. No ornament.
STORY: She reads a page that respects her intelligence, understands the
mechanism in one pass, and joins the waitlist.
FIRST VIEWPORT: Registration rule at the head. Headline across seven columns,
the plotted contour boxed and captioned in the remaining five, signal CTA
registered to the column beside the subhead.
FORM: Geigy-era pharmaceutical identity, candidate 7 of 7; seed key b3e5f384.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
`;

export default function GeigyLanding() {
  return (
    <div className={`${archivo.variable} min-h-screen`}>
      <div dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }} />
      <GeigyHero />
    </div>
  );
}
