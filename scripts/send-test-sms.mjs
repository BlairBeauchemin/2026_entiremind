#!/usr/bin/env node
/**
 * Test script: send an inspirational SMS via Twilio.
 *
 * Usage:
 *   node scripts/send-test-sms.mjs +15551234567
 *   TEST_PHONE_NUMBER=+15551234567 node scripts/send-test-sms.mjs
 *
 * Requires the same Twilio env vars used by the app:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *
 * If a `.env.local` file exists at the repo root, its values are loaded
 * automatically so the script picks up the same credentials as `npm run dev`.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import twilio from "twilio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

function loadEnvLocal() {
  const envPath = join(repoRoot, ".env.local");
  if (!existsSync(envPath)) return;

  const contents = readFileSync(envPath, "utf8");
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const INSPIRATIONAL_MESSAGES = [
  "You are exactly where you need to be. Trust the unfolding — what you're calling in is already on its way.",
  "The thoughts you keep returning to become the life you wake up to. Choose them with care today.",
  "Your intention is a seed. Water it with attention, protect it from doubt, and let time do the rest.",
  "Nothing is missing. The version of you that already has it is quietly teaching you how to receive.",
  "Small, aligned action beats grand, anxious effort. One true step today is enough.",
  "What you focus on grows. Let your attention rest on the life you are building, not the one you are leaving.",
  "You don't have to force it. The right doors open when you stop pulling on the locked ones.",
  "Speak to yourself the way you'd speak to someone you believe in — because you are.",
];

function pickMessage() {
  const index = Math.floor(Math.random() * INSPIRATIONAL_MESSAGES.length);
  return INSPIRATIONAL_MESSAGES[index];
}

async function main() {
  loadEnvLocal();

  const toNumber = process.argv[2] || process.env.TEST_PHONE_NUMBER;
  if (!toNumber) {
    console.error(
      "Missing destination phone number.\n" +
        "Usage: node scripts/send-test-sms.mjs +15551234567\n" +
        "   or: TEST_PHONE_NUMBER=+15551234567 node scripts/send-test-sms.mjs"
    );
    process.exit(1);
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error(
      "Missing Twilio env vars. Need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER " +
        "(set them in .env.local or your shell)."
    );
    process.exit(1);
  }

  const body = pickMessage();
  const client = twilio(accountSid, authToken);

  console.log(`Sending inspirational SMS from ${fromNumber} to ${toNumber}...`);
  console.log(`Message: ${body}`);

  const message = await client.messages.create({
    body,
    from: fromNumber,
    to: toNumber,
  });

  console.log(`Sent. Twilio SID: ${message.sid} (status: ${message.status})`);
}

main().catch((err) => {
  console.error("Failed to send test SMS:");
  console.error(err);
  process.exit(1);
});
