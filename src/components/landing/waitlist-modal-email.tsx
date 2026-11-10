"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { CtaLocation } from "@/lib/analytics";
import { EmailWaitlistForm } from "./email-waitlist-form";

/**
 * The email-only pop-up: the same first name + email form the page uses
 * inline, inside the pop-up frame the SMS-consent version uses, so a test
 * between "form on the page" and "form in a pop-up" changes nothing else.
 *
 * The SMS-consent pop-up (phone + consent checkboxes, approved for A2P 10DLC)
 * is waitlist-modal-single.tsx, left untouched.
 */
// True only in the browser, after hydration: the portal needs document.body.
const noop = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function WaitlistModalEmail({
  isOpen,
  onClose,
  location,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** The ask that opened it, carried into the signup's analytics. */
  location: CtaLocation;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  // Read through a ref so a new onClose each render doesn't re-run the
  // open effect (and re-focus the first field mid-typing).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes; the page behind stays put while it is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Start in the first field, as the inline form's asks do.
    const id = window.setTimeout(
      () => panelRef.current?.querySelector<HTMLInputElement>("input")?.focus(),
      50,
    );
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      window.clearTimeout(id);
    };
  }, [isOpen]);

  if (!isClient) return null;

  // Rendered at the top of the document so no section's stacking (several
  // sit at z-10) can put the sticky header over the pop-up.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-email-modal-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="relative bg-linen rounded-sm p-8 mx-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 flex size-11 items-center justify-center text-muted hover:text-cobalt transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <h2
                id="waitlist-email-modal-title"
                className="font-serif text-2xl text-ink mb-2"
              >
                Join the waitlist
              </h2>
              <p className="text-base text-muted font-sans mb-6">
                Get your invitation when access opens.
              </p>

              <EmailWaitlistForm
                kind="modal"
                location={location}
                note="Free to join. Unsubscribe anytime."
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
