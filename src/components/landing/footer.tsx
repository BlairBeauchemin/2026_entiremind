import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-16 border-t border-rule">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-serif text-2xl tracking-[2px] text-ink">
              Entiremind
            </span>
          </Link>

          {/* Six links in one non-wrapping row clipped both ends at 390px —
              the first and last were unreachable on a phone. */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted font-sans">
            <a
              href="#section-philosophy"
              className="hover:text-cobalt transition-colors"
            >
              Philosophy
            </a>
            <a
              href="#section-how-it-works"
              className="hover:text-cobalt transition-colors"
            >
              The Loop
            </a>
            <a
              href="#section-pricing"
              className="hover:text-cobalt transition-colors"
            >
              Membership
            </a>
            <a href="/privacy" className="hover:text-cobalt transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-cobalt transition-colors">
              Terms
            </a>
            <a
              href="/sms-policy"
              className="hover:text-cobalt transition-colors"
            >
              SMS Policy
            </a>
          </div>

          <p className="text-xs text-muted font-sans">
            &copy; {new Date().getFullYear()} Entiremind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
