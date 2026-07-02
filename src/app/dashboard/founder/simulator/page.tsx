export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { SimulatorClient } from "@/components/dashboard/simulator/simulator-client";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";

/**
 * Founder-only messaging simulator: create test personas, replay a simulated
 * week of the real messaging loop, and iterate on the system prompt — all
 * in-app, no SMS.
 */
export default async function SimulatorPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/auth");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  const isAdmin = ["admin", "founder"].includes(userProfile?.role ?? "");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const serviceSupabase = createServiceRoleClient();

  const [{ data: personas }, { data: prompts }] = await Promise.all([
    serviceSupabase
      .from("users")
      .select("id, name, created_at")
      .eq("is_test", true)
      .order("created_at", { ascending: false }),
    serviceSupabase
      .from("system_prompts")
      .select("id, name, body, notes, is_active, created_at, updated_at")
      .order("created_at", { ascending: false }),
  ]);

  const personaIds = (personas ?? []).map((p) => p.id);
  const { data: runs } = personaIds.length
    ? await serviceSupabase
        .from("sim_runs")
        .select(
          "id, user_id, status, start_date, current_day, total_days, pinned_prompt_id, persona_brief, reply_style, created_at",
        )
        .in("user_id", personaIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const initialPersonas = (personas ?? []).map((p) => ({
    id: p.id,
    name: p.name as string | null,
    created_at: p.created_at as string,
    runs: (runs ?? []).filter((r) => r.user_id === p.id),
  }));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-3xl text-navy">Messaging Simulator</h1>
          <Link
            href="/dashboard/founder"
            className="text-sm text-teal-900/60 hover:text-teal-900 transition-colors"
          >
            ← Founder dashboard
          </Link>
        </div>
        <p className="text-sm text-teal-900/60 mt-2 max-w-xl">
          Create test personas, replay a week of the real messaging loop, and
          refine the system prompt — nothing here sends SMS.
        </p>
      </div>

      <SimulatorClient
        initialPersonas={initialPersonas}
        initialPrompts={prompts ?? []}
        builtInPromptBody={SYSTEM_PROMPT}
      />
    </div>
  );
}
