import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  getEmailCampaignAdapter,
  type CampaignContact,
} from "@/lib/email-campaigns";

export const maxDuration = 300;

/**
 * Email Contact Sync Cron: upsert active users and waitlist leads into the
 * email campaign provider's list (tagged 'user' / 'lead') so the weekly
 * edition audience stays current. Unsubscribes are handled entirely by the
 * provider — contacts who opted out there stay opted out; re-syncing an
 * existing contact does not resubscribe them.
 *
 * Runs daily via Vercel Cron.
 * Security: Protected by CRON_SECRET header (Vercel adds this automatically)
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("Invalid cron authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const [
    { data: users, error: usersError },
    { data: leads, error: leadsError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("email, name")
      .eq("status", "active")
      .not("email", "is", null),
    supabase.from("leads").select("email, name, source, archetype"),
  ]);

  if (usersError || leadsError) {
    console.error("Failed to fetch recipients:", usersError ?? leadsError);
    return NextResponse.json(
      { error: "Failed to fetch recipients" },
      { status: 500 },
    );
  }

  // Dedupe by lowercased email; a lead who became a user is tagged 'user'.
  // Quiz-driven leads additionally carry 'quiz-lead' + their archetype so
  // nurture automations in the provider can segment without any code here.
  const contacts = new Map<string, CampaignContact>();
  for (const lead of leads ?? []) {
    if (!lead.email) continue;
    const email = lead.email.toLowerCase().trim();
    const tags = ["lead"];
    if (lead.archetype) {
      tags.push("quiz-lead", `archetype-${lead.archetype}`);
    }
    contacts.set(email, {
      email,
      name: lead.name ?? undefined,
      tags,
    });
  }
  for (const user of users ?? []) {
    if (!user.email) continue;
    const email = user.email.toLowerCase().trim();
    contacts.set(email, {
      email,
      name: user.name ?? undefined,
      tags: ["user"],
    });
  }

  if (contacts.size === 0) {
    return NextResponse.json({ success: true, synced: 0, failed: 0 });
  }

  const adapter = getEmailCampaignAdapter();
  const result = await adapter.syncContacts([...contacts.values()]);

  const duration = Date.now() - startTime;
  console.log(
    `Contact sync (${adapter.provider}): ${result.synced} synced, ${result.failed} failed in ${duration}ms`,
  );
  if (result.errors.length > 0) {
    console.error("Contact sync errors:", result.errors.slice(0, 10));
  }

  return NextResponse.json({
    success: result.failed === 0,
    provider: adapter.provider,
    total: contacts.size,
    synced: result.synced,
    failed: result.failed,
    duration_ms: duration,
    errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
  });
}
