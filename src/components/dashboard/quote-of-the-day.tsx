import type { Quote } from "@/lib/quotes/types";

interface QuoteOfTheDayProps {
  quote: Quote;
}

/**
 * A calm daily quote card. Deterministic per user per day (picked by the
 * server component), so it stays stable across refreshes and rotates each
 * morning. It reads as distinct from the message cards because it is set in
 * the serif and centred on its attribution, not because it carries a
 * different accent colour.
 */
export function QuoteOfTheDay({ quote }: QuoteOfTheDayProps) {
  return (
    <section
      aria-label="Quote for today"
      className="rounded-sm border border-rule bg-surface p-6"
    >
      <p className="text-xs uppercase tracking-widest text-muted mb-3">
        A thought for today
      </p>
      <blockquote>
        <p className="font-serif text-xl md:text-2xl text-ink leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <footer className="mt-3 text-sm text-muted">— {quote.author}</footer>
      </blockquote>
    </section>
  );
}
