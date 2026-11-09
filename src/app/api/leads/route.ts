import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { isLeadWriteThrottled } from "@/lib/lead-throttle";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, smsConsent, smsConsentLanguage, source } = body;

    // Honeypot: a field people never see. Bots that fill every input get a
    // normal-looking success and nothing is stored.
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json(
        { success: true, message: "Lead captured" },
        { status: 201 },
      );
    }

    // Attribution is client-supplied, so only accept known values —
    // everything else falls back to the default landing_page source.
    const validatedSource =
      typeof source === "string" &&
      /^share-(visionary|alchemist|seeker|phoenix)$/.test(source)
        ? source
        : "landing_page";

    // Validate all required fields
    const hasName = name && typeof name === "string" && name.trim();
    const hasEmail = email && typeof email === "string" && email.trim();
    const hasPhone = phone && typeof phone === "string" && phone.trim();

    if (!hasName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!hasEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Phone is optional: the pop-up (the flow approved for A2P 10DLC) sends
    // one with an SMS consent choice; the email-first form on the page sends
    // name and email only. A phone that is sent is still validated below.
    if (phone != null && phone !== "" && typeof phone !== "string") {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 },
      );
    }

    // Cap field lengths — this endpoint is unauthenticated, so unbounded
    // strings are a cheap storage/DoS vector.
    if (
      name.length > 200 ||
      email.length > 320 ||
      (hasPhone && phone.length > 20) ||
      (smsConsentLanguage != null &&
        (typeof smsConsentLanguage !== "string" ||
          smsConsentLanguage.length > 1000))
    ) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    // Note: smsConsent is optional per Twilio A2P 10DLC compliance
    // Users can submit without consenting - we store the consent status
    // and only send SMS to users who have sms_consent = true

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate phone format, when one was given
    if (hasPhone) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 },
        );
      }
    }

    // Check if Supabase is configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.log("Lead captured (Supabase not configured):", {
        name,
        email,
        phone,
      });
      return NextResponse.json(
        { success: true, message: "Lead captured" },
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

    // Capture consent IP from request headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const consentIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : (request.headers.get("x-real-ip") ?? "unknown");

    // Insert lead into database. SMS consent only means something alongside
    // a phone number, so an email-only signup records consent as false (with
    // when and from where, as the quiz does for its phone-less leads).
    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: hasPhone ? phone.trim() : null,
      source: validatedSource,
      sms_consent: hasPhone ? smsConsent === true : false,
      sms_consent_timestamp: new Date().toISOString(),
      sms_consent_ip: consentIp,
      sms_consent_language: hasPhone ? (smsConsentLanguage ?? null) : null,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already on the waitlist" },
          { status: 409 },
        );
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Lead captured" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
