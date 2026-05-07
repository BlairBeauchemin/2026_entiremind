import Anthropic from "@anthropic-ai/sdk";
import type { AiProviderAdapter } from "../types";

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

  async generateMessage(systemPrompt: string, userPrompt: string): Promise<string> {
    const anthropic = getClient();

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text" || !content.text) {
      throw new Error("Empty response from Anthropic");
    }

    return content.text.trim();
  },
};
