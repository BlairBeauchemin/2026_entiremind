/**
 * One set of words for every landing world.
 *
 * The point of the spread is to compare design, not copy — so each world
 * renders exactly this text. If a world needs different words to work, that
 * is a finding about the world, not a licence to rewrite the page.
 *
 * Claims here are bound by PRODUCT.md: the business is pre-launch, so nothing
 * may imply the product is purchasable today, and there is no social proof to
 * cite until real figures exist.
 */
export const LANDING_COPY = {
  eyebrow: {
    brand: "Entiremind",
    status: "Opening by waitlist",
  },
  headline: {
    lead: "One text each morning.",
    turn: "It remembers what you said.",
  },
  subhead:
    "A manifestation practice that lives in your text thread — not in another app you will stop opening. Reply, or stay quiet. Both teach it how to meet you tomorrow.",
  cta: {
    label: "Join the waitlist",
    reassurance: ["A 10-day trial when we open.", "No card to join the list."],
  },
  figure: "fig. i — the same thought, circling",
} as const;
