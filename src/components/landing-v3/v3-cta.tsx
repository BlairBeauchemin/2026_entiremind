"use client";

import { useState } from "react";
import { WaitlistModal } from "@/components/landing/waitlist-modal";

export function V3Cta() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="relative z-10 py-section">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto max-w-[36rem] text-center">
            <h2 className="font-serif text-heading text-balance text-ink">
              Make space for what you want to create.
            </h2>

            <p className="mx-auto mt-6 max-w-[46ch] text-body text-muted">
              Join the waitlist for launch updates and an invitation when access
              opens.
            </p>

            {/*
             * Presentational. This page is a design mockup, so the field is
             * styled to the token spec and hands off to the existing waitlist
             * modal rather than posting anywhere. Wiring it for real means an
             * email-only endpoint (the shape /api/quiz/lead already uses) plus
             * carrying the typed address into the modal — neither is in scope
             * here, and the address is currently retyped.
             */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsModalOpen(true);
              }}
              className="mx-auto mt-10 flex max-w-[30rem] flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="v3-email" className="sr-only">
                Email address
              </label>
              <input
                id="v3-email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                className="input-autofill-fix min-w-0 flex-1 rounded-sm border border-rule bg-surface px-4 py-3 text-body text-ink placeholder:text-muted focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-2 focus:ring-offset-linen"
              />
              <button
                type="submit"
                className="rounded-sm bg-cobalt px-8 py-3.5 font-sans text-sm font-medium whitespace-nowrap text-linen transition-colors duration-300 hover:bg-cobalt-deep"
              >
                Join the waitlist
              </button>
            </form>

            <p className="mx-auto mt-6 max-w-[54ch] text-sm text-muted">
              Free to join. Joining signs you up for launch emails; the text
              experience begins when you choose to enroll. Unsubscribe from
              emails anytime.
            </p>
          </div>
        </div>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
