/**
 * The loss-aversion beat.
 *
 * docs/design-philosophy.md flags this as the principle most likely to collide
 * with the trusted-friend guardrail, so the design deliberately does nothing to
 * amplify it: no red, no downward arrows, no before/after, no shame. The copy
 * names a familiar frustration and then offers a way back. That is the whole
 * move, and the visual treatment stays as quiet as the rest of the page.
 */
export function V3Friction() {
  return (
    <section className="relative z-10 py-section">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mx-auto max-w-[40rem]">
          <h2 className="font-serif text-heading text-balance text-ink">
            Inspiration feels good. Then{" "}
            <em className="italic">everyday life</em> takes over.
          </h2>

          <p className="mt-8 text-body text-muted">
            You set an intention and feel excited about what&rsquo;s possible.
            Then your attention gets pulled elsewhere, familiar doubts return,
            and the practice you wanted to build slips away.
          </p>

          <p className="mt-6 text-body text-muted">
            It can be frustrating to keep starting over.
          </p>

          <hr className="rule-fade my-10 border-0" />

          <p className="text-body text-ink">
            Entiremind is being built to help you return to what matters, with
            thoughtful prompts delivered right to your phone.
          </p>
        </div>
      </div>
    </section>
  );
}
