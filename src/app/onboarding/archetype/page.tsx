import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArchetypeFlow } from "@/components/onboarding/archetype-flow";

/**
 * Shortened archetype-discovery flow for existing users (Milestone 5 backfill).
 * Reached from the dashboard banner or the persona card's "retake" link.
 */
export default async function ArchetypePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  const firstName = userData?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-linen text-ink font-sans relative selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient gradients */}

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6">
          <Link
            href="/dashboard"
            className="font-serif text-2xl tracking-[2px] text-ink"
          >
            Entiremind
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="bg-surface rounded-sm border border-rule p-8">
              <ArchetypeFlow name={firstName} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
