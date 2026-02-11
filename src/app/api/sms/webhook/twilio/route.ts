import { NextRequest, NextResponse } from "next/server";
import { storeInboundSms } from "@/lib/sms";
import {
  parseTwilioWebhookPayload,
  validateTwilioSignature,
  createEmptyTwimlResponse,
} from "@/lib/sms/providers/twilio";

export async function POST(request: NextRequest) {
  try {
    // Twilio sends form-encoded data
    const formData = await request.formData();
    const payload = parseTwilioWebhookPayload(formData);

    if (!payload) {
      console.error("Invalid Twilio webhook payload received");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Validate Twilio signature in production
    if (process.env.NODE_ENV === "production") {
      const signature = request.headers.get("X-Twilio-Signature");
      if (!signature) {
        console.error("Missing Twilio signature header");
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }

      // Convert formData to params object for validation
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      // Get the full URL for signature validation
      const url = request.url;

      if (!validateTwilioSignature(signature, url, params)) {
        console.error("Invalid Twilio signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Handle inbound message
    const fromNumber = payload.From;
    const toNumber = payload.To;
    const text = payload.Body;
    const messageSid = payload.MessageSid;

    console.log(`Inbound SMS received from ${fromNumber}: ${text}`);

    const result = await storeInboundSms(
      fromNumber,
      toNumber,
      text,
      messageSid,
      "twilio"
    );

    if (!result.success) {
      // Log the error but return 200 to prevent Twilio from retrying
      // The message may be from an unknown number
      console.error("Failed to store inbound message:", result.error);
    }

    // Return TwiML response (empty = no auto-reply)
    return new Response(createEmptyTwimlResponse(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error processing Twilio webhook:", error);
    // Return 500 to indicate failure - Twilio may retry
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Twilio may send GET requests for webhook validation
export async function GET() {
  return NextResponse.json({ status: "ok", provider: "twilio" }, { status: 200 });
}
