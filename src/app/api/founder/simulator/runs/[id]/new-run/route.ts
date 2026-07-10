import { NextResponse } from "next/server";
import { requireFounderAndTestRun, errorResponse } from "@/lib/simulator/guard";
import { newRun } from "@/lib/simulator/engine";

/**
 * POST /api/founder/simulator/runs/[id]/new-run
 * Body: { pinnedPromptId?: string | null }
 * A/B mechanic: archive this run (snapshots stay readable), wipe live state,
 * open a fresh run for the same persona pinned to the given prompt version.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireFounderAndTestRun(id);
  if ("response" in gate) return gate.response;

  let body: { pinnedPromptId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }
  const pinnedPromptId =
    typeof body.pinnedPromptId === "string"
      ? body.pinnedPromptId
      : body.pinnedPromptId === null
        ? null
        : undefined;

  try {
    const result = await newRun(id, pinnedPromptId);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
