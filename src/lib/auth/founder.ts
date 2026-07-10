// Canonical implementation lives in @/lib/founder/auth (extracted by the
// messaging simulator work). This module survives as a re-export because the
// marketing engine's routes import from this path.
export { requireFounder, founderErrorStatus } from "@/lib/founder/auth";
export type FounderAuthResult =
  | { error: "Not authenticated" | "Forbidden" }
  | { userId: string };
