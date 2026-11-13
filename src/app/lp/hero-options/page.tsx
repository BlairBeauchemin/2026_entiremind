import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import type { MobileSceneOption } from "@/components/landing/hero-scene-mobile";
import { SignupVariantProvider } from "@/components/landing/signup-variant";

// Internal: the live phone-first hero and two options with a larger phone
// on phones (HeroSceneMobile), stacked to flip through on a phone. Desktop is
// the same for all three. Unlisted and kept out of search results.
export const metadata: Metadata = {
  title: "Hero phone options | Entiremind",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

const OPTIONS: {
  key: string;
  label: string;
  note: string;
  scene?: MobileSceneOption;
}[] = [
  {
    key: "now",
    label: "Current (live)",
    note: "Today's hero, unchanged.",
  },
  {
    key: "a",
    label: "A · Bigger phone, today’s layout",
    note: "Photos where they are today; no input field, so the messages fill the screen.",
    scene: "a",
  },
  {
    key: "b",
    label: "B · Biggest phone, fewer pieces",
    note: "Same layout with an even bigger phone and a two-photo “My vision” board below it.",
    scene: "b",
  },
];

export default function HeroOptionsPage() {
  return (
    <main className="bg-linen text-ink font-sans min-h-screen overflow-x-hidden">
      <SignupVariantProvider variant="form">
        {OPTIONS.map((o) => (
          <section key={o.key} className="border-b-4 border-cobalt">
            <div className="sticky top-0 z-40 bg-cobalt text-linen px-6 py-3">
              <p className="font-sans text-base font-medium">{o.label}</p>
              <p className="text-sm text-linen/85">{o.note}</p>
            </div>
            <Hero
              layout="phone-first"
              anchorId={`join-${o.key}`}
              mobileScene={o.scene}
            />
          </section>
        ))}
      </SignupVariantProvider>
    </main>
  );
}
