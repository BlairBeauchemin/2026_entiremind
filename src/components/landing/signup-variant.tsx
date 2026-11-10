"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { analytics, type CtaLocation } from "@/lib/analytics";
import { goToWaitlistForm } from "./waitlist-scroll";
import { WaitlistModalEmail } from "./waitlist-modal-email";
import type { SignupVariant } from "./signup-variant-config";

export type { SignupVariant };

/**
 * Which email-only signup the landing page uses, so the two can be tested
 * against each other with nothing else changed:
 *
 * - "form":  first name + email forms on the page (hero and blue band); the
 *            other asks scroll to the next form.
 * - "modal": every ask is a button that opens the email-only pop-up, which
 *            holds the same first name + email form.
 *
 * `/lp/form` and `/lp/modal` pin a variant (for ads); `/` follows
 * NEXT_PUBLIC_SIGNUP_VARIANT, defaulting to "form". Pages without a provider
 * (thank-you, legal) use "form", whose header button links to `/#join`.
 *
 * The SMS-consent pop-up approved for A2P 10DLC is not a variant here; it is
 * kept, untouched, in waitlist-modal-single.tsx and on the branch
 * claude/landing-sms-consent-flow.
 */
const SignupVariantContext = createContext<SignupVariant>("form");

export function SignupVariantProvider({
  variant,
  children,
}: {
  variant: SignupVariant;
  children: ReactNode;
}) {
  return (
    <SignupVariantContext.Provider value={variant}>
      {children}
    </SignupVariantContext.Provider>
  );
}

export function useSignupVariant() {
  return useContext(SignupVariantContext);
}

/**
 * What a "Join the waitlist" button does under the current variant: open the
 * email-only pop-up, or bring the visitor to the next form on the page (or to
 * the home page's form from pages without one). Render `modal` next to the
 * button; it is null under the form variant.
 */
export function useWaitlistAsk(location: CtaLocation) {
  const variant = useSignupVariant();
  const [open, setOpen] = useState(false);

  const ask = () => {
    analytics.leadFormOpen(location);
    if (variant === "modal") {
      setOpen(true);
      return;
    }
    if (!goToWaitlistForm()) window.location.href = "/#join";
  };

  const modal =
    variant === "modal" ? (
      <WaitlistModalEmail
        isOpen={open}
        onClose={() => setOpen(false)}
        location={location}
      />
    ) : null;

  return { variant, ask, modal };
}
