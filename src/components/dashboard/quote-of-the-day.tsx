import type { Quote } from "@/lib/quotes/types";

interface QuoteOfTheDayProps {
  quote: Quote;
}

/**
 * A calm daily quote card. Deterministic per user per day (picked by the
 * server component), so it stays stable across refreshes and rotates each
 * morning. Yellow accent distinguishes it from the purple message cards.
 */
export function QuoteOfTheDay({ quote }: QuoteOfTheDayProps) {
  return (
    <section
      aria-label="Quote for today"
      className="rounded-2xl border-l-4 border-em-yellow-400 bg-white/60 p-6"
    >
      <p className="text-xs uppercase tracking-widest text-teal-900/50 mb-3">
        A thought for today
      </p>
      <blockquote>
        <p className="font-serif text-xl md:text-2xl text-navy leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <footer className="mt-3 text-sm text-teal-900/60">
          — {quote.author}
        </footer>
      </blockquote>
    </section>
  );
}
