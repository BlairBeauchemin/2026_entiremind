"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { WaitlistModal } from "./waitlist-modal";
import { analytics } from "@/lib/analytics";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    analytics.leadFormOpen("nav");
    setIsModalOpen(true);
  };

  return (
    <>
      <nav className="fixed w-full z-40 top-0 transition-all duration-300">
        <div className="bg-linen border-b border-rule">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="font-serif text-2xl md:text-3xl tracking-[2px] text-cobalt whitespace-nowrap">
                Entiremind
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-10">
              <a
                href="#section-how-it-works"
                className="text-ink hover:text-cobalt font-sans text-sm tracking-wide transition-colors"
              >
                How it works
              </a>
              <a
                href="/quiz"
                className="text-ink hover:text-cobalt font-sans text-sm tracking-wide transition-colors"
              >
                The quiz
              </a>
              <a
                href="#section-faq"
                className="text-ink hover:text-cobalt font-sans text-sm tracking-wide transition-colors"
              >
                FAQ
              </a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/auth"
                className="text-ink font-sans text-sm hover:text-cobalt transition-colors"
              >
                Login
              </Link>
              <button
                onClick={openModal}
                className="bg-cobalt text-linen px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-cobalt-deep transition-all duration-300"
              >
                Join waitlist
              </button>
            </div>

            {/* Mobile buttons */}
            <div className="flex md:hidden items-center gap-4">
              <button
                onClick={openModal}
                className="bg-cobalt text-linen px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap hover:bg-cobalt-deep transition-colors duration-300"
              >
                Join waitlist
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-ink p-1"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-linen border-b border-rule">
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
              <a
                href="#section-how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-ink hover:text-cobalt font-sans text-sm tracking-wide transition-colors py-2"
              >
                How it works
              </a>
              <a
                href="/quiz"
                onClick={() => setMobileMenuOpen(false)}
                className="text-ink hover:text-cobalt font-sans text-sm tracking-wide transition-colors py-2"
              >
                The quiz
              </a>
              <a
                href="#section-faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-ink hover:text-cobalt font-sans text-sm tracking-wide transition-colors py-2"
              >
                FAQ
              </a>
              <div className="border-t border-rule pt-4 mt-2">
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-block text-ink font-sans text-sm hover:text-cobalt transition-colors"
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
