import { Faustina, Karla } from "next/font/google";
import { EmbroideryHero } from "@/components/landing-worlds/embroidery-hero";
import { stagingMetadata } from "@/config/site";

export const metadata = stagingMetadata;

const plate = Faustina({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-plate-face",
  display: "swap",
});

const hand = Karla({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-hand-face",
  display: "swap",
});

const DIRECTION_CONTRACT = `
THESIS: The snarl on the back of the cloth and the ordered image on the front
are the same threads. Refuses the wellness-landing cream-and-gradient
arrangement by making the surface a worked object instead of a page.
OWN-WORLD: Linen ground with a real woven grain, dyed floss in madder,
indigo, sage and saffron, thread-dark type. Sampler conventions carry the
structure: cross-stitch bands top and foot, a centred column, a maker's line.
STORY: She recognises the tangle as the back of her own cloth, sees that
replying is what works it through, and joins the waitlist.
FIRST VIEWPORT: Framed sampler panel on linen. Stitch band, centred headline,
the profile worked in floss beneath it, madder CTA on a dashed seam.
FORM: Embroidery sampler, candidate 1 of 7; seed key b3e5f384.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
`;

export default function EmbroideryLanding() {
  return (
    <div className={`${plate.variable} ${hand.variable} min-h-screen`}>
      <div dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }} />
      <EmbroideryHero />
    </div>
  );
}
