import { NextResponse } from "next/server";
import { generateEditionDraft, pushEditionToProvider } from "@/lib/editions";

export const maxDuration = 60;

/**
 * Weekly Edition Draft Cron: generate this week's themed email edition
 * (3 quotes + AI reflection + question) and push it into the email campaign
 * provider (ActiveCampaign) as a draft. The founder reviews, tweaks, and
 * sends it from the provider's UI — nothing is ever sent automatically.
 *
 * Runs Mondays via Vercel Cron.
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

  const draft = await generateEditionDraft();
  console.log(`Weekly edition draft: ${draft.status}`, draft.detail ?? "");

  if (draft.status === "failed" || !draft.editionId) {
    return NextResponse.json(
      { success: false, draft, duration_ms: Date.now() - startTime },
      { status: draft.status === "failed" ? 500 : 200 },
    );
  }

  const push = await pushEditionToProvider(draft.editionId);
  console.log(
    `Weekly edition push: ${push.status}`,
    push.campaignId ? `campaign ${push.campaignId}` : (push.detail ?? ""),
  );

  return NextResponse.json(
    {
      success: push.status === "pushed",
      draft,
      push,
      duration_ms: Date.now() - startTime,
    },
    { status: push.status === "pushed" ? 200 : 500 },
  );
}
