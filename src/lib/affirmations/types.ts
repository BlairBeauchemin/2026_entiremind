/** How an affirmation came to exist. Internal signal — never shown to the user. */
export type AffirmationSource = "user" | "ai_draft";

export type AffirmationStatus = "active" | "archived";

export interface Affirmation {
  id: string;
  text: string;
  source: AffirmationSource;
  position: number;
}

/** A suggestion from the AI drafter. Unsaved until the user keeps it. */
export interface AffirmationDraft {
  /** Client-side key only — a kept draft gets a real row id on save. */
  key: string;
  text: string;
}
