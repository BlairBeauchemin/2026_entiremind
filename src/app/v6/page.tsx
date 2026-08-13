import { Cormorant_Garamond, Inter } from "next/font/google";
import { StandardHero } from "@/components/landing-worlds/standard-hero";
import { stagingMetadata } from "@/config/site";

export const metadata = stagingMetadata;

/**
 * The control deliberately uses the incumbent faces. Both are on impeccable's
 * list of training-data defaults, which is exactly why they belong here: this
 * route is meant to show what the category actually ships.
 */
const plate = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-plate-face",
  display: "swap",
});

const hand = Inter({
  subsets: ["latin"],
  variable: "--font-hand-face",
  display: "swap",
});

const DIRECTION_CONTRACT = `
THESIS: The category standard, played straight and executed at full craft —
the control against which the three committed worlds are judged. It refuses
nothing, on purpose.
OWN-WORLD: Cream ground, lilac and sage ambient wash, high-contrast serif
display over a neutral grotesque, centred column, pill button, soft shadow.
The arrangement every wellness landing ships.
STORY: She sees something calm and familiar, understands it is a texting
practice, and joins the waitlist.
FIRST VIEWPORT: Centred column on cream. Eyebrow, serif headline, light
subhead, dark pill CTA, drawing beneath, blurred colour fields behind.
FORM: Category standard (the standing exit), outside the seven; seed key b3e5f384.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
`;

export default function StandardLanding() {
  return (
    <div className={`${plate.variable} ${hand.variable} min-h-screen`}>
      <div dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }} />
      <StandardHero />
    </div>
  );
}
