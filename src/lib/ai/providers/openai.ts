import OpenAI from "openai";
import type { AiProviderAdapter } from "../types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable not set");
  }

  client = new OpenAI({ apiKey });
  return client;
}

export const openaiAdapter: AiProviderAdapter = {
  provider: "openai",

  async generateMessage(systemPrompt: string, userPrompt: string): Promise<string> {
    const openai = getClient();

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("Empty response from OpenAI");
    }

    return text;
  },
};
