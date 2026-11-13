import type { Metadata } from "next";
import { heroInter } from "@/components/landing/hero-font";
import { HeroScene } from "@/components/landing/hero-scene";
import {
  HeroSceneMobile,
  type MobileSceneOption,
} from "@/components/landing/hero-scene-mobile";

// Internal: just the three phone scenes (the live one and options A and B),
// one after another at phone width, so they can be compared in one scroll.
// Unlisted and kept out of search results.
export const metadata: Metadata = {
  title: "Hero phones | Entiremind",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

const SCENES: { key: string; label: string; scene?: MobileSceneOption }[] = [
  { key: "now", label: "Current (live)" },
  { key: "a", label: "A · Bigger phone, today’s layout", scene: "a" },
  { key: "b", label: "B · Biggest phone, fewer pieces", scene: "b" },
];

export default function HeroPhonesPage() {
  return (
    <main
      className={`bg-linen text-ink font-sans min-h-screen overflow-x-hidden ${heroInter.variable}`}
    >
      <div className="mx-auto max-w-[430px] lg:max-w-none lg:grid lg:grid-cols-3 lg:gap-8 lg:px-8">
        {SCENES.map((s) => (
          <section key={s.key} className="pt-10 pb-14 lg:max-w-[430px]">
            <p className="px-6 text-sm font-medium tracking-wide uppercase text-cobalt">
              {s.label}
            </p>
            <h2 className="mt-4 px-6 text-center font-serif text-display text-ink text-balance">
              Manifest your best life
            </h2>
            <div className="mt-4">
              {s.scene ? (
                <HeroSceneMobile option={s.scene} />
              ) : (
                // The live hero's phone-sized crop of the desktop scene.
                <div className="px-6">
                  <div className="-mt-[11%] -mb-[9%] -ml-[17%] -mr-[20%]">
                    <HeroScene layout="spill" motion={["float-strong"]} />
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
