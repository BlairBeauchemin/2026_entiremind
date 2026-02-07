export function SacredFooter() {
  return (
    <footer className="py-16 relative">
      {/* Geometric divider line */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center mb-16">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-em-purple-300/30 to-transparent" />
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            className="mx-4 text-em-purple-300/30"
            aria-hidden="true"
          >
            <path
              d="M20 5L35 15V25L20 35L5 25V15L20 5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-em-purple-300/30 to-transparent" />
        </div>

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
              href="#section-testimonials"
              className="hover:text-teal-900 transition-colors"
            >
              Stories
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
