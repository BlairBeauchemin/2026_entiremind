import { NextResponse } from "next/server";
import { requireFounderAndTestRun, errorResponse } from "@/lib/simulator/guard";
import { stepDay } from "@/lib/simulator/engine";

// One generation + one persona call; give it room for slow model responses.
export const maxDuration = 120;

/**
 * POST /api/founder/simulator/runs/[id]/step
 * Run the next day up to the review point (outbound generated + persona
 * proposal, nothing committed).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireFounderAndTestRun(id);
  if ("response" in gate) return gate.response;

  try {
    const day = await stepDay(id);
    return NextResponse.json({ day });
  } catch (err) {
    return errorResponse(err);
  }
}
