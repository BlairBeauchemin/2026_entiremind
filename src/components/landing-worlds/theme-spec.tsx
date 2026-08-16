/**
 * The chrome under each theme on the brand comparison page.
 *
 * Held deliberately neutral and identical for every theme: it is the ruler, not
 * a competing design. Its job is to make the variables explicit — palette, type,
 * the motif's hand, where the theme sits on the belief axis, and how it answers
 * each of the two named enemies — so the choice is made on evidence rather than
 * on which hero happened to catch the eye first.
 */

export interface ThemeSpec {
  id: string;
  name: string;
  belief: string;
  /** Position on the belief axis, 0 = unapologetically spiritual, 1 = evidence-first. */
  beliefPosition: number;
  positioning: string;
  palette: { name: string; hex: string }[];
  type: { display: string; text: string };
  hand: string;
  /** How this theme answers each of the two enemies the founder named. */
  answersDust: string;
  answersCritic: string;
  note?: string;
}

export function ThemeSpecStrip({ spec }: { spec: ThemeSpec }) {
  return (
    <div className="border-y border-white/10 bg-[#15161a] px-5 py-9 font-sans text-white sm:px-10">
      <div className="mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-[1.35rem] font-semibold tracking-tight">
              {spec.name}
            </h2>
            <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/40">
              {spec.belief}
            </span>
          </div>

          <p className="mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-white/70">
            {spec.positioning}
          </p>

          <BeliefAxis position={spec.beliefPosition} />
        </div>

        <div>
          <SpecLabel>Palette</SpecLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {spec.palette.map((c) => (
              <div key={c.hex} className="w-[4.6rem]">
                <div
                  className="h-9 w-full rounded-sm border border-white/15"
                  style={{ backgroundColor: c.hex }}
                />
                <p className="mt-1 text-[0.6rem] uppercase tracking-wide text-white/45">
                  {c.name}
                </p>
                <p className="text-[0.6rem] font-mono text-white/30">{c.hex}</p>
              </div>
            ))}
          </div>

          <SpecLabel className="mt-6">Type &amp; hand</SpecLabel>
          <p className="mt-2 text-[0.85rem] text-white/70">
            {spec.type.display}{" "}
            <span className="text-white/35">over</span> {spec.type.text}
          </p>
          <p className="text-[0.8rem] text-white/45">Motif drawn in {spec.hand}</p>
        </div>

        <div>
          <SpecLabel>Against apps that gather dust</SpecLabel>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-white/70">
            {spec.answersDust}
          </p>

          <SpecLabel className="mt-6">Against her inner critic</SpecLabel>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-white/70">
            {spec.answersCritic}
          </p>

          {spec.note && (
            <p className="mt-6 border-l-2 border-amber-400/50 pl-3 text-[0.8rem] leading-relaxed text-amber-200/70">
              {spec.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[0.62rem] uppercase tracking-[0.2em] text-white/35 ${className}`}
    >
      {children}
    </p>
  );
}

/** Where this theme sits between "she already believes" and "convince a skeptic". */
function BeliefAxis({ position }: { position: number }) {
  return (
    <div className="mt-6 max-w-[26rem]">
      <div className="relative h-px w-full bg-white/20">
        <span
          className="absolute -top-[3px] h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-amber-400"
          style={{ left: `${position * 100}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[0.6rem] uppercase tracking-[0.14em] text-white/30">
        <span>Spiritual</span>
        <span>Evidence-first</span>
      </div>
    </div>
  );
}
