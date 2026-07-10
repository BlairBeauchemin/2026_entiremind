import type { QuizAnswers } from "../persona/types";

export const REPLY_STYLES = [
  "eager",
  "realistic",
  "terse",
  "flaky",
  "silent",
] as const;
export type ReplyStyle = (typeof REPLY_STYLES)[number];

export interface CreateTestPersonaInput {
  name: string;
  /** Free-text persona description that drives the reply-simulation model. */
  personaBrief: string;
  replyStyle: ReplyStyle;
  intention: string;
  vision: string | null;
  alignedState: string | null;
  answers: QuizAnswers;
  /** Pin the run to a specific prompt version; null tracks the active one. */
  pinnedPromptId?: string | null;
}

/** What the persona role-play model proposes for a given day. */
export interface PersonaProposal {
  action: "reply" | "silence";
  text: string | null;
  delayMinutes: number;
  reasoning: string | null;
  /** Raw model output, preserved when JSON parsing failed. */
  raw?: string;
}

export interface SimDayResult {
  dayNumber: number;
  simDate: string;
  outboundText: string;
  contentType: string;
  fallback: boolean;
  proposal: PersonaProposal | null;
  status: "pending_review" | "committed";
}
