import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import type { MobileSceneOption } from "@/components/landing/hero-scene-mobile";
import { SignupVariantProvider } from "@/components/landing/signup-variant";

// Internal: the live phone-first hero and three options with a larger phone
// on phones (HeroSceneMobile), stacked to flip through on a phone. Desktop is
// the same for all four. Unlisted and kept out of search results.
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
    label: "A · Bigger phone, three prints",
    note: "Phone at about two-thirds of the screen; a print tucks over the space under the last message.",
    scene: "a",
  },
  {
    key: "b",
    label: "B · Phone tucked into the vision board",
    note: "Bigger photos around the phone; the “My vision” board and a flower print cover its lower part.",
    scene: "b",
  },
  {
    key: "c",
    label: "C · One big photo behind",
    note: "A large tilted photograph behind the phone, three bigger prints in front.",
    scene: "c",
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
