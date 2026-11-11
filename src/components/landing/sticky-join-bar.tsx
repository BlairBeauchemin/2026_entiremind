"use client";

import { useEffect, useState } from "react";
import { useWaitlistAsk } from "./signup-variant";
import { WAITLIST_FORM_SELECTOR } from "./waitlist-scroll";

/**
 * A "Join the waitlist" bar fixed to the bottom of the screen on phones
 * (below lg), for the phone-first hero, where the hero form starts below the
 * first screen. Tapping it is the same ask as every other button: bring the
 * visitor to the next form on the page and focus its first field.
 *
 * It steps aside whenever it would get in the way: while any waitlist form is
 * on screen, and while a field is focused (so it never sits on the keyboard).
 * It starts hidden and appears once the page is measured, so it never flashes
 * over the form. A hairline rule, not a shadow, separates it from the page,
 * and it pads for the home indicator (safe-area inset).
 */
export function StickyJoinBar() {
  const { ask, modal } = useWaitlistAsk("sticky");
  const [ready, setReady] = useState(false);
  const [formInView, setFormInView] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);

  useEffect(() => {
    const forms = Array.from(
      document.querySelectorAll<HTMLElement>(WAITLIST_FORM_SELECTOR),
    );
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setFormInView(visible.size > 0);
      setReady(true);
    });
    forms.forEach((f) => observer.observe(f));
    if (forms.length === 0) window.setTimeout(() => setReady(true), 0);

    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && el.matches("input, textarea, select");
    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) setFieldFocused(true);
    };
    const onFocusOut = () => {
      // Focus may move straight to another field; check after it settles.
      window.setTimeout(
        () => setFieldFocused(isField(document.activeElement)),
        0,
      );
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const shown = ready && !formInView && !fieldFocused;

  return (
    <>
      <div
        data-sticky-join
        aria-hidden={shown ? undefined : true}
        className={`lg:hidden fixed inset-x-0 bottom-0 z-30 bg-linen border-t border-rule px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none ${
          shown ? "translate-y-0" : "translate-y-full invisible"
        }`}
      >
        <button
          type="button"
          onClick={ask}
          tabIndex={shown ? undefined : -1}
          className="w-full bg-cobalt text-linen py-3.5 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-colors duration-300 font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
        >
          Join the waitlist
        </button>
      </div>
      {modal}
    </>
  );
}
