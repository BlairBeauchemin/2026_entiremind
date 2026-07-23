import Anthropic from "@anthropic-ai/sdk";
import type { AiProviderAdapter, AiGenerateOptions } from "../types";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable not set");
  }

  client = new Anthropic({ apiKey });
  return client;
}

export const anthropicAdapter: AiProviderAdapter = {
  provider: "anthropic",

  async generateMessage(
    systemPrompt: string,
    userPrompt: string,
    options?: AiGenerateOptions,
  ): Promise<string> {
    const anthropic = getClient();

    const model =
      options?.model ||
      process.env.ANTHROPIC_MODEL ||
      "claude-haiku-4-5-20251001";

    // Sonnet 5 / Opus default to adaptive thinking when `thinking` is omitted.
    // For a one-line SMS with a small max_tokens that's actively harmful — the
    // thinking budget can eat the whole output and truncate the message — so
    // disable it for non-Haiku models. Haiku's default is already thinking-off.
    // Never set `temperature`: Sonnet 5 / Opus reject sampling params with a 400.
    const thinking = /haiku/i.test(model)
      ? undefined
      : ({ type: "disabled" } as const);

    const response = await anthropic.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 100,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      thinking,
    });

    const content = response.content[0];
    if (content.type !== "text" || !content.text) {
      throw new Error("Empty response from Anthropic");
    }

    return content.text.trim();
  },
};
