"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { WaitlistModal } from "@/components/landing/waitlist-modal";

const LINKS = [
  { href: "#section-how-it-works", label: "How it works" },
  { href: "#section-approach", label: "Our approach" },
];

export function V3Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/*
       * Absolute, not fixed: the mock has the nav sitting on the photograph, and
       * the plaster behind it measures ~12:1 against ink. A transparent FIXED
       * nav would keep floating after the hero scrolls away and land on the
       * cobalt band, where ink drops to roughly 1.6:1 and disappears. Scrolling
       * away with the hero avoids that with no scroll listener.
       *
       * The cost: the waitlist CTA is no longer pinned. The hero CTA and the
       * closing CTA both remain, so the page is never without one.
       */}
      <nav className="absolute top-0 z-40 w-full">
        <div>
          <div className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-6">
            <Link
              href="/v3"
              className="font-serif text-xl tracking-[1.5px] text-ink sm:text-2xl sm:tracking-[2px]"
            >
              Entiremind
            </Link>

            <div className="hidden items-center gap-10 md:flex">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-sans text-sm text-ink transition-colors hover:text-cobalt"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-sm bg-cobalt px-6 py-2.5 font-sans text-sm font-medium text-linen transition-colors duration-300 hover:bg-cobalt-deep"
              >
                Join the waitlist
              </button>
            </div>

            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-sm bg-cobalt px-3.5 py-2 font-sans text-xs font-medium whitespace-nowrap text-linen transition-colors duration-300 hover:bg-cobalt-deep"
              >
                Join the waitlist
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 text-ink"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-b border-rule bg-linen/95 md:hidden">
            <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-6 py-6">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 font-sans text-sm text-ink transition-colors hover:text-cobalt"
                >
                  {link.label}
                </a>
              ))}
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
