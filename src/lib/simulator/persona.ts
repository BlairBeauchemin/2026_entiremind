import { getProviderAdapter } from "../ai";
import { renderProfileForPrompt } from "../persona/prompt";
import type { PersonaProfile } from "../persona/types";
import type { PersonaProposal, ReplyStyle } from "./types";

/**
 * Role-play system prompt for simulating a test persona's SMS behavior.
 * This is a simulator tool, not a production tunable — it stays hardcoded.
 */
const PERSONA_SYSTEM_PROMPT = `You are role-playing a specific real person who receives one short daily SMS from Entiremind, a reflection and manifestation service. You are NOT an assistant.

Given the person's description, their derived profile, the conversation so far, and today's message, decide what they actually do today.

Real people are inconsistent: some days a one-word reply, some days a longer vent, some days nothing at all. Let engagement drift with how well the messages land for THIS person — novelty wears off, a tone mismatch or a question that feels like homework pushes them toward silence, a message that hits home pulls out something real.

When they reply, write it in their voice over SMS: casual, lowercase is fine, occasional typos are fine, no polished prose. Keep replies SMS-length (usually under 200 characters, occasionally longer when venting).

Output ONLY a JSON object, no other text:
{"action": "reply" | "silence", "text": string | null, "delay_minutes": number, "reasoning": string}

- "text" is null when action is "silence".
- "delay_minutes" is how long after the morning message they reply (2 to 600).
- "reasoning" is ONE out-of-character sentence explaining the decision, for the founder reviewing the simulation.`;

const STYLE_GUIDANCE: Record<ReplyStyle, string> = {
  eager:
    "Reply style: EAGER — they reply to almost every message, warmly and promptly, often with some length.",
  realistic:
    "Reply style: REALISTIC — they reply to roughly 60% of messages. Length and warmth vary with their day; busy days mean silence or a few words.",
  terse:
    "Reply style: TERSE — when they reply (about half the time), it's a few words at most. Never effusive.",
  flaky:
    "Reply style: FLAKY — they reply to maybe 30% of messages, often hours late, and sometimes mid-thought. Silence is their default.",
  silent:
    "Reply style: SILENT — they almost never reply (roughly 1 in 10 messages), and when they do it's minimal. They still read everything.",
};

export function coercePersonaProposal(raw: unknown): PersonaProposal | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const action =
    obj.action === "reply" || obj.action === "silence" ? obj.action : null;
  if (!action) return null;

  const text =
    typeof obj.text === "string" && obj.text.trim().length > 0
      ? obj.text.trim()
      : null;
  if (action === "reply" && !text) return null;

  const rawDelay =
    typeof obj.delay_minutes === "number" && Number.isFinite(obj.delay_minutes)
      ? obj.delay_minutes
      : 47;
  const delayMinutes = Math.min(600, Math.max(2, Math.round(rawDelay)));

  const reasoning =
    typeof obj.reasoning === "string" && obj.reasoning.trim().length > 0
      ? obj.reasoning.trim()
      : null;

  return {
    action,
    text: action === "reply" ? text : null,
    delayMinutes,
    reasoning,
  };
}

/**
 * Ask the persona role-play model what the test user does in response to
 * today's message. Degrades to silence (with the raw output preserved for
 * the debug view) when the model returns unparseable JSON.
 */
export async function simulatePersonaReply(params: {
  personaBrief: string;
  replyStyle: ReplyStyle;
  profile: PersonaProfile | null;
  intention: string | null;
  dayNumber: number;
  todaysMessage: string;
  history: { day: number; direction: "outbound" | "inbound"; text: string }[];
}): Promise<PersonaProposal> {
  const parts: string[] = [];

  parts.push(`Person description: ${params.personaBrief}`);
  parts.push(STYLE_GUIDANCE[params.replyStyle]);
  if (params.intention) {
    parts.push(`Their stated intention: "${params.intention}"`);
  }
  if (params.profile) {
    parts.push(renderProfileForPrompt(params.profile));
  }

  if (params.history.length > 0) {
    const lines = params.history.map(
      (h) =>
        `Day ${h.day} ${h.direction === "outbound" ? "Entiremind" : "Them"}: ${h.text}`,
    );
    parts.push(`Conversation so far:\n${lines.join("\n")}`);
  }

  parts.push(
    `Today is day ${params.dayNumber}. Today's message from Entiremind: "${params.todaysMessage}"`,
  );
  parts.push("What do they do? Respond with ONLY the JSON object.");

  const adapter = getProviderAdapter();
  let output: string;
  try {
    output = await adapter.generateMessage(
      PERSONA_SYSTEM_PROMPT,
      parts.join("\n\n"),
      { maxTokens: 400 },
    );
  } catch (err) {
    console.error("Persona simulation call failed:", err);
    return {
      action: "silence",
      text: null,
      delayMinutes: 0,
      reasoning: "persona model call failed — defaulted to silence",
    };
  }

  try {
    const jsonStart = output.indexOf("{");
    const jsonEnd = output.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd <= jsonStart) throw new Error("no JSON");
    const parsed = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
    const proposal = coercePersonaProposal(parsed);
    if (!proposal) throw new Error("invalid shape");
    return proposal;
  } catch {
    console.warn("Persona simulation returned unparseable output");
    return {
      action: "silence",
      text: null,
      delayMinutes: 0,
      reasoning: "persona model returned invalid JSON — defaulted to silence",
      raw: output,
    };
  }
}
