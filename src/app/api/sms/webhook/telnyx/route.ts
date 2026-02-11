import { NextRequest, NextResponse } from "next/server";
import { storeInboundSms } from "@/lib/sms";
import { parseTelnyxWebhookPayload } from "@/lib/sms/providers/telnyx";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = parseTelnyxWebhookPayload(body);

    if (!payload) {
      console.error("Invalid Telnyx webhook payload received");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { event_type } = payload.data;
    const messagePayload = payload.data.payload;

    // Handle inbound messages
    if (event_type === "message.received") {
      const fromNumber = messagePayload.from.phone_number;
      const toNumber = messagePayload.to[0]?.phone_number;
      const text = messagePayload.text;
      const telnyxMessageId = messagePayload.id;

      if (!fromNumber || !toNumber || !text) {
        console.error("Missing required fields in Telnyx webhook payload");
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      console.log(`Inbound SMS received from ${fromNumber}: ${text}`);

      const result = await storeInboundSms(
        fromNumber,
        toNumber,
        text,
        telnyxMessageId,
        "telnyx"
      );

      if (!result.success) {
        // Log the error but return 200 to prevent Telnyx from retrying
        // The message may be from an unknown number
        console.error("Failed to store inbound message:", result.error);
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Handle delivery status updates
    if (
      event_type === "message.sent" ||
      event_type === "message.delivered" ||
      event_type === "message.finalized"
    ) {
      // TODO: Update message status in database based on delivery confirmation
      console.log(`Message status update: ${event_type}`, messagePayload.id);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Log unhandled event types but acknowledge receipt
    console.log(`Unhandled Telnyx webhook event type: ${event_type}`);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Telnyx webhook:", error);
    // Return 500 to indicate failure - Telnyx may retry
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Telnyx may send GET requests for webhook validation
export async function GET() {
  return NextResponse.json({ status: "ok", provider: "telnyx" }, { status: 200 });
}
