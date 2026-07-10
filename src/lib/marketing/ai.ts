import { z } from "zod";
import { getProviderAdapter } from "../ai";

const DEFAULT_MAX_TOKENS = 4000;

/**
 * Strip markdown code fences the model may wrap around JSON output.
 */
function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

/**
 * Call the configured AI provider and parse + validate a strict-JSON reply.
 * Throws on parse or validation failure — callers own the failure handling
 * (typically: mark the content piece failed and keep the raw output for
 * debugging via the thrown error's `raw` property).
 */
export async function generateStrictJson<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  maxTokens: number = DEFAULT_MAX_TOKENS,
): Promise<T> {
  const adapter = getProviderAdapter();
  const raw = await adapter.generateMessage(systemPrompt, userPrompt, {
    maxTokens,
  });

  const cleaned = stripFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new StrictJsonError("AI response was not valid JSON", raw);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new StrictJsonError(
      `AI response failed validation: ${result.error.message}`,
      raw,
    );
  }

  return result.data;
}

export class StrictJsonError extends Error {
  /** The raw model output, preserved for generation_context debugging. */
  raw: string;

  constructor(message: string, raw: string) {
    super(message);
    this.name = "StrictJsonError";
    this.raw = raw;
  }
}
