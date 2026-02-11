export function Footer() {
  return (
    <footer className="py-16 border-t border-teal-900/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-medium tracking-[2px] text-navy">
              Entiremind
            </span>
          </div>

          <div className="flex items-center gap-8 text-sm text-teal-900/60 font-sans">
            <a
              href="#section-philosophy"
              className="hover:text-teal-900 transition-colors"
            >
              Philosophy
            </a>
            <a
              href="#section-how-it-works"
              className="hover:text-teal-900 transition-colors"
            >
              The Loop
            </a>
            <a
              href="#section-pricing"
              className="hover:text-teal-900 transition-colors"
            >
              Membership
            </a>
            <a
              href="/privacy"
              className="hover:text-teal-900 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="hover:text-teal-900 transition-colors"
            >
              Terms
            </a>
          </div>

          <p className="text-xs text-teal-900/40 font-sans">
            &copy; {new Date().getFullYear()} Entiremind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
