"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { analytics, type FormLocation } from "@/lib/analytics";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { name?: string; email?: string };

/**
 * The email-first waitlist form: first name and email, on the page itself.
 * It asks for no phone number and no SMS consent, so it sits outside the
 * pop-up flow approved for A2P 10DLC; a phone is asked for at enrollment.
 *
 * Two tones: "light" on the linen page (the hero) and "cobalt" inside the
 * final blue band. Success goes to /thank-you?via=email, whose copy promises
 * an email rather than a text.
 */
export function EmailWaitlistForm({
  location,
  tone = "light",
  id,
  note,
}: {
  location: FormLocation;
  tone?: "light" | "cobalt";
  /** The hero's form is `join`, the target of `/#join` from other pages. */
  id?: string;
  /** The reassurance line under the button. */
  note: string;
}) {
  const router = useRouter();
  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const started = useRef(false);

  const cobalt = tone === "cobalt";

  const onFirstFocus = () => {
    if (started.current) return;
    started.current = true;
    analytics.leadFormStart(location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setAlreadyJoined(false);

    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Please enter your first name.";
    if (!EMAIL_PATTERN.test(email.trim()))
      errors.email = "Please enter a valid email address.";
    setFieldErrors(errors);
    if (errors.name) return nameRef.current?.focus();
    if (errors.email) return emailRef.current?.focus();

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          website,
          // Share attribution (?src=share-{archetype}); server validates.
          source: new URLSearchParams(window.location.search).get("src"),
        }),
      });

      if (response.status === 409) {
        setAlreadyJoined(true);
        setIsSubmitting(false);
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      analytics.generateLead({
        lead_source: "waitlist_inline",
        modal_version: "inline",
        form_location: location,
      });
      router.push("/thank-you?via=email");
    } catch {
      setFormError(
        "Something went wrong on our side. Please try again in a moment.",
      );
      setIsSubmitting(false);
    }
  };

  const inputClass = `input-autofill-fix w-full min-h-12 px-4 py-3 rounded-sm border font-sans text-base text-ink placeholder:text-muted transition-colors focus:outline-none focus-visible:ring-2 ${
    cobalt
      ? "bg-surface border-transparent focus-visible:ring-linen focus-visible:ring-offset-2 focus-visible:ring-offset-cobalt"
      : "bg-surface border-rule focus:border-cobalt focus-visible:ring-cobalt/30"
  }`;
  const errorClass = `mt-1.5 text-sm font-sans text-left ${cobalt ? "text-linen" : "text-cobalt-deep"}`;
  const nameErrorId = `${uid}-name-error`;
  const emailErrorId = `${uid}-email-error`;

  return (
    <form
      id={id}
      data-waitlist-form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Join the waitlist"
      className="w-full scroll-mt-32"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className="sr-only">
            First name
          </label>
          <input
            ref={nameRef}
            id={`${uid}-name`}
            name="name"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={onFirstFocus}
            maxLength={200}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? nameErrorId : undefined}
            className={inputClass}
          />
          {fieldErrors.name && (
            <p id={nameErrorId} className={errorClass}>
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="sr-only">
            Email address
          </label>
          <input
            ref={emailRef}
            id={`${uid}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={onFirstFocus}
            maxLength={320}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? emailErrorId : undefined}
            className={inputClass}
          />
          {fieldErrors.email && (
            <p id={emailErrorId} className={errorClass}>
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive technology. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 overflow-hidden"
      >
        <label htmlFor={`${uid}-website`}>Website</label>
        <input
          id={`${uid}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`mt-4 w-full sm:w-auto px-10 py-4 rounded-sm text-lg font-medium font-sans transition-all duration-300 disabled:opacity-70 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          cobalt
            ? "bg-linen text-cobalt-deep hover:bg-surface focus-visible:ring-linen focus-visible:ring-offset-cobalt"
            : "bg-cobalt text-linen hover:bg-cobalt-deep focus-visible:ring-cobalt focus-visible:ring-offset-linen"
        }`}
      >
        {isSubmitting ? "Joining…" : "Join the waitlist"}
      </button>

      <div aria-live="polite">
        {alreadyJoined && (
          <p
            className={`mt-3 text-base font-sans ${cobalt ? "text-linen" : "text-ink"}`}
          >
            You&apos;re already on the list. We&apos;ll email you when access
            opens.
          </p>
        )}
        {formError && (
          <p role="alert" className={errorClass}>
            {formError}
          </p>
        )}
      </div>

      <p
        className={`mt-3 text-sm font-sans ${cobalt ? "text-linen/85" : "text-muted"}`}
      >
        {note}
      </p>
      <p
        className={`mt-1 text-xs font-sans ${cobalt ? "text-linen/85" : "text-muted"}`}
      >
        By joining, you agree to our{" "}
        <Link
          href="/terms"
          className={`underline underline-offset-2 ${cobalt ? "hover:text-linen" : "hover:text-cobalt"}`}
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className={`underline underline-offset-2 ${cobalt ? "hover:text-linen" : "hover:text-cobalt"}`}
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
