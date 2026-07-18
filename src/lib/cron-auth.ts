import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/**
 * Shared CRON_SECRET gate for /api/cron/* routes. Vercel Cron sends
 * `Authorization: Bearer <CRON_SECRET>`; anything else is rejected.
 * Returns the error response to send, or null when authorized.
 */
export function requireCronAuth(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const authorized =
    actual.length === expected.length && timingSafeEqual(actual, expected);

  if (!authorized) {
    console.error("Invalid cron authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
