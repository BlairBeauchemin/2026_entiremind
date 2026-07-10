import { NextResponse } from "next/server";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { publishContentPiece } from "@/lib/marketing/pipeline/publish";
import { logAudit } from "@/lib/audit";

export const maxDuration = 300;

/**
 * POST /api/founder/marketing/content/[id]/publish
 * Publish an approved or scheduled piece immediately (organic post or ad
 * launch), bypassing the publish cron's schedule.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: founderErrorStatus(auth.error) });
  }

  const { id } = await params;
  const result = await publishContentPiece(id, { allowApproved: true });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await logAudit(auth.userId, "publish_content", "content_piece", id, {
    status: result.status,
    placeholder: result.placeholder ?? false,
  });

  return NextResponse.json({ status: result.status, placeholder: result.placeholder ?? false });
}
