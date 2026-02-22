"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { WaitlistModal } from "./waitlist-modal";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="fixed w-full z-40 top-0 transition-all duration-300">
        <div className="glass-panel border-b border-white/40">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="font-serif text-3xl font-medium tracking-[2px] text-navy">
                Entiremind
              </span>
            </Link>

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

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/auth"
                className="text-teal-900 font-sans text-sm hover:text-teal-800 transition-colors"
              >
                Login
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-navy text-cream px-6 py-2.5 rounded-full text-sm font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300"
              >
                Join Waitlist
              </button>
            </div>

            {/* Mobile buttons */}
            <div className="flex md:hidden items-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-navy text-cream px-5 py-2 rounded-full text-sm font-medium hover:bg-navy/90 transition-all duration-300"
              >
                Join Waitlist
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-navy p-1"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b border-white/40">
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
              <a
                href="#section-philosophy"
                onClick={() => setMobileMenuOpen(false)}
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors py-2"
              >
                Philosophy
              </a>
              <a
                href="#section-how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors py-2"
              >
                The Loop
              </a>
              <a
                href="#section-pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors py-2"
              >
                Membership
              </a>
              <div className="border-t border-white/40 pt-4 mt-2">
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-block text-teal-900 font-sans text-sm hover:text-teal-800 transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
