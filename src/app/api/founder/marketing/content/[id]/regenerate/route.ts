import { NextResponse } from "next/server";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { regenerateMedia } from "@/lib/marketing/pipeline/regenerate";

export const maxDuration = 300;

/**
 * POST /api/founder/marketing/content/[id]/regenerate
 * Re-run image generation from the piece's current (possibly edited)
 * image_prompt.
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
  const result = await regenerateMedia(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ assetId: result.assetId, publicUrl: result.publicUrl });
}
