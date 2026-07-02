import { NextResponse } from "next/server";
import { createServiceRoleClient } from "../supabase";
import { requireFounder, founderErrorStatus } from "../founder/auth";

/**
 * Shared gate for simulator run routes: founder auth + the target run must
 * belong to an is_test persona (mutations must never touch real users).
 */
export async function requireFounderAndTestRun(
  runId: string,
): Promise<{ userId: string } | { response: NextResponse }> {
  const auth = await requireFounder();
  if ("error" in auth) {
    return {
      response: NextResponse.json(
        { error: auth.error },
        { status: founderErrorStatus(auth.error) },
      ),
    };
  }

  const supabase = createServiceRoleClient();
  const { data: run } = await supabase
    .from("sim_runs")
    .select("user_id, users:user_id!inner(is_test)")
    .eq("id", runId)
    .maybeSingle();

  if (!run) {
    return {
      response: NextResponse.json({ error: "Run not found" }, { status: 404 }),
    };
  }
  const user = run.users as unknown as { is_test: boolean } | null;
  if (!user?.is_test) {
    return {
      response: NextResponse.json(
        { error: "Run does not belong to a test persona" },
        { status: 403 },
      ),
    };
  }
  return { userId: run.user_id };
}

export function errorResponse(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}
