import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceView } from "@/components/space/space-view";
import type { Affirmation } from "@/lib/affirmations";

export const dynamic = "force-dynamic";

/**
 * The Space. Reads the user's affirmations and their active intention, then
 * hands both to the client surface.
 *
 * The intention is loaded even when affirmations exist, because it is the
 * fallback focus line: a user who has written nothing yet still gets a space
 * with their own words in it rather than an empty screen.
 */
export default async function SpacePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already gates this route; this is the defence for a direct hit
  // that somehow bypassed it, and it keeps the queries below non-nullable.
  if (!user) redirect("/auth");

  const [affirmationsResult, intentionResult] = await Promise.all([
    supabase
      .from("affirmations")
      .select("id, text, source, position")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("intentions")
      .select("text")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const affirmations: Affirmation[] = (affirmationsResult.data ?? []).map(
    (row) => ({
      id: row.id,
      text: row.text,
      source: row.source,
      position: row.position,
    }),
  );

  return (
    <SpaceView
      affirmations={affirmations}
      intention={intentionResult.data?.text ?? null}
      // Seeds the backdrop stars, so a person's sky is the same every visit.
      skySeed={user.id}
    />
  );
}
