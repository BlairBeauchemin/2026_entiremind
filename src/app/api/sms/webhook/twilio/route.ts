import { NextRequest, NextResponse, after } from "next/server";
import { sendSms, storeInboundSms } from "@/lib/sms";
import {
  parseTwilioWebhookPayload,
  validateTwilioSignature,
  createEmptyTwimlResponse,
  createTwimlResponse,
} from "@/lib/sms/providers/twilio";
import { trackReply, trackUnprompted, trackStopRequest } from "@/lib/signals";
import { PAUSE_CONFIRMATION, RESUME_CONFIRMATION } from "@/lib/reconnect";
import {
  enrichInboundReply,
  loadKnownPatterns,
  persistEnrichment,
} from "@/lib/ai/enrich";
import { pickSoftAck } from "@/lib/acks";
import { createServiceRoleClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// Twilio handles STOP/UNSUBSCRIBE at the platform level automatically, but we
// log them here for our own records and to satisfy carrier review requirements.
const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
]);
const HELP_KEYWORDS = new Set(["HELP", "INFO"]);

// App-level messaging controls (distinct from Twilio's carrier-level STOP):
// PAUSE holds daily messages without unsubscribing; RESUME picks them back up.
const PAUSE_KEYWORDS = new Set(["PAUSE"]);
const RESUME_KEYWORDS = new Set(["RESUME", "UNPAUSE"]);

const HELP_RESPONSE =
  "Entiremind: For support email support@entiremind.com or visit entiremind.com/sms-policy. " +
  "Reply STOP to unsubscribe. Msg & data rates may apply.";

/**
 * If the user has an open testimonial request from the last 7 days, capture
 * this reply as the testimonial for founder review. First qualifying reply
 * wins; STOP/HELP keywords never reach this path.
 */
async function captureTestimonialReply(
  supabase: SupabaseClient,
  userId: string,
  inboundText: string,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const { data: pending } = await supabase
    .from("testimonials")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "requested")
    .gte("requested_at", cutoff.toISOString())
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pending) return;

  const { error } = await supabase
    .from("testimonials")
    .update({
      body: inboundText,
      status: "received",
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", pending.id)
    .eq("status", "requested");

  if (error) {
    console.error("Failed to capture testimonial reply:", error);
  }
}

async function processEnrichmentAndAck(params: {
  userId: string;
  inboundMessageId: string;
  inboundText: string;
  fromPhoneNumber: string;
}) {
  const { userId, inboundMessageId, inboundText, fromPhoneNumber } = params;
  const supabase = createServiceRoleClient();

  const knownPatterns = await loadKnownPatterns(supabase, userId);
  const enrichment = await enrichInboundReply(inboundText, knownPatterns);

  if (enrichment) {
    await persistEnrichment(supabase, { userId, inboundMessageId, enrichment });
  }

  const useMirror = Boolean(
    enrichment && enrichment.substantive && enrichment.acknowledgement,
  );
  const ackText = useMirror
    ? (enrichment!.acknowledgement as string)
    : await pickSoftAck(userId);

  const ackResult = await sendSms(userId, fromPhoneNumber, ackText, {
    contentType: "ack",
    aiGenerated: useMirror,
  });

  if (!ackResult.success) {
    console.error("Failed to send ack:", ackResult.error);
    return;
  }

  const { error: ackFlagError } = await supabase
    .from("messages")
    .update({ ack_sent: true })
    .eq("id", inboundMessageId);

  if (ackFlagError) {
    console.error("Failed to mark ack_sent on inbound:", ackFlagError);
  }
}

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
        return NextResponse.json(
          { error: "Missing signature" },
          { status: 401 },
        );
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
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    // Handle inbound message
    const fromNumber = payload.From;
    const toNumber = payload.To;
    const text = payload.Body;
    const messageSid = payload.MessageSid;
    const normalizedText = text.trim().toUpperCase();

    console.log(`Inbound SMS received from ${fromNumber}: ${text}`);

    // Log STOP keywords — Twilio handles the actual opt-out at the platform level
    if (STOP_KEYWORDS.has(normalizedText)) {
      console.log(
        `STOP keyword received from ${fromNumber} — Twilio platform opt-out triggered`,
      );
      // Store the inbound STOP message for our records, then return empty TwiML
      // (Twilio will automatically send the confirmation and block future messages)
      const stopResult = await storeInboundSms(
        fromNumber,
        toNumber,
        text,
        messageSid,
        "twilio",
      );

      // Track stop request signal
      if (stopResult.success && stopResult.userId && stopResult.messageId) {
        await trackStopRequest(stopResult.userId, stopResult.messageId);
      }

      return new Response(createEmptyTwimlResponse(), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Respond to HELP keyword with support info (required by carriers)
    if (HELP_KEYWORDS.has(normalizedText)) {
      console.log(`HELP keyword received from ${fromNumber}`);
      await storeInboundSms(fromNumber, toNumber, text, messageSid, "twilio");
      return new Response(createTwimlResponse(HELP_RESPONSE), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // PAUSE: hold daily messages (app-level, no unsubscribe)
    if (PAUSE_KEYWORDS.has(normalizedText)) {
      console.log(`PAUSE keyword received from ${fromNumber}`);
      const stored = await storeInboundSms(
        fromNumber,
        toNumber,
        text,
        messageSid,
        "twilio",
      );
      if (stored.success && stored.userId) {
        const supabase = createServiceRoleClient();
        const { error: pauseError } = await supabase
          .from("users")
          .update({ status: "paused" })
          .eq("id", stored.userId);
        if (pauseError) {
          console.error("Failed to pause user via SMS keyword:", pauseError);
        }
        return new Response(createTwimlResponse(PAUSE_CONFIRMATION), {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        });
      }
      // Unknown number — nothing to pause, no reply
      return new Response(createEmptyTwimlResponse(), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // RESUME: reactivate daily messages
    if (RESUME_KEYWORDS.has(normalizedText)) {
      console.log(`RESUME keyword received from ${fromNumber}`);
      const stored = await storeInboundSms(
        fromNumber,
        toNumber,
        text,
        messageSid,
        "twilio",
      );
      if (stored.success && stored.userId && stored.messageId) {
        const supabase = createServiceRoleClient();
        const { error: resumeError } = await supabase
          .from("users")
          .update({ status: "active" })
          .eq("id", stored.userId);
        if (resumeError) {
          console.error("Failed to resume user via SMS keyword:", resumeError);
        }
        // Record the resume as a reply signal so the silence streak resets —
        // otherwise the recovery arc would re-pause them the next morning.
        await trackReply({
          userId: stored.userId,
          inboundMessageId: stored.messageId,
          outboundMessageId: stored.replyToMessageId ?? null,
          replyTimeMinutes: stored.replyTimeMinutes ?? null,
          replyLength: text.length,
        });
        return new Response(createTwimlResponse(RESUME_CONFIRMATION), {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        });
      }
      return new Response(createEmptyTwimlResponse(), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Store all other inbound messages
    const result = await storeInboundSms(
      fromNumber,
      toNumber,
      text,
      messageSid,
      "twilio",
    );

    if (!result.success) {
      // Log the error but return 200 to prevent Twilio from retrying
      // The message may be from an unknown number
      console.error("Failed to store inbound message:", result.error);
    } else if (result.userId && result.messageId) {
      // Track signal based on whether this is a reply or unprompted
      if (result.replyToMessageId) {
        // This is a reply to an outbound message
        await trackReply({
          userId: result.userId,
          inboundMessageId: result.messageId,
          outboundMessageId: result.replyToMessageId,
          replyTimeMinutes: result.replyTimeMinutes ?? null,
          replyLength: text.length,
        });
        console.log(`Tracked reply signal for user ${result.userId}`);
      } else {
        // This is an unprompted message (no recent outbound to reply to)
        await trackUnprompted(result.userId, result.messageId);
        console.log(`Tracked unprompted signal for user ${result.userId}`);
      }

      // Enrich + ack after the response returns to Twilio.
      // Background execution keeps webhook latency low and decouples Twilio
      // retries from Anthropic / outbound send latency.
      const { userId, messageId } = result;
      after(async () => {
        try {
          await captureTestimonialReply(
            createServiceRoleClient(),
            userId,
            text,
          );
        } catch (err) {
          console.error("Testimonial capture failed:", err);
        }
        try {
          await processEnrichmentAndAck({
            userId,
            inboundMessageId: messageId,
            inboundText: text,
            fromPhoneNumber: fromNumber,
          });
        } catch (err) {
          console.error("Enrichment/ack background job failed:", err);
        }
      });
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
      { status: 500 },
    );
  }
}

// Twilio may send GET requests for webhook validation
export async function GET() {
  return NextResponse.json(
    { status: "ok", provider: "twilio" },
    { status: 200 },
  );
}
