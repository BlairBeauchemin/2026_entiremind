import { NextResponse } from "next/server";
import { getSmsProvider } from "@/lib/sms";

/**
 * Informational endpoint for SMS webhooks.
 *
 * Actual webhook handling is done by provider-specific routes:
 * - Twilio: POST /api/sms/webhook/twilio
 * - Telnyx: POST /api/sms/webhook/telnyx
 *
 * Configure your SMS provider's webhook URL to point to the appropriate endpoint.
 */
export async function GET() {
  const provider = getSmsProvider();

  return NextResponse.json({
    status: "ok",
    message: "SMS webhook endpoints",
    currentProvider: provider,
    endpoints: {
      twilio: "/api/sms/webhook/twilio",
      telnyx: "/api/sms/webhook/telnyx",
    },
    note: "Configure your SMS provider's webhook URL to the appropriate endpoint above.",
  });
}

export async function POST() {
  const provider = getSmsProvider();

  return NextResponse.json(
    {
      error: "Direct webhook requests not supported",
      message: `Use the provider-specific endpoint: /api/sms/webhook/${provider}`,
      endpoints: {
        twilio: "/api/sms/webhook/twilio",
        telnyx: "/api/sms/webhook/telnyx",
      },
    },
    { status: 400 }
  );
}
