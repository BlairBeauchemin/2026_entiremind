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
    <div className="min-h-screen bg-cream text-teal-900 font-sans relative selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-em-purple-300/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-em-yellow-400/8 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6">
          <Link
            href="/dashboard"
            className="font-serif text-2xl font-medium tracking-[2px] text-navy"
          >
            Entiremind
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8">
              <ArchetypeFlow name={firstName} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
