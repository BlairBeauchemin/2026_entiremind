/**
 * Provider pre-flight — the proactive half of the health check.
 *
 * These answer "will tomorrow's send work?" rather than "did today's?". Both
 * are deliberately cheap and both fail soft: a check that cannot run returns a
 * structured "unknown" rather than throwing, because a broken monitor must
 * never be mistaken for a broken product.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AnthropicFacts, TwilioFacts } from "./health";

/**
 * The health ping pins its own model and NEVER reads ANTHROPIC_MODEL.
 *
 * CLAUDE.md records a July 2026 regression where reply enrichment shared that
 * variable with daily generation: when daily gen moved to Sonnet, enrichment
 * silently broke. Sharing a model env var across unrelated call sites is the
 * exact trap. Haiku is the cheapest current model — this ping costs about
 * $0.00002 per run.
 */
const HEALTH_PING_MODEL = "claude-haiku-4-5";

const PROVIDER_TIMEOUT_MS = 10_000;

/**
 * Read the Twilio account balance.
 *
 * Uses the REST endpoint directly rather than the SDK: it is one authenticated
 * GET, and it keeps the monitor independent of which balance helpers a given
 * twilio-node version happens to expose.
 */
export async function checkTwilioBalance(): Promise<TwilioFacts | null> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Not configured is not a failure — the check is simply skipped.
  if (!accountSid || !authToken) return null;

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Balance.json`,
      {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        error: `Twilio returned ${response.status} ${response.statusText}.`,
      };
    }

    const body = (await response.json()) as {
      balance?: string;
      currency?: string;
    };
    const balance = Number.parseFloat(body.balance ?? "");

    if (!Number.isFinite(balance)) {
      return { ok: false, error: "Twilio returned no parseable balance." };
    }

    return { ok: true, balance, currency: body.currency ?? "USD" };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error reading Twilio balance.",
    };
  }
}

/**
 * Prove the Anthropic key still works and still has credit.
 *
 * There is no balance endpoint, so the only honest test is a real (tiny)
 * completion. Branches on the SDK's typed error classes rather than
 * string-matching the class name; the one string match is on the message body,
 * which is the only place the API distinguishes "out of credit" from any other
 * 400.
 */
export async function checkAnthropic(): Promise<AnthropicFacts | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic({ maxRetries: 0 });
    await client.messages.create(
      {
        model: HEALTH_PING_MODEL,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      },
      { timeout: PROVIDER_TIMEOUT_MS },
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, kind: "auth", error: error.message };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, kind: "rate_limit", error: error.message };
    }
    if (error instanceof Anthropic.BadRequestError) {
      // The API signals an exhausted balance as a 400 whose message names it.
      const kind = /credit balance/i.test(error.message) ? "credit" : "unknown";
      return { ok: false, kind, error: error.message };
    }
    return {
      ok: false,
      kind: "unknown",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error calling the Anthropic API.",
    };
  }
}
