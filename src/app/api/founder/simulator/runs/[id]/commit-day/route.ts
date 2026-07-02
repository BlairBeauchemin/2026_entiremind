import { NextResponse } from "next/server";
import { requireFounderAndTestRun, errorResponse } from "@/lib/simulator/guard";
import { commitDay } from "@/lib/simulator/engine";

export const maxDuration = 60;

/**
 * POST /api/founder/simulator/runs/[id]/commit-day
 * Body: { action: 'reply' | 'silence', text?: string }
 * Commit the pending day with the persona's proposal or the founder's edit.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireFounderAndTestRun(id);
  if ("response" in gate) return gate.response;

  let body: { action?: unknown; text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action =
    body.action === "reply" || body.action === "silence" ? body.action : null;
  if (!action) {
    return NextResponse.json(
      { error: "action must be 'reply' or 'silence'" },
      { status: 400 },
    );
  }
  const text = typeof body.text === "string" ? body.text : null;

  try {
    const day = await commitDay(id, action, text);
    return NextResponse.json({ day });
  } catch (err) {
    return errorResponse(err);
  }
}
