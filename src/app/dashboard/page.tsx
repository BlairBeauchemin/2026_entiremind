import { createClient } from "@/lib/supabase/server";
import { CurrentIntention } from "@/components/dashboard/current-intention";
import { MessageFeed } from "@/components/dashboard/message-feed";
import { PersonaCard } from "@/components/dashboard/persona-card";
import { ArchetypeBanner } from "@/components/dashboard/archetype-banner";
import { QuoteOfTheDay } from "@/components/dashboard/quote-of-the-day";
import { pickDeterministicQuote, mapCategoryToQuoteThemes } from "@/lib/quotes";
import type { Quote } from "@/lib/quotes/types";
import type { Message } from "@/lib/types";
import type { PersonaProfile } from "@/lib/persona/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let profile = null;
  let currentIntention = null;
  let messages: Message[] = [];
  let personaProfile: PersonaProfile | null = null;
  let dailyQuote: Quote | null = null;

  if (authUser) {
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    profile = userData;

    // Persona profile (Onboarding v2) — renders a calm archetype card when present.
    const { data: personaRow } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (personaRow) {
      personaProfile = {
        archetype: personaRow.archetype,
        motivation_orientation: personaRow.motivation_orientation,
        change_style: personaRow.change_style,
        primary_distortion: personaRow.primary_distortion,
        secondary_distortion: personaRow.secondary_distortion,
        distortion_scores: personaRow.distortion_scores ?? {},
        core_values: personaRow.core_values ?? [],
        tone_preference: personaRow.tone_preference,
        intention_category: personaRow.intention_category,
      };
    }

    // Quote for today: deterministic per user per day, themed to the
    // user's intention category when a persona profile exists.
    const { data: quoteRows } = await supabase
      .from("quotes")
      .select("id, text, author, theme")
      .eq("active", true);

    if (quoteRows && quoteRows.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      dailyQuote = pickDeterministicQuote(
        quoteRows as Quote[],
        `${authUser.id}-${today}`,
        mapCategoryToQuoteThemes(personaProfile?.intention_category ?? null),
      );
    }

    // Fetch the user's active intention
    const { data: intentionData } = await supabase
      .from("intentions")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (intentionData) {
      currentIntention = {
        id: intentionData.id,
        userId: intentionData.user_id,
        text: intentionData.text,
        status: intentionData.status as "active" | "completed",
        createdAt: intentionData.created_at,
      };

      // Fetch messages from the current intention's start date onwards
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", authUser.id)
        .gte("created_at", intentionData.created_at)
        .order("created_at", { ascending: false });

      if (messagesData) {
        messages = messagesData.map((m) => ({
          id: m.id,
          userId: m.user_id,
          direction: m.direction as "inbound" | "outbound",
          type: (m.type || "reflection") as
            | "reflection"
            | "check-in"
            | "prompt"
            | "reply",
          body: m.text,
          createdAt: m.created_at,
        }));
      }
    }
  }

  const firstName = profile?.name?.split(" ")[0] || "there";

  // Invite onboarded users who haven't taken the archetype quiz yet (and
  // haven't dismissed the nudge). Banner persistence survives devices.
  const showArchetypeBanner =
    !!profile?.onboarding_completed &&
    !personaProfile &&
    !profile?.archetype_banner_dismissed_at;

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
        {getGreeting()}, {firstName}
      </h1>

      {/* Archetype discovery nudge (Onboarding v2 backfill) */}
      {showArchetypeBanner && <ArchetypeBanner />}

      {/* Current intention card */}
      {currentIntention && <CurrentIntention intention={currentIntention} />}

      {/* Quote for today */}
      {dailyQuote && <QuoteOfTheDay quote={dailyQuote} />}

      {/* Persona card (Onboarding v2) — only when the user has a profile */}
      {personaProfile && (
        <PersonaCard profile={personaProfile} name={firstName} />
      )}

      <MessageFeed messages={messages} />
    </div>
  );
}
