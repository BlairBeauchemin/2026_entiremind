import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { isLeadWriteThrottled } from "@/lib/lead-throttle";
import { scoreProfile } from "@/lib/persona/score";
import {
  INTENTION_CATEGORIES,
  MOTIVATION_ORIENTATIONS,
  CHANGE_STYLES,
  TONE_PREFERENCES,
  VALUE_IDS,
} from "@/lib/persona/types";
import {
  PAST_PATTERN_OPTIONS,
  FIRST_DOUBT_OPTIONS,
  FIRST_DOUBT_MAX,
  INNER_VOICE_OPTIONS,
  QUIZ_VERSION,
} from "@/lib/persona/questions";

/**
 * Public quiz email gate. Unauthenticated by design — validation is strict,
 * answers are re-scored server-side (client-computed results are never
 * trusted for storage), and writes are idempotent upserts on leads.email.
 *
 * Upsert rules protect existing lead rows: email ownership is unverified, so
 * a retake only refreshes quiz fields — contact details (phone, name) and SMS
 * consent are written on first insert only. Otherwise anyone who knows an
 * email could grant SMS consent or attach a phone on someone else's row.
 */

const optionIds = (options: { id: string }[]) =>
  options.map((o) => o.id) as [string, ...string[]];

const quizAnswersSchema = z.object({
  intention_category: z.enum(INTENTION_CATEGORIES),
  motivation_orientation: z.enum(MOTIVATION_ORIENTATIONS),
  change_style: z.enum(CHANGE_STYLES),
  past_pattern: z.enum(optionIds(PAST_PATTERN_OPTIONS)),
  first_doubt: z
    .array(z.enum(optionIds(FIRST_DOUBT_OPTIONS)))
    .max(FIRST_DOUBT_MAX),
  inner_voice: z.enum(optionIds(INNER_VOICE_OPTIONS)),
  core_values: z.array(z.enum(VALUE_IDS)).max(3),
  tone_preference: z.enum(TONE_PREFERENCES),
});

const payloadSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  name: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().max(20).optional().default(""),
  smsConsent: z.boolean().optional().default(false),
  smsConsentLanguage: z.string().max(1000).optional(),
  answers: quizAnswersSchema,
  /** Share attribution — validated against the share-slug allowlist below. */
  source: z.string().max(40).optional(),
  /** Honeypot — humans never see this field; bots that fill it get a 200 no-op. */
  website: z.string().optional().default(""),
});

/** Client-supplied attribution: only known share sources survive; else 'quiz'. */
function validateSource(source: string | undefined): string {
  return source && /^share-(visionary|alchemist|seeker|phoenix)$/.test(source)
    ? source
    : "quiz";
}

export async function POST(request: NextRequest) {
  try {
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const {
      email,
      name,
      phone,
      smsConsent,
      smsConsentLanguage,
      answers,
      source,
      website,
    } = parsed.data;

    // Honeypot tripped: pretend success, store nothing.
    if (website) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (phone) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 },
        );
      }
    }

    // Never trust the client's scoring — re-derive the profile here.
    const profile = scoreProfile(answers);

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.log("Quiz lead captured (Supabase not configured):", { email });
      return NextResponse.json(
        { success: true, archetype: profile.archetype },
        { status: 201 },
      );
    }

    const supabase = createServiceRoleClient();

    if (await isLeadWriteThrottled(supabase)) {
      return NextResponse.json(
        { error: "Too many requests, please try again shortly" },
        { status: 429 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const consentIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : (request.headers.get("x-real-ip") ?? "unknown");
    const now = new Date().toISOString();

    const quizFields = {
      archetype: profile.archetype,
      quiz_answers: answers,
      quiz_version: QUIZ_VERSION,
      quiz_completed_at: now,
    };

    const { data: existing } = await supabase
      .from("leads")
      .select("id, name")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      // Retake or waitlisted email: refresh quiz fields only. The submitter
      // hasn't proven they own this email, so contact fields and SMS consent
      // on an existing row are off-limits (name backfills only if empty).
      const update: Record<string, unknown> = { ...quizFields };
      if (name && !existing.name) update.name = name;
      const { error } = await supabase
        .from("leads")
        .update(update)
        .eq("id", existing.id);
      if (error) {
        console.error("Quiz lead update failed:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from("leads").insert({
        // The leads table requires a name; the quiz gate keeps it optional.
        name: name || "Quiz taker",
        email,
        phone: phone || null,
        source: validateSource(source),
        sms_consent: smsConsent === true,
        sms_consent_timestamp: now,
        sms_consent_ip: consentIp,
        sms_consent_language: smsConsentLanguage ?? null,
        ...quizFields,
      });
      if (error) {
        // Unique-violation race: another submit won — treat as success.
        if (error.code !== "23505") {
          console.error("Quiz lead insert failed:", error);
          return NextResponse.json(
            { error: "Failed to save" },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json(
      { success: true, archetype: profile.archetype },
      { status: 201 },
    );
  } catch (error) {
    console.error("Quiz lead error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
