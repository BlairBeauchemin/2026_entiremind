import type { Metadata } from "next";

import { PhoneMockup } from "@/components/landing/phone-mockup";
import { PhonePlate } from "@/components/mock/phone-plate";
import { PLATES } from "@/lib/mock/plates";

export const metadata: Metadata = {
  title: "Phone mock — three directions",
  robots: { index: false, follow: false },
};

const DIRECTIONS = [
  {
    plate: PLATES.flat,
    index: "01",
    name: "Flat on linen",
    note: "Overhead, the phone lying in raking window light with a deckle-edge card and a brass disc. The quietest of the three and the most obviously a still life — it reads as an object on a table rather than a product shot.",
    cost: "Screen sits square to the camera, so the projection is almost a plain scale. Least likely to break if the thread copy changes length.",
  },
  {
    plate: PLATES.hand,
    index: "02",
    name: "Held in hand",
    note: "The only version with a person in it. It carries the promise better than the other two — this arrives in your day, in your hand — at the cost of putting a specific hand in front of every visitor.",
    cost: "Largest screen area of the three, so the thread is legible at the smallest render size.",
  },
  {
    plate: PLATES.lean,
    index: "03",
    name: "Leaning on cobalt",
    note: "Closest to the reference you picked: matte cobalt arch, linen, brass, dappled light. The phone rests against a sculptural form rather than a stand.",
    cost: "The screen is genuinely in perspective, which is what the projection matrix is for. Most distinctive, and the most brand-specific of the three.",
  },
] as const;

export default function PhoneMockPage() {
  return (
    <main className="min-h-screen bg-linen text-ink">
      <div className="bg-grain pointer-events-none fixed inset-0 opacity-40 mix-blend-multiply" />

      <div className="relative mx-auto max-w-[1180px] px-6 py-section">
        <header className="max-w-[68ch]">
          <p className="text-label uppercase text-muted">
            Internal · not linked
          </p>
          <h1 className="mt-4 font-serif text-heading">
            Three ways the phone could <em>sit</em>.
          </h1>
          <p className="text-body mt-5 text-muted">
            Each photograph is a stage. The screen on top is live DOM — the same{" "}
            <code className="text-ink">ThreadScreen</code> the drawn mockup uses
            — so the copy stays editable and the type stays Prata and Karla.
            Nothing is layered over the glass.
          </p>
        </header>

        <hr className="rule-fade my-16" />

        <div className="flex flex-col gap-24">
          {DIRECTIONS.map(({ plate, index, name, note, cost }, i) => (
            <section
              key={plate.id}
              aria-labelledby={`plate-${plate.id}`}
              className="grid items-start gap-10 lg:grid-cols-[auto_1fr] lg:gap-16"
            >
              <PhonePlate plate={plate} priority={i === 0} />

              <div className="max-w-[46ch] lg:pt-6">
                <p className="text-label uppercase text-muted">{index}</p>
                <h2
                  id={`plate-${plate.id}`}
                  className="mt-3 font-serif text-heading"
                >
                  {name}
                </h2>
                <p className="text-body mt-5">{note}</p>
                <p className="text-body mt-4 text-muted">{cost}</p>
              </div>
            </section>
          ))}
        </div>

        <hr className="rule-fade my-16" />

        <section
          aria-labelledby="plate-control"
          className="grid items-start gap-10 lg:grid-cols-[auto_1fr] lg:gap-16"
        >
          <div className="flex justify-center lg:justify-start">
            <PhoneMockup rotated={false} />
          </div>

          <div className="max-w-[46ch] lg:pt-6">
            <p className="text-label uppercase text-muted">Control</p>
            <h2 id="plate-control" className="mt-3 font-serif text-heading">
              What ships today
            </h2>
            <p className="text-body mt-5">
              The drawn device currently in the hero and on the landing page. It
              is unchanged by this work — the thread was lifted into a shared
              component, and nothing about how it renders moved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
