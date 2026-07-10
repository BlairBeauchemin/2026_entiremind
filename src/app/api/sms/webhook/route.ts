import { NextResponse } from "next/server";

/**
 * Informational endpoint for SMS webhooks.
 *
 * Actual webhook handling is done by the provider route:
 * - Twilio: POST /api/sms/webhook/twilio
 *
 * Configure Twilio's webhook URL to point to that endpoint.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SMS webhook endpoints",
    currentProvider: "twilio",
    endpoints: {
      twilio: "/api/sms/webhook/twilio",
    },
    note: "Configure Twilio's webhook URL to the endpoint above.",
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Direct webhook requests not supported",
      message: "Use the provider-specific endpoint: /api/sms/webhook/twilio",
      endpoints: {
        twilio: "/api/sms/webhook/twilio",
      },
    },
    { status: 400 }
  );
}
