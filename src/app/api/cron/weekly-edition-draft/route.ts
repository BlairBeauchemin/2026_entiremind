import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
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

  const authError = requireCronAuth(request);
  if (authError) return authError;

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
