import { NextResponse } from "next/server";
import { requireFounderAndTestRun, errorResponse } from "@/lib/simulator/guard";
import { resetRun } from "@/lib/simulator/engine";

/**
 * POST /api/founder/simulator/runs/[id]/reset
 * Full reset: wipe the run's simulated messages/signals, reseed memory from
 * onboarding, rewind to day 0.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireFounderAndTestRun(id);
  if ("response" in gate) return gate.response;

  try {
    await resetRun(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
