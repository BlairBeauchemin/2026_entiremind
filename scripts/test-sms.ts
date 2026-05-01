import { readFileSync } from "fs";
import { resolve } from "path";
import twilio from "twilio";

// Load .env.local manually since dotenv isn't installed
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join("=");
      }
    }
  }
} catch {
  console.error("Could not load .env.local - make sure you're in the project root");
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Pass your phone number as argument: npx tsx scripts/test-sms.ts +1234567890
const toNumber = process.argv[2];

if (!accountSid || !authToken || !fromNumber) {
  console.error("Missing Twilio credentials in environment variables.");
  console.error("Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
  process.exit(1);
}

if (!toNumber) {
  console.error("Usage: npx tsx scripts/test-sms.ts +1234567890");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function sendTestSms() {
  console.log(`Sending test SMS from ${fromNumber} to ${toNumber}...`);

  const message = await client.messages.create({
    body: "Hello from Entiremind! This is a test message.",
    from: fromNumber,
    to: toNumber,
  });

  console.log("Message sent successfully!");
  console.log("SID:", message.sid);
  console.log("Status:", message.status);
}

sendTestSms().catch((error) => {
  console.error("Failed to send SMS:", error.message);
  if (error.code) {
    console.error("Error code:", error.code);
  }
  process.exit(1);
});
