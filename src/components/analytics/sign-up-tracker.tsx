"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

const STORAGE_KEY = "em_signup_tracked";

/**
 * Fires the sign_up event once per browser session. Mounted on /onboarding,
 * which users only reach after the server-side auth callback succeeds —
 * the closest client-side proxy for "signup succeeded".
 */
export function SignUpTracker() {
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, "1");
    analytics.signUp();
  }, []);

  return null;
}
