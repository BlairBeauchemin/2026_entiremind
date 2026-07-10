import { NextResponse } from "next/server";
import { requireFounderAndTestRun, errorResponse } from "@/lib/simulator/guard";
import { runRemainingDays } from "@/lib/simulator/engine";

// A full week is ~7 generation + ~7 persona + ~5 enrichment calls.
export const maxDuration = 300;

/**
 * POST /api/founder/simulator/runs/[id]/run-week
 * Batch mode: run every remaining day, auto-committing persona proposals.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireFounderAndTestRun(id);
  if ("response" in gate) return gate.response;

  try {
    const days = await runRemainingDays(id);
    return NextResponse.json({ days });
  } catch (err) {
    return errorResponse(err);
  }
}
