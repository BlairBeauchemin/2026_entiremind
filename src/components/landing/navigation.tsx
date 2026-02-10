"use client";

import Link from "next/link";

export function Navigation() {
  return (
    <nav className="fixed w-full z-50 top-0 transition-all duration-300">
      <div className="glass-panel border-b border-white/40">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <span className="font-serif text-3xl font-medium tracking-[2px] text-navy">
              Entiremind
            </span>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-10">
            <a
              href="#section-philosophy"
              className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors"
            >
              Philosophy
            </a>
            <a
              href="#section-how-it-works"
              className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors"
            >
              The Loop
            </a>
            <a
              href="#section-pricing"
              className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors"
            >
              Membership
            </a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-6">
            <Link
              href="/auth"
              className="hidden md:block text-teal-900 font-sans text-sm hover:text-teal-800 transition-colors"
            >
              Login
            </Link>
            <a
              href="#section-hero"
              className="bg-navy text-cream px-6 py-2.5 rounded-full text-sm font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300"
            >
              Get Early Access
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
