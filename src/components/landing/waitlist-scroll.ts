/**
 * The email-first landing page has its waitlist forms on the page (the hero
 * and the final blue section) instead of a pop-up. The other asks (the
 * header button and the mid-page buttons) bring the visitor to a form rather
 * than repeating it.
 *
 * Every on-page form carries `data-waitlist-form`; the hero's has the id
 * `join`, so pages without a form send the visitor to `/#join`.
 */
export const WAITLIST_FORM_SELECTOR = "[data-waitlist-form]";

/**
 * Scroll to the next waitlist form below the top of the screen (or the last
 * one, if the visitor is already past them all) and put the cursor in its
 * first field. Returns false when the page has no form, so the caller can
 * send the visitor to the one on the home page instead.
 */
export function goToWaitlistForm(): boolean {
  const forms = Array.from(
    document.querySelectorAll<HTMLFormElement>(WAITLIST_FORM_SELECTOR),
  );
  if (forms.length === 0) return false;

  // A form that starts below the top quarter of the screen still counts as
  // "ahead"; one already scrolled past does not.
  const threshold = window.innerHeight * 0.25;
  const target =
    forms.find((form) => form.getBoundingClientRect().top >= -threshold) ??
    forms[forms.length - 1];

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "center",
  });

  // Focus once the scroll has settled; preventScroll keeps the browser from
  // jumping again, which would cut the smooth scroll short.
  const field = target.querySelector<HTMLInputElement>("input:not([hidden])");
  window.setTimeout(
    () => field?.focus({ preventScroll: true }),
    reduceMotion ? 0 : 450,
  );
  return true;
}
